-- ============================================================
-- PART 8
-- INSERT SAMPLE BRANCHES
-- ============================================================

-- Insert Colombo Main Branch
-- We use a specific hardcoded UUID here so that it exactly matches the 
-- default 'branchId' placed in the frontend registration form.
WITH new_address AS (
    INSERT INTO address (address_line1, city, province, postal_code, country)
    VALUES ('100 Main St', 'Colombo', 'Western', '10100', 'Sri Lanka')
    RETURNING address_id
),
new_contact AS (
    INSERT INTO contact DEFAULT VALUES
    RETURNING contact_id
)
INSERT INTO branch (branch_id, branch_name, address_id, contact_id, opened_date)
SELECT 
    '123e4567-e89b-12d3-a456-426614174000'::uuid, 
    'Colombo Main Branch', 
    a.address_id, 
    c.contact_id, 
    '2024-01-01'
FROM new_address a, new_contact c;

-- Insert Kandy Branch (another sample)
WITH new_address AS (
    INSERT INTO address (address_line1, city, province, postal_code, country)
    VALUES ('45 Temple Road', 'Kandy', 'Central', '20000', 'Sri Lanka')
    RETURNING address_id
),
new_contact AS (
    INSERT INTO contact DEFAULT VALUES
    RETURNING contact_id
)
INSERT INTO branch (branch_id, branch_name, address_id, contact_id, opened_date)
SELECT 
    '987fcdeb-51a2-43d7-9012-345678901234'::uuid, 
    'Kandy Regional Branch', 
    a.address_id, 
    c.contact_id, 
    '2024-02-15'
FROM new_address a, new_contact c;
