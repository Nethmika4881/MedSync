-- The doctor can now edit every field of their profile from the Settings page.
-- 1. v_doctor_profile also exposes nic, dob and gender (appended; existing columns keep their order).
-- 2. sp_update_doctor_profile takes the whole profile and validates the rules the schema cannot
--    express as one message: unique email / NIC / licence number, active branch, fee >= 0.

CREATE OR REPLACE VIEW v_doctor_profile AS
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
      WHERE ds.doctor_id = d.doctor_id)            AS specializations,
    ad.address_line1,
    ad.address_line2,
    ad.city,
    ad.province,
    ad.postal_code,
    u.nic,
    u.dob,
    u.gender::TEXT                                 AS gender
FROM doctor d
JOIN employee e ON e.employee_id = d.doctor_id
JOIN app_user u ON u.user_id     = d.doctor_id
JOIN branch   b ON b.branch_id   = e.branch_id
JOIN address  ad ON ad.address_id = u.address_id;

-- The signature changes again, so drop the V25 version first.
DROP PROCEDURE IF EXISTS sp_update_doctor_profile(
    UUID, VARCHAR, VARCHAR, INT, BOOLEAN, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR
);

CREATE PROCEDURE sp_update_doctor_profile(
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

    -- One specialization per doctor (V24). An empty value clears it.
    IF COALESCE(TRIM(p_specialization), '') = '' THEN
        DELETE FROM doctor_specialization WHERE doctor_id = p_doctor_id;
    ELSE
        SELECT specialization_id INTO v_spec_id
          FROM specialization
         WHERE LOWER(title) = LOWER(TRIM(p_specialization));

        IF v_spec_id IS NULL THEN
            INSERT INTO specialization (title) VALUES (TRIM(p_specialization))
            RETURNING specialization_id INTO v_spec_id;
        END IF;

        DELETE FROM doctor_specialization
         WHERE doctor_id = p_doctor_id AND specialization_id <> v_spec_id;

        INSERT INTO doctor_specialization (doctor_id, specialization_id)
        VALUES (p_doctor_id, v_spec_id)
        ON CONFLICT (doctor_id, specialization_id) DO NOTHING;
    END IF;
END;
$$;
