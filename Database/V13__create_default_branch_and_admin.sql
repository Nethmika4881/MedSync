-- Create default branch and admin account
-- This migration ensures a default branch exists before creating the admin user,
-- fixing the silent skip in V13 which ran before any branch data existed.

DO $$
DECLARE
    new_address_id      UUID;
    new_contact_id      UUID;
    new_user_id         UUID;
    default_branch_id   UUID;
    branch_address_id   UUID;
    branch_contact_id   UUID;
BEGIN
    -- ── 1. Ensure a default branch exists ──────────────────────────────────
    SELECT branch_id INTO default_branch_id FROM branch LIMIT 1;

    IF default_branch_id IS NULL THEN
        INSERT INTO address (address_line1, address_line2, city, province, postal_code, country)
        VALUES ('Main Branch HQ', '', 'Colombo', 'Western', '10000', 'Sri Lanka')
        RETURNING address_id INTO branch_address_id;

        INSERT INTO contact DEFAULT VALUES
        RETURNING contact_id INTO branch_contact_id;

        INSERT INTO contact_number (contact_id, number_type, number)
        VALUES (branch_contact_id, 'Work', '0112000000');

        INSERT INTO branch (branch_name, address_id, contact_id, opened_date)
        VALUES ('Main Branch', branch_address_id, branch_contact_id, CURRENT_DATE)
        RETURNING branch_id INTO default_branch_id;
    END IF;

    -- ── 2. Create default admin (if not already present) ───────────────────
    IF NOT EXISTS (SELECT 1 FROM app_user WHERE email = 'admin@medsync.com') THEN

        INSERT INTO address (address_line1, address_line2, city, province, postal_code, country)
        VALUES ('AdminHQ', '', 'Colombo', 'Western', '10000', 'Sri Lanka')
        RETURNING address_id INTO new_address_id;

        INSERT INTO contact DEFAULT VALUES
        RETURNING contact_id INTO new_contact_id;

        INSERT INTO contact_number (contact_id, number_type, number)
        VALUES (new_contact_id, 'Mobile', '0770000000');

        INSERT INTO app_user (address_id, contact_id, user_type, full_name, nic, email, gender, dob, password_hash)
        VALUES (
            new_address_id,
            new_contact_id,
            'Employee',
            'System Admin',
            '199000000000',
            'admin@medsync.com',
            'Male',
            '1990-01-01',
            'placeholder_hash'
        )
        RETURNING user_id INTO new_user_id;

        INSERT INTO employee (employee_id, branch_id, role, joined_date)
        VALUES (new_user_id, default_branch_id, 'Admin', CURRENT_DATE);
    END IF;
END $$;
