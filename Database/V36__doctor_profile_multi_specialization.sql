-- A doctor can hold several specializations (V35 dropped uq_doctor_one_specialization).
-- sp_update_doctor_profile used to treat p_specialization as ONE title and delete every other
-- specialization row. The Settings page loads v_doctor_profile.specializations ("A, B") and
-- sends it straight back, so saving the profile collapsed it into a single bogus
-- specialization called "A, B".
--
-- p_specialization is now a comma-separated list. Same signature, so callers are unchanged.
-- An empty value still clears every specialization.

CREATE OR REPLACE PROCEDURE sp_update_doctor_profile(
    p_doctor_id        UUID,
    p_room_no          VARCHAR,
    p_qualification    VARCHAR,
    p_years_experience INT,
    p_is_available     BOOLEAN,
    p_phone            VARCHAR,
    p_address_line1    VARCHAR,
    p_address_line2    VARCHAR,
    p_city             VARCHAR,
    p_province         VARCHAR,
    p_postal_code      VARCHAR,
    p_full_name        VARCHAR,
    p_email            VARCHAR,
    p_nic              VARCHAR,
    p_dob              DATE,
    p_gender           VARCHAR,
    p_licence_no       VARCHAR,
    p_consultation_fee NUMERIC,
    p_branch_id        UUID,
    p_specialization   VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_contact_id UUID;
    v_address_id UUID;
    v_spec_id    UUID;
    v_title      TEXT;
    v_keep       UUID[] := ARRAY[]::UUID[];
BEGIN
    IF COALESCE(TRIM(p_full_name), '') = '' THEN
        RAISE EXCEPTION 'Full name is required.';
    END IF;
    IF COALESCE(TRIM(p_address_line1), '') = '' OR COALESCE(TRIM(p_city), '') = '' THEN
        RAISE EXCEPTION 'Address line 1 and city are required.';
    END IF;
    IF COALESCE(TRIM(p_licence_no), '') = '' THEN
        RAISE EXCEPTION 'Medical licence number is required.';
    END IF;
    IF p_consultation_fee IS NULL OR p_consultation_fee < 0 THEN
        RAISE EXCEPTION 'Consultation fee cannot be negative.';
    END IF;
    IF p_dob IS NULL OR p_dob > CURRENT_DATE THEN
        RAISE EXCEPTION 'Date of birth must be a past date.';
    END IF;

    IF EXISTS (SELECT 1 FROM app_user WHERE LOWER(email) = LOWER(TRIM(p_email)) AND user_id <> p_doctor_id) THEN
        RAISE EXCEPTION 'That email address is already used by another account.';
    END IF;
    IF EXISTS (SELECT 1 FROM app_user WHERE nic = TRIM(p_nic) AND user_id <> p_doctor_id) THEN
        RAISE EXCEPTION 'That NIC is already registered to another account.';
    END IF;
    IF EXISTS (SELECT 1 FROM doctor WHERE medical_licence_no = TRIM(p_licence_no) AND doctor_id <> p_doctor_id) THEN
        RAISE EXCEPTION 'That licence number is already registered to another doctor.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM branch WHERE branch_id = p_branch_id AND is_active IS NOT FALSE) THEN
        RAISE EXCEPTION 'Choose an active branch.';
    END IF;

    UPDATE doctor
       SET room_no            = NULLIF(TRIM(p_room_no), ''),
           qualification      = NULLIF(TRIM(p_qualification), ''),
           years_experience   = p_years_experience,
           is_available       = p_is_available,
           medical_licence_no = TRIM(p_licence_no),
           consultation_fee   = p_consultation_fee,
           updated_at         = NOW()
     WHERE doctor_id = p_doctor_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Doctor profile not found.';
    END IF;

    UPDATE employee
       SET branch_id = p_branch_id,
           updated_at = NOW()
     WHERE employee_id = p_doctor_id;

    UPDATE app_user
       SET full_name  = TRIM(p_full_name),
           email      = LOWER(TRIM(p_email)),
           nic        = TRIM(p_nic),
           dob        = p_dob,
           gender     = p_gender::gender_enum,
           updated_at = NOW()
     WHERE user_id = p_doctor_id
    RETURNING contact_id, address_id INTO v_contact_id, v_address_id;

    IF p_phone IS NOT NULL AND TRIM(p_phone) <> '' THEN
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

    UPDATE address
       SET address_line1 = TRIM(p_address_line1),
           address_line2 = NULLIF(TRIM(p_address_line2), ''),
           city          = TRIM(p_city),
           province      = NULLIF(TRIM(p_province), ''),
           postal_code   = NULLIF(TRIM(p_postal_code), ''),
           updated_at    = NOW()
     WHERE address_id = v_address_id;

    -- Comma-separated list of specializations. Empty clears all of them.
    IF COALESCE(TRIM(p_specialization), '') = '' THEN
        DELETE FROM doctor_specialization WHERE doctor_id = p_doctor_id;
    ELSE
        FOR v_title IN
            SELECT DISTINCT TRIM(t)
              FROM UNNEST(STRING_TO_ARRAY(p_specialization, ',')) AS t
             WHERE TRIM(t) <> ''
        LOOP
            SELECT specialization_id INTO v_spec_id
              FROM specialization
             WHERE LOWER(title) = LOWER(v_title);

            IF v_spec_id IS NULL THEN
                INSERT INTO specialization (title) VALUES (v_title)
                RETURNING specialization_id INTO v_spec_id;
            END IF;

            INSERT INTO doctor_specialization (doctor_id, specialization_id)
            VALUES (p_doctor_id, v_spec_id)
            ON CONFLICT (doctor_id, specialization_id) DO NOTHING;

            v_keep := v_keep || v_spec_id;
        END LOOP;

        -- Only what the doctor listed stays.
        DELETE FROM doctor_specialization
         WHERE doctor_id = p_doctor_id
           AND specialization_id <> ALL (v_keep);
    END IF;
END;
$$;
