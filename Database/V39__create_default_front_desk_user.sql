DO $$
DECLARE
    target_branch_id      UUID;
    new_address_id        UUID;
    new_contact_id        UUID;
    new_user_id           UUID;
    existing_user_id      UUID;
    existing_user_role    employee_role_enum;
BEGIN
    SELECT u.user_id, e.role
    INTO existing_user_id, existing_user_role
    FROM app_user u
    LEFT JOIN employee e ON e.employee_id = u.user_id
    WHERE u.email = 'frontdesk@medsync.com';

    IF existing_user_id IS NOT NULL THEN
        IF existing_user_role IS DISTINCT FROM 'FrontDesk'::employee_role_enum THEN
            RAISE EXCEPTION
                'frontdesk@medsync.com already exists but is not a front desk employee';
        END IF;

        RETURN;
    END IF;

    SELECT e.branch_id
    INTO target_branch_id
    FROM app_user u
    JOIN employee e ON e.employee_id = u.user_id
    WHERE u.email = 'admin@medsync.com'
      AND e.is_active = TRUE
    LIMIT 1;

    IF target_branch_id IS NULL THEN
        SELECT b.branch_id
        INTO target_branch_id
        FROM branch b
        ORDER BY b.is_active DESC, b.created_at ASC, b.branch_id ASC
        LIMIT 1;
    END IF;

    IF target_branch_id IS NULL THEN
        RAISE EXCEPTION 'A branch must exist before creating the default front desk user';
    END IF;

    INSERT INTO address (
        address_line1,
        address_line2,
        city,
        province,
        postal_code,
        country
    )
    VALUES (
        'Default Front Desk',
        '',
        'Colombo',
        'Western',
        '10000',
        'Sri Lanka'
    )
    RETURNING address_id INTO new_address_id;

    INSERT INTO contact DEFAULT VALUES
    RETURNING contact_id INTO new_contact_id;

    INSERT INTO contact_number (
        contact_id,
        number_type,
        number,
        is_primary
    )
    VALUES (
        new_contact_id,
        'Work',
        '0112000001',
        TRUE
    );

    INSERT INTO app_user (
        address_id,
        contact_id,
        user_type,
        full_name,
        nic,
        email,
        gender,
        dob,
        password_hash,
        salt,
        is_active
    )
    VALUES (
        new_address_id,
        new_contact_id,
        'Employee',
        'Default Front Desk',
        '200000000001',
        'frontdesk@medsync.com',
        'Other',
        '2000-01-01',
        'c20040d3b12cc17e020b8dcdac7b2834ff5b5dafa907a60878416a374498f35d73458c82f0f6e26c539197185f05c2c6ca4341e4aaa092812c98cd726df2f08b',
        'mx9OM4mf7LRDXiYwIJ4n',
        TRUE
    )
    RETURNING user_id INTO new_user_id;

    INSERT INTO employee (
        employee_id,
        branch_id,
        role,
        joined_date,
        is_active
    )
    VALUES (
        new_user_id,
        target_branch_id,
        'FrontDesk',
        CURRENT_DATE,
        TRUE
    );
END;
$$;
