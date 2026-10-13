-- Assign a non-doctor employee to branches without managers.
UPDATE branch b
SET manager_id = (
    SELECT e.employee_id
    FROM employee e
    WHERE e.branch_id = b.branch_id
      AND e.is_active = TRUE
      AND e.role <> 'Doctor'
    ORDER BY
        CASE WHEN e.role = 'Admin' THEN 0 ELSE 1 END,
        e.joined_date ASC
    LIMIT 1
)
WHERE b.manager_id IS NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM branch
        WHERE is_active = TRUE
          AND manager_id IS NULL
    ) THEN
        RAISE EXCEPTION 'Every active branch must have a manager';
    END IF;
END $$;

-- Inactive draft branches may temporarily has no manager.
ALTER TABLE branch
ADD CONSTRAINT chk_active_branch_has_manager
CHECK (is_active IS NOT TRUE OR manager_id IS NOT NULL);