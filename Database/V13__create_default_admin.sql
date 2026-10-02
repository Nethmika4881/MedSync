-- Create default admin account
-- Email: admin@medsync.com
-- Password: admin123

DO $$
DECLARE
    new_address_id UUID;
    new_contact_id UUID;
    new_user_id UUID;
    default_branch_id UUID;
BEGIN
    -- Check if admin already exists
    IF NOT EXISTS (SELECT 1 FROM app_user WHERE email = 'admin@medsync.com') THEN
        
        -- Get the first available branch
        SELECT branch_id INTO default_branch_id FROM branch LIMIT 1;
        
        IF default_branch_id IS NOT NULL THEN
            -- 1. Create Address
            INSERT INTO address (address_line1, address_line2, city, province, postal_code, country)
            VALUES ('AdminHQ', '', 'Colombo', 'Western', '10000', 'Sri Lanka')
            RETURNING address_id INTO new_address_id;

            -- 2. Create Contact
            INSERT INTO contact DEFAULT VALUES
            RETURNING contact_id INTO new_contact_id;

            INSERT INTO contact_number (contact_id, number)
            VALUES (new_contact_id, '0770000000');

            -- 3. Create App User
            INSERT INTO app_user (salt, address_id, contact_id, user_type, full_name, nic, email, gender, dob, password_hash)
            VALUES (
                'TPXYuE4bXTpZsWl9XZOU',
                new_address_id,
                new_contact_id,
                'Employee',
                'System Admin',
                '199000000000',
                'admin@medsync.com',
                'Male',
                '1990-01-01',
                '1d4e383b62364282555dccae91e0e5b86601efe104f4fa1459933a0abf540a35744593ad4385c5446e3544cfd45a8d178d4b97e72a6e72593f440d6b375eca33'
            )
            RETURNING user_id INTO new_user_id;

            -- 4. Create Employee Record (Role: Admin)
            INSERT INTO employee (employee_id, branch_id, role, joined_date)
            VALUES (new_user_id, default_branch_id, 'Admin', CURRENT_DATE);
        END IF;
    END IF;
END $$;
