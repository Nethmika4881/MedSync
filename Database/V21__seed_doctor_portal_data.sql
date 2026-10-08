-- V21: Doctor Portal dev seed data (runs as a normal Flyway migration).
-- Creates a doctor, three patients, medications, treatments and sample appointments.
--
-- Login:  doctor@example.com / password123   (patients share the same password)

CREATE FUNCTION pg_temp.seed_user(
    p_name   TEXT,
    p_nic    TEXT,
    p_email  TEXT,
    p_type   user_type_enum,
    p_gender gender_enum,
    p_dob    DATE,
    p_phone  TEXT
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_id      UUID;
    v_address UUID;
    v_contact UUID;
BEGIN
    SELECT user_id INTO v_id FROM app_user WHERE email = p_email;
    IF v_id IS NOT NULL THEN
        RETURN v_id;
    END IF;

    INSERT INTO address (address_line1, city, country)
    VALUES ('12 Seed Lane', 'Colombo', 'Sri Lanka')
    RETURNING address_id INTO v_address;

    INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO v_contact;

    INSERT INTO contact_number (contact_id, number_type, number, is_primary)
    VALUES (v_contact, 'Mobile', p_phone, TRUE);

    -- password123 (same salt/hash as the V15 mock patient)
    INSERT INTO app_user (salt, address_id, contact_id, user_type, full_name, nic, email, gender, dob, password_hash)
    VALUES (
        'mx9OM4mf7LRDXiYwIJ4n', v_address, v_contact, p_type, p_name, p_nic, p_email, p_gender, p_dob,
        'c20040d3b12cc17e020b8dcdac7b2834ff5b5dafa907a60878416a374498f35d73458c82f0f6e26c539197185f05c2c6ca4341e4aaa092812c98cd726df2f08b'
    )
    RETURNING user_id INTO v_id;

    RETURN v_id;
END;
$$;

DO $$
DECLARE
    v_branch  UUID;
    v_doctor  UUID;
    v_spec    UUID;
    v_p1      UUID;
    v_p2      UUID;
    v_p3      UUID;
    v_p4      UUID;
    v_dow     INT;
    v_day     INT;
    v_today   DATE := (NOW() AT TIME ZONE 'Asia/Colombo')::DATE;
    v_slot    UUID;
    v_past    UUID;
    v_appt    UUID;
    v_amox    UUID;
    v_para    UUID;
    v_cbc     UUID;
BEGIN
    SELECT branch_id INTO v_branch FROM branch ORDER BY created_at LIMIT 1;
    IF v_branch IS NULL THEN
        RAISE EXCEPTION 'No branch found. Run the Flyway migrations first.';
    END IF;

    -- Doctor
    v_doctor := pg_temp.seed_user('Dr. Nimal Perera', '198012345678', 'doctor@example.com',
                                  'Employee', 'Male', '1980-03-12', '0711111111');
    INSERT INTO employee (employee_id, branch_id, role, salary, joined_date)
    VALUES (v_doctor, v_branch, 'Doctor', 250000, '2015-01-01')
    ON CONFLICT (employee_id) DO NOTHING;
    INSERT INTO doctor (doctor_id, room_no, medical_licence_no, consultation_fee, years_experience, qualification)
    VALUES (v_doctor, '12', 'SLMC-10234', 2500, 11, 'MBBS, MD (General Medicine)')
    ON CONFLICT (doctor_id) DO NOTHING;

    INSERT INTO specialization (title, other_details) VALUES ('General Medicine', 'Adult primary care')
    ON CONFLICT (title) DO NOTHING;
    SELECT specialization_id INTO v_spec FROM specialization WHERE title = 'General Medicine';
    INSERT INTO doctor_specialization (doctor_id, specialization_id, certification_date)
    VALUES (v_doctor, v_spec, '2014-06-01')
    ON CONFLICT DO NOTHING;

    -- Working hours Monday to Friday, 09:00-13:00
    FOR v_day IN 1..5 LOOP
        IF NOT EXISTS (SELECT 1 FROM doctor_schedule WHERE doctor_id = v_doctor AND day_of_week = v_day) THEN
            INSERT INTO doctor_schedule (doctor_id, branch_id, day_of_week, start_time, end_time, slot_duration_minutes)
            VALUES (v_doctor, v_branch, v_day, '09:00', '13:00', 15);
        END IF;
    END LOOP;

    -- Patients
    v_p1 := pg_temp.seed_user('Kamal Silva',     '199012345671', 'kamal@example.com',  'Patient', 'Male',   '1990-02-10', '0772000001');
    v_p2 := pg_temp.seed_user('Nadeesha Fernando','198812345672', 'nadeesha@example.com','Patient', 'Female', '1988-07-21', '0772000002');
    v_p3 := pg_temp.seed_user('Ruwan Jayasinghe', '197512345673', 'ruwan@example.com',  'Patient', 'Male',   '1975-11-03', '0772000003');
    v_p4 := pg_temp.seed_user('John Doe',         '199500000000', 'patient@example.com','Patient', 'Male',   '1995-05-15', '0771234567');
    INSERT INTO patient (patient_id, blood_group, registered_branch_id, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship)
    VALUES (v_p1, 'A+',  v_branch, 'Sunil Silva',    '0773000001', 'Brother'),
           (v_p2, 'O-',  v_branch, 'Anura Fernando', '0773000002', 'Husband'),
           (v_p3, 'B+',  v_branch, 'Kumari Jayasinghe', '0773000003', 'Wife'),
           (v_p4, 'O+',  v_branch, NULL, NULL, NULL)
    ON CONFLICT (patient_id) DO NOTHING;

    -- Medications (contraindications text is what the consultation screen warns about)
    INSERT INTO medication (generic_name, brand_name, strength, form, category, contraindications)
    SELECT * FROM (VALUES
        ('Amoxicillin',  'Amoxil',   '500mg', 'Capsule', 'Antibiotic',     'Penicillin allergy, severe renal impairment'),
        ('Paracetamol',  'Panadol',  '500mg', 'Tablet',  'Analgesic',      NULL),
        ('Ibuprofen',    'Brufen',   '400mg', 'Tablet',  'NSAID',          'NSAID or aspirin allergy, asthma, peptic ulcer'),
        ('Cetirizine',   'Zyrtec',   '10mg',  'Tablet',  'Antihistamine',  NULL)
    ) AS m(generic_name, brand_name, strength, form, category, contraindications)
    WHERE NOT EXISTS (SELECT 1 FROM medication x WHERE x.generic_name = m.generic_name);
    SELECT medication_id INTO v_amox FROM medication WHERE generic_name = 'Amoxicillin' LIMIT 1;
    SELECT medication_id INTO v_para FROM medication WHERE generic_name = 'Paracetamol' LIMIT 1;

    -- Treatment catalogue
    INSERT INTO treatment_catalogue (category, treatment_name, base_price, description)
    SELECT * FROM (VALUES
        ('Laboratory'::treatment_category_enum, 'Complete Blood Count',  1500.00, 'Full blood count with differential'),
        ('Radiology'::treatment_category_enum,  'Chest X-Ray',           3500.00, 'PA view chest radiograph'),
        ('Procedure'::treatment_category_enum,  'ECG',                   2000.00, '12-lead electrocardiogram'),
        ('Injection'::treatment_category_enum,  'IM Injection',           800.00, 'Intramuscular injection administration')
    ) AS t(category, treatment_name, base_price, description)
    WHERE NOT EXISTS (SELECT 1 FROM treatment_catalogue x WHERE x.treatment_name = t.treatment_name);
    SELECT treatment_service_code INTO v_cbc FROM treatment_catalogue WHERE treatment_name = 'Complete Blood Count' LIMIT 1;

    -- Today's session with a mixed queue
    INSERT INTO time_slot (doctor_id, branch_id, available_date, start_time, end_time, max_tickets)
    VALUES (v_doctor, v_branch, v_today, '09:00', '13:00', 16)
    ON CONFLICT ON CONSTRAINT idx_doctor_session_overlap DO NOTHING;
    SELECT time_slot_id INTO v_slot FROM time_slot
     WHERE doctor_id = v_doctor AND available_date = v_today AND start_time = '09:00' AND end_time = '13:00';

    INSERT INTO appointment (time_slot_id, patient_id, queue_number, status, source, reason_for_visit, consultation_started_at, checked_in_at)
    SELECT v_slot, x.patient, x.q, x.status::appointment_status_enum, x.source::appointment_source_enum, x.reason,
           CASE WHEN x.status = 'InProgress' THEN NOW() END,
           CASE WHEN x.status IN ('CheckedIn', 'InProgress') THEN NOW() END
    FROM (VALUES
        (v_p1, 1, 'Scheduled',  'Booked', 'Persistent cough for two weeks'),
        (v_p2, 2, 'CheckedIn',  'Booked', 'Follow-up on blood pressure'),
        (v_p3, 3, 'InProgress', 'Walkin', 'Chest tightness and fatigue'),
        (v_p4, 4, 'Scheduled',  'Booked', 'Skin rash on forearms')
    ) AS x(patient, q, status, source, reason)
    WHERE NOT EXISTS (SELECT 1 FROM appointment a WHERE a.time_slot_id = v_slot AND a.queue_number = x.q);

    -- Tomorrow's session
    INSERT INTO time_slot (doctor_id, branch_id, available_date, start_time, end_time, max_tickets)
    VALUES (v_doctor, v_branch, v_today + 1, '09:00', '13:00', 16)
    ON CONFLICT ON CONSTRAINT idx_doctor_session_overlap DO NOTHING;
    SELECT time_slot_id INTO v_slot FROM time_slot
     WHERE doctor_id = v_doctor AND available_date = v_today + 1 AND start_time = '09:00' AND end_time = '13:00';
    INSERT INTO appointment (time_slot_id, patient_id, queue_number, reason_for_visit)
    SELECT v_slot, v_p1, 1, 'Review of lab results'
    WHERE NOT EXISTS (SELECT 1 FROM appointment a WHERE a.time_slot_id = v_slot AND a.queue_number = 1);

    -- A completed visit last week, with record, orders, prescription and invoice
    INSERT INTO time_slot (doctor_id, branch_id, available_date, start_time, end_time, max_tickets)
    VALUES (v_doctor, v_branch, v_today - 7, '09:00', '13:00', 16)
    ON CONFLICT ON CONSTRAINT idx_doctor_session_overlap DO NOTHING;
    SELECT time_slot_id INTO v_past FROM time_slot
     WHERE doctor_id = v_doctor AND available_date = v_today - 7 AND start_time = '09:00' AND end_time = '13:00';

    IF NOT EXISTS (SELECT 1 FROM appointment WHERE time_slot_id = v_past AND queue_number = 1) THEN
        INSERT INTO appointment (time_slot_id, patient_id, queue_number, reason_for_visit)
        VALUES (v_past, v_p1, 1, 'Fever and sore throat')
        RETURNING appointment_id INTO v_appt;

        INSERT INTO consultation_record (appointment_id, symptoms, diagnosis, notes, follow_up_required, follow_up_date)
        VALUES (v_appt, 'Fever for 3 days, sore throat', 'Acute tonsillitis', 'Rest, fluids, review if fever persists.', TRUE, v_today + 1);

        INSERT INTO appointment_treatment (appointment_id, treatment_service_code, performed_by, quantity, unit_price, line_total, status, performed_at)
        VALUES (v_appt, v_cbc, v_doctor, 1, 1500.00, 1500.00, 'Completed', NOW() - INTERVAL '7 days');

        INSERT INTO prescription (appointment_id, medication_id, dosage, frequency, duration_days, notes, allergy_checked)
        VALUES (v_appt, v_amox, '500mg', 'Three times daily', 5, 'Take after meals', TRUE),
               (v_appt, v_para, '500mg', 'As needed',         3, 'Max 4 tablets per day', TRUE);

        UPDATE appointment SET status = 'Completed' WHERE appointment_id = v_appt;

        INSERT INTO invoice (appointment_id, patient_id, gross_amount, net_amount, due_amount)
        VALUES (v_appt, v_p1, 4000.00, 4000.00, 4000.00);
    END IF;
END $$;
