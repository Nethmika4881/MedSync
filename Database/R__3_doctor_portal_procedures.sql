CREATE OR REPLACE PROCEDURE sp_start_consultation(
    p_appointment_id UUID,
    p_doctor_id      UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_status appointment_status_enum;
    v_doctor UUID;
BEGIN
    SELECT a.status, ts.doctor_id
      INTO v_status, v_doctor
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
        UPDATE appointment
        SET status = 'InProgress'
        WHERE appointment_id = p_appointment_id;
    END IF;
END;
$$;


CREATE OR REPLACE PROCEDURE sp_save_consultation(
    p_appointment_id     UUID,
    p_doctor_id          UUID,
    p_symptoms           TEXT,
    p_diagnosis          TEXT,
    p_notes              TEXT,
    p_follow_up_required BOOLEAN,
    p_follow_up_date     DATE,
    p_treatments         JSONB,
    p_prescriptions      JSONB,
    INOUT p_consultation_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_status       appointment_status_enum;
    v_doctor       UUID;
    v_expected     INT;
    v_inserted     INT;
    v_treatments   JSONB := COALESCE(p_treatments,    '[]'::jsonb);
    v_prescriptions JSONB := COALESCE(p_prescriptions, '[]'::jsonb);
BEGIN
    -- Lock the appointment row so two requests can't edit it at once.
    SELECT a.status, ts.doctor_id
      INTO v_status, v_doctor
    FROM appointment a
    JOIN time_slot ts ON ts.time_slot_id = a.time_slot_id
    WHERE a.appointment_id = p_appointment_id
    FOR UPDATE OF a;

    IF NOT FOUND OR v_doctor <> p_doctor_id THEN
        RAISE EXCEPTION 'Appointment not found for this doctor';
    END IF;

    IF v_status NOT IN ('Scheduled', 'CheckedIn', 'InProgress') THEN
        RAISE EXCEPTION 'This consultation is % and can no longer be edited', v_status;
    END IF;

    IF COALESCE(p_follow_up_required, FALSE) AND p_follow_up_date IS NULL THEN
        RAISE EXCEPTION 'Pick a follow-up date or untick follow-up';
    END IF;

    -- Friendly validation before anything is written.
    IF EXISTS (
        SELECT 1 FROM jsonb_to_recordset(v_treatments) AS t(quantity INT)
        WHERE COALESCE(t.quantity, 0) < 1
    ) THEN
        RAISE EXCEPTION 'Every treatment needs a quantity of at least 1';
    END IF;

    IF EXISTS (
        SELECT 1 FROM jsonb_to_recordset(v_prescriptions) AS p(dosage TEXT, duration_days INT)
        WHERE COALESCE(TRIM(p.dosage), '') = '' OR COALESCE(p.duration_days, 0) < 1
    ) THEN
        RAISE EXCEPTION 'Every prescription needs a dosage and a duration of at least 1 day';
    END IF;

    -- 1. consultation record
    INSERT INTO consultation_record
        (appointment_id, symptoms, diagnosis, notes, follow_up_required, follow_up_date)
    VALUES (
        p_appointment_id,
        NULLIF(TRIM(p_symptoms),  ''),
        NULLIF(TRIM(p_diagnosis), ''),
        NULLIF(TRIM(p_notes),     ''),
        COALESCE(p_follow_up_required, FALSE),
        CASE WHEN COALESCE(p_follow_up_required, FALSE) THEN p_follow_up_date END
    )
    ON CONFLICT (appointment_id) DO UPDATE SET
        symptoms           = EXCLUDED.symptoms,
        diagnosis          = EXCLUDED.diagnosis,
        notes              = EXCLUDED.notes,
        follow_up_required = EXCLUDED.follow_up_required,
        follow_up_date     = EXCLUDED.follow_up_date
    RETURNING consultation_rec_id INTO p_consultation_id;

    -- 2. treatment orders: replace the ones nobody has started yet
    DELETE FROM appointment_treatment
    WHERE appointment_id = p_appointment_id
      AND status = 'Ordered';

    INSERT INTO appointment_treatment
        (appointment_id, treatment_service_code, quantity, unit_price, line_total, notes)
    SELECT
        p_appointment_id,
        tc.treatment_service_code,
        t.quantity,
        tc.base_price,
        tc.base_price * t.quantity,
        NULLIF(TRIM(t.notes), '')
    FROM jsonb_to_recordset(v_treatments)
         AS t(treatment_service_code UUID, quantity INT, notes TEXT)
    JOIN treatment_catalogue tc
      ON tc.treatment_service_code = t.treatment_service_code
     AND tc.is_active IS NOT FALSE;

    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    v_expected := jsonb_array_length(v_treatments);
    IF v_inserted <> v_expected THEN
        RAISE EXCEPTION 'A selected treatment is not in the active catalogue';
    END IF;

    -- 3. prescriptions: replace all
    DELETE FROM prescription WHERE appointment_id = p_appointment_id;

    INSERT INTO prescription
        (appointment_id, medication_id, dosage, frequency, duration_days, notes, allergy_checked)
    SELECT
        p_appointment_id,
        m.medication_id,
        TRIM(p.dosage),
        NULLIF(TRIM(p.frequency), ''),
        p.duration_days,
        NULLIF(TRIM(p.notes), ''),
        COALESCE(p.allergy_checked, FALSE)
    FROM jsonb_to_recordset(v_prescriptions)
         AS p(medication_id UUID, dosage TEXT, frequency TEXT,
              duration_days INT, notes TEXT, allergy_checked BOOLEAN)
    JOIN medication m
      ON m.medication_id = p.medication_id
     AND m.is_active IS NOT FALSE;

    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    v_expected := jsonb_array_length(v_prescriptions);
    IF v_inserted <> v_expected THEN
        RAISE EXCEPTION 'A selected medication is not in the active catalogue';
    END IF;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_complete_consultation(
    p_appointment_id     UUID,
    p_doctor_id          UUID,
    p_symptoms           TEXT,
    p_diagnosis          TEXT,
    p_notes              TEXT,
    p_follow_up_required BOOLEAN,
    p_follow_up_date     DATE,
    p_treatments         JSONB,
    p_prescriptions      JSONB,
    INOUT p_invoice_id   UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_consultation_id UUID;
    v_patient_id      UUID;
    v_total           NUMERIC;
BEGIN
    IF COALESCE(TRIM(p_diagnosis), '') = '' THEN
        RAISE EXCEPTION 'A diagnosis is required to complete the consultation';
    END IF;

    CALL sp_save_consultation(
        p_appointment_id, p_doctor_id,
        p_symptoms, p_diagnosis, p_notes,
        p_follow_up_required, p_follow_up_date,
        p_treatments, p_prescriptions,
        v_consultation_id
    );

    -- Lock the visit. From here the lock_completed_consultation trigger
    -- rejects any further change to the record, prescriptions or orders.
    UPDATE appointment
    SET status = 'Completed'
    WHERE appointment_id = p_appointment_id
    RETURNING patient_id INTO v_patient_id;

    v_total := fn_consultation_total(p_appointment_id);

    INSERT INTO invoice
        (appointment_id, patient_id, gross_amount, net_amount, due_amount)
    VALUES
        (p_appointment_id, v_patient_id, v_total, v_total, v_total)
    ON CONFLICT (appointment_id) DO NOTHING
    RETURNING invoice_id INTO p_invoice_id;

    IF p_invoice_id IS NULL THEN
        SELECT invoice_id INTO p_invoice_id
        FROM invoice
        WHERE appointment_id = p_appointment_id;
    END IF;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_update_doctor_profile(
    p_doctor_id        UUID,
    p_room_no          VARCHAR,
    p_qualification    VARCHAR,
    p_years_experience INT,
    p_is_available     BOOLEAN,
    p_phone            VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_contact_id UUID;
BEGIN
    UPDATE doctor
       SET room_no          = NULLIF(TRIM(p_room_no), ''),
           qualification    = NULLIF(TRIM(p_qualification), ''),
           years_experience = p_years_experience,
           is_available     = p_is_available,
           updated_at       = NOW()
     WHERE doctor_id = p_doctor_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Doctor profile not found.';
    END IF;

    IF p_phone IS NOT NULL AND TRIM(p_phone) <> '' THEN
        SELECT contact_id INTO v_contact_id FROM app_user WHERE user_id = p_doctor_id;

        UPDATE contact_number
           SET number = TRIM(p_phone)
         WHERE contact_number_id = (
                SELECT contact_number_id FROM contact_number
                 WHERE contact_id = v_contact_id
                 ORDER BY is_primary DESC NULLS LAST, contact_number_id
                 LIMIT 1);

        IF NOT FOUND THEN
            INSERT INTO contact_number (contact_id, number_type, number, is_primary)
            VALUES (v_contact_id, 'Mobile', TRIM(p_phone), TRUE);
        END IF;
    END IF;
END;
$$;
