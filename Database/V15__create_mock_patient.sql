DO $$
DECLARE
    new_address_id UUID;
    new_contact_id UUID;
    new_user_id UUID;
    default_branch_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM app_user WHERE email = 'patient@example.com') THEN
     
        SELECT branch_id INTO default_branch_id FROM branch LIMIT 1;

        IF default_branch_id IS NULL THEN
            INSERT INTO address (address_line1, city, country) VALUES ('Branch St', 'Colombo', 'Sri Lanka') RETURNING address_id INTO new_address_id;
            INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO new_contact_id;
            INSERT INTO branch (branch_name, address_id, contact_id) VALUES ('Main Branch', new_address_id, new_contact_id) RETURNING branch_id INTO default_branch_id;
        END IF;

        INSERT INTO address (address_line1, city, country)
        VALUES ('123 Mock Street', 'Colombo', 'Sri Lanka')
        RETURNING address_id INTO new_address_id;

        INSERT INTO contact DEFAULT VALUES
        RETURNING contact_id INTO new_contact_id;

        INSERT INTO contact_number (contact_id, number_type, number)
        VALUES (new_contact_id, 'Mobile', '0771234567');

        -- password123
        INSERT INTO app_user (salt, address_id, contact_id, user_type, full_name, nic, email, gender, dob, password_hash)
        VALUES (
            'mx9OM4mf7LRDXiYwIJ4n',
            new_address_id,
            new_contact_id,
            'Patient',
            'John Doe',
            '199500000000',
            'patient@example.com',
            'Male',
            '1995-05-15',
            'c20040d3b12cc17e020b8dcdac7b2834ff5b5dafa907a60878416a374498f35d73458c82f0f6e26c539197185f05c2c6ca4341e4aaa092812c98cd726df2f08b'
        )
        RETURNING user_id INTO new_user_id;

        INSERT INTO patient (patient_id, blood_group, registered_branch_id)
        VALUES (new_user_id, 'O+', default_branch_id);

    END IF;
END $$;
