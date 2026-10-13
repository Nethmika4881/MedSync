DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM branch b
        LEFT JOIN employee e ON e.employee_id = b.manager_id
        WHERE b.manager_id IS NOT NULL
          AND (
              e.employee_id IS NULL
              OR e.branch_id IS DISTINCT FROM b.branch_id
              OR e.is_active IS NOT TRUE
              OR e.role = 'Doctor'
          )
    ) THEN
        RAISE EXCEPTION 'Existing branch manager assignments must be corrected before applying this migration';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION fn_validate_branch_manager()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.manager_id IS NULL THEN
        IF NEW.is_active IS TRUE THEN
            RAISE EXCEPTION 'Every active branch must have a manager';
        END IF;

        RETURN NEW;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM employee e
        WHERE e.employee_id = NEW.manager_id
          AND e.branch_id = NEW.branch_id
          AND e.is_active = TRUE
          AND e.role <> 'Doctor'
    ) THEN
        RAISE EXCEPTION 'A branch manager must be an active non doctor employee of the same branch';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER validate_branch_manager
BEFORE INSERT OR UPDATE OF manager_id, is_active ON branch
FOR EACH ROW EXECUTE FUNCTION fn_validate_branch_manager();

CREATE OR REPLACE FUNCTION fn_protect_branch_manager_employee()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF EXISTS (
            SELECT 1 FROM branch b WHERE b.manager_id = OLD.employee_id
        ) THEN
            RAISE EXCEPTION 'Assign another branch manager before deleting this employee';
        END IF;

        RETURN OLD;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM branch b
        WHERE b.manager_id = OLD.employee_id
          AND (
              NEW.branch_id IS DISTINCT FROM b.branch_id
              OR NEW.is_active IS NOT TRUE
              OR NEW.role = 'Doctor'
          )
    ) THEN
        RAISE EXCEPTION 'Assign another branch manager before changing this employee';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER protect_branch_manager_employee
BEFORE UPDATE OF branch_id, is_active, role OR DELETE ON employee
FOR EACH ROW EXECUTE FUNCTION fn_protect_branch_manager_employee();
