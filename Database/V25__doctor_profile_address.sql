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
    ad.postal_code
FROM doctor d
JOIN employee e ON e.employee_id = d.doctor_id
JOIN app_user u ON u.user_id     = d.doctor_id
JOIN branch   b ON b.branch_id   = e.branch_id
JOIN address  ad ON ad.address_id = u.address_id;

DROP PROCEDURE IF EXISTS sp_update_doctor_profile(UUID, VARCHAR, VARCHAR, INT, BOOLEAN, VARCHAR);

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
    p_postal_code      VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_contact_id UUID;
    v_address_id UUID;
BEGIN
    IF COALESCE(TRIM(p_address_line1), '') = '' OR COALESCE(TRIM(p_city), '') = '' THEN
        RAISE EXCEPTION 'Address line 1 and city are required.';
    END IF;

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

    SELECT contact_id, address_id INTO v_contact_id, v_address_id
      FROM app_user WHERE user_id = p_doctor_id;

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
END;
$$;
