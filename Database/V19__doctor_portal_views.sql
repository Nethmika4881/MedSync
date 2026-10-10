DROP VIEW IF EXISTS v_doctor_queue;

CREATE VIEW v_doctor_queue AS
SELECT
    a.appointment_id,
    a.patient_id,
    pu.full_name                                   AS patient_name,
    ts.doctor_id,
    du.full_name                                   AS doctor_name,
    ts.branch_id,
    b.branch_name,
    ts.available_date,
    ts.start_time,
    a.queue_number,
    fn_ticket_minutes(ts.start_time, ts.end_time, ts.max_tickets) AS ticket_minutes,
    ts.available_date + ts.start_time
        + ((a.queue_number - 1)
           * fn_ticket_minutes(ts.start_time, ts.end_time, ts.max_tickets)) * INTERVAL '1 minute'
                                                   AS estimated_time,
    a.status,
    a.source,
    COALESCE(a.reason_for_visit, a.notes)          AS reason,
    d.consultation_fee,
    a.checked_in_at,
    a.consultation_started_at
FROM appointment a
JOIN time_slot ts ON ts.time_slot_id = a.time_slot_id
JOIN branch    b  ON b.branch_id     = ts.branch_id
JOIN app_user  pu ON pu.user_id      = a.patient_id
JOIN app_user  du ON du.user_id      = ts.doctor_id
JOIN doctor    d  ON d.doctor_id     = ts.doctor_id;

DROP VIEW IF EXISTS v_consultation_history;

CREATE VIEW v_consultation_history AS
SELECT
    cr.consultation_rec_id,
    cr.appointment_id,
    ts.doctor_id,
    a.patient_id,
    pu.full_name                                   AS patient_name,
    ts.available_date                              AS consultation_date,
    cr.symptoms,
    cr.diagnosis,
    cr.notes,
    cr.follow_up_required,
    cr.follow_up_date,
    a.status                                       AS appointment_status,
    CASE
        WHEN a.status <> 'Completed' THEN 'Draft'
        WHEN cr.follow_up_required   THEN 'Follow-up'
        ELSE 'Completed'
    END                                            AS record_status,
    (SELECT COUNT(*) FROM appointment_treatment at
      WHERE at.appointment_id = a.appointment_id)  AS treatment_count,
    (SELECT COUNT(*) FROM prescription p
      WHERE p.appointment_id = a.appointment_id)   AS prescription_count
FROM consultation_record cr
JOIN appointment a  ON a.appointment_id = cr.appointment_id
JOIN time_slot   ts ON ts.time_slot_id  = a.time_slot_id
JOIN app_user    pu ON pu.user_id       = a.patient_id;


DROP VIEW IF EXISTS v_doctor_weekly_schedule;

CREATE VIEW v_doctor_weekly_schedule AS
SELECT
    ds.schedule_id,
    ds.doctor_id,
    ds.branch_id,
    b.branch_name,
    ds.day_of_week,
    (ARRAY['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'])[ds.day_of_week + 1]
                                                   AS day_name,
    ds.start_time,
    ds.end_time,
    ds.slot_duration_minutes
FROM doctor_schedule ds
JOIN branch b ON b.branch_id = ds.branch_id;


DROP VIEW IF EXISTS v_doctor_profile;

CREATE VIEW v_doctor_profile AS
SELECT
    d.doctor_id,
    u.full_name,
    u.email,
    d.medical_licence_no,
    d.room_no,
    d.qualification,
    d.years_experience,
    d.consultation_fee,
    d.is_available,
    e.branch_id,
    b.branch_name,
    (SELECT cn.number
       FROM contact_number cn
      WHERE cn.contact_id = u.contact_id
      ORDER BY cn.is_primary DESC NULLS LAST, cn.contact_number_id
      LIMIT 1)                                     AS phone,
    (SELECT STRING_AGG(s.title, ', ' ORDER BY s.title)
       FROM doctor_specialization ds
       JOIN specialization s ON s.specialization_id = ds.specialization_id
      WHERE ds.doctor_id = d.doctor_id)            AS specializations
FROM doctor d
JOIN employee e ON e.employee_id = d.doctor_id
JOIN app_user u ON u.user_id     = d.doctor_id
JOIN branch   b ON b.branch_id   = e.branch_id;

DROP VIEW IF EXISTS v_doctor_patients;

CREATE VIEW v_doctor_patients AS
SELECT
    ts.doctor_id,
    a.patient_id,
    pu.full_name                                   AS patient_name,
    fn_age_years(pu.dob)                           AS age,
    pu.gender::TEXT                                AS gender,
    p.blood_group,
    COUNT(*)                                       AS visit_count,
    MAX(ts.available_date)                         AS last_visit_date
FROM appointment a
JOIN time_slot ts ON ts.time_slot_id = a.time_slot_id
JOIN app_user  pu ON pu.user_id      = a.patient_id
JOIN patient   p  ON p.patient_id    = a.patient_id
WHERE a.status NOT IN ('Cancelled', 'Rescheduled')
GROUP BY ts.doctor_id, a.patient_id, pu.full_name, pu.dob, pu.gender, p.blood_group;
