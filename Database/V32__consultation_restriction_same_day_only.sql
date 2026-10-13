CREATE OR REPLACE PROCEDURE sp_start_consultation(
    p_appointment_id UUID,
    p_doctor_id      UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_status          appointment_status_enum;
    v_doctor          UUID;
    v_date            DATE;
    v_current_patient TEXT;
BEGIN
    PERFORM 1 FROM doctor WHERE doctor_id = p_doctor_id FOR UPDATE;

    SELECT a.status, ts.doctor_id, ts.available_date
      INTO v_status, v_doctor, v_date
    FROM appointment a
    JOIN time_slot ts ON ts.time_slot_id = a.time_slot_id
    WHERE a.appointment_id = p_appointment_id
    FOR UPDATE OF a;

    IF NOT FOUND OR v_doctor <> p_doctor_id THEN
        RAISE EXCEPTION 'Appointment not found for this doctor';
    END IF;

    IF v_status NOT IN ('Scheduled', 'CheckedIn', 'InProgress') THEN
        RAISE EXCEPTION 'A % appointment cannot be started', v_status;
    END IF;

    IF v_status <> 'InProgress' THEN
        SELECT pu.full_name
          INTO v_current_patient
        FROM appointment a2
        JOIN time_slot ts2 ON ts2.time_slot_id = a2.time_slot_id
        JOIN app_user  pu  ON pu.user_id       = a2.patient_id
        WHERE ts2.doctor_id = p_doctor_id
          AND ts2.available_date = v_date
          AND a2.status = 'InProgress'
          AND a2.appointment_id <> p_appointment_id
        ORDER BY a2.consultation_started_at NULLS LAST
        LIMIT 1;

        IF FOUND THEN
            RAISE EXCEPTION 'Finish your current consultation with % before starting another.', v_current_patient;
        END IF;

        UPDATE appointment
        SET status = 'InProgress'
        WHERE appointment_id = p_appointment_id;
    END IF;
END;
$$;
