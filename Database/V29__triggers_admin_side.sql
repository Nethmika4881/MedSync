/* if an admin try to delete a branch while it has active appointments */
CREATE OR REPLACE FUNCTION trg_branch_delete()
RETURNS TRIGGER AS $$
DECLARE
    active_count INT;
BEGIN
    IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
        SELECT COUNT(*)
        INTO active_count
        FROM appointment a
        JOIN time_slot t ON a.time_slot_id = t.time_slot_id
        WHERE t.branch_id = NEW.branch_id
          AND a.status = 'Scheduled'
          AND t.available_date >= CURRENT_DATE;

        IF active_count > 0 THEN
            RAISE EXCEPTION 'Cannot deactivate branch: % upcoming active appointment(s) are scheduled here.', active_count;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_branch_delete ON branch;

CREATE TRIGGER trg_branch_delete
BEFORE UPDATE OF status ON branch
FOR EACH ROW
EXECUTE FUNCTION trg_branch_delete();

/* if an admin try to remove a doctor from a branch while he is having scheduled appointments */
CREATE OR REPLACE FUNCTION trg_doctor_removal()
RETURNS TRIGGER AS $$
DECLARE
    active_count INT;
BEGIN
    SELECT COUNT(*)
    INTO active_count
    FROM appointment a
    JOIN time_slot t ON a.time_slot_id = t.time_slot_id
    WHERE t.doctor_id = OLD.doctor_id
      AND t.branch_id = OLD.branch_id
      AND a.status = 'Scheduled'
      AND t.available_date >= CURRENT_DATE;
    

    IF active_count > 0 THEN
        RAISE EXCEPTION 'Cannot remove doctor from this branch schedule: % active appointment(s) are already booked for this session. Reassign or cancel them first.', active_count;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_doctor_removal ON doctor_schedule;

CREATE TRIGGER trg_doctor_removal
BEFORE DELETE ON doctor_schedule
FOR EACH ROW
EXECUTE FUNCTION trg_doctor_removal();

/*if an admin deactivate the insurance package while a patient is submitting for that insurance package */
CREATE OR REPLACE FUNCTION trg_inactive_package()
RETURNS TRIGGER AS $$
DECLARE
    is_package_active BOOLEAN;
BEGIN
    SELECT is_active 
    INTO is_package_active
    FROM insurance_package
    WHERE insurance_package_id = NEW.insurance_package_id;

    IF is_package_active IS DISTINCT FROM TRUE THEN
        RAISE EXCEPTION 'Cannot enroll: This insurance package is inactive or no longer offered.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inactive_package ON insurance;

CREATE TRIGGER trg_inactive_package
BEFORE INSERT ON insurance
FOR EACH ROW
EXECUTE FUNCTION trg_inactive_package();

/* if an admin try to deactivate an insurance package that a patient has not clamied yet */
CREATE OR REPLACE FUNCTION insurance_package_deactivation()
RETURNS TRIGGER AS $$
DECLARE
    pending INT;
BEGIN
    IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
        SELECT COUNT(*)
        INTO pending
        FROM insurance_claim ic
        JOIN insurance i ON ic.insurance_id = i.insurance_id
        WHERE i.insurance_package_id = NEW.insurance_package_id
          AND ic.status = 'Submitted';

        IF pending > 0 THEN
            RAISE EXCEPTION 'Cannot deactivate insurance package: % unsettled claim(s) are currently pending review under this package.', v_pending_claims;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_insurance_package_deactivation ON insurance_package;

CREATE TRIGGER trg_insurance_package_deactivation
BEFORE UPDATE OF is_active ON insurance_package
FOR EACH ROW
EXECUTE FUNCTION insurance_package_deactivation();