-- keep updated_at
CREATE FUNCTION trg_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON appointment
FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON consultation_record
FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON doctor_schedule
FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- Completed appointment can never be re opend and status changes stamp their own timestamps
CREATE FUNCTION trg_appointment_status_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status = 'Completed' AND NEW.status IS DISTINCT FROM 'Completed' THEN
        RAISE EXCEPTION 'Appointment % is already completed and cannot change status',
            OLD.appointment_id;
    END IF;

    IF NEW.status = 'CheckedIn' AND NEW.checked_in_at IS NULL THEN
        NEW.checked_in_at := NOW();
    END IF;

    IF NEW.status = 'InProgress' AND NEW.consultation_started_at IS NULL THEN
        NEW.consultation_started_at := NOW();
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER appointment_status_guard
BEFORE UPDATE OF status ON appointment
FOR EACH ROW EXECUTE FUNCTION trg_appointment_status_guard();

-- Complete consultation should be read only
CREATE FUNCTION trg_lock_completed_consultation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_appointment_id UUID;
    v_status appointment_status_enum;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_appointment_id := OLD.appointment_id;
    ELSE
        v_appointment_id := NEW.appointment_id;
    END IF;

    SELECT status INTO v_status
    FROM appointment
    WHERE appointment_id = v_appointment_id;

    IF v_status = 'Completed' THEN
        IF TG_TABLE_NAME = 'appointment_treatment' AND TG_OP = 'UPDATE' THEN
            IF NEW.appointment_id = OLD.appointment_id
               AND NEW.treatment_service_code = OLD.treatment_service_code
               AND NEW.quantity IS NOT DISTINCT FROM OLD.quantity
               AND NEW.unit_price = OLD.unit_price
               AND NEW.line_total = OLD.line_total
            THEN
                RETURN NEW;
            END IF;
        END IF;

        RAISE EXCEPTION 'The consultation for appointment % is completed and locked',
            v_appointment_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER lock_completed_consultation
BEFORE INSERT OR UPDATE OR DELETE ON consultation_record
FOR EACH ROW EXECUTE FUNCTION trg_lock_completed_consultation();

CREATE TRIGGER lock_completed_consultation
BEFORE INSERT OR UPDATE OR DELETE ON prescription
FOR EACH ROW EXECUTE FUNCTION trg_lock_completed_consultation();

CREATE TRIGGER lock_completed_consultation
BEFORE INSERT OR UPDATE OR DELETE ON appointment_treatment
FOR EACH ROW EXECUTE FUNCTION trg_lock_completed_consultation();

-- Doctor cannot work two overlapping slots on the same day and even at same branches 
CREATE FUNCTION trg_doctor_schedule_no_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.end_time <= NEW.start_time THEN
        RAISE EXCEPTION 'End time must be after start time';
    END IF;

    IF NEW.day_of_week NOT BETWEEN 0 AND 6 THEN
        RAISE EXCEPTION 'day_of_week must be between 0 (Sunday) and 6 (Saturday)';
    END IF;

    IF fn_schedule_overlaps(NEW.doctor_id, NEW.day_of_week, NEW.start_time, NEW.end_time, NEW.schedule_id) THEN
        RAISE EXCEPTION 'These working hours overlap an existing slot on the same day (any branch)';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER doctor_schedule_no_overlap
BEFORE INSERT OR UPDATE ON doctor_schedule
FOR EACH ROW EXECUTE FUNCTION trg_doctor_schedule_no_overlap();