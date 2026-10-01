ALTER TABLE treatment_catalogue ADD CONSTRAINT chk_base_price CHECK (base_price >= 0);
ALTER TABLE doctor ADD CONSTRAINT chk_consultation_fee CHECK (consultation_fee >= 0);
ALTER TABLE invoice ADD CONSTRAINT chk_amounts CHECK (gross_amount >= 0 AND net_amount >= 0);
ALTER TABLE time_slot ADD CONSTRAINT chk_max_tickets CHECK (max_tickets >= 0);

CREATE OR REPLACE FUNCTION update_at() 
RETURN TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_treatment_catalogue_update_at BEFORE UPDATE ON treatment_catalogue FOR EACH ROW EXECUTE FUNCTION update_at();
CREATE TRIGGER trg_app_user_update_at BEFORE UPDATE ON app_user FOR EACH ROW EXECUTE FUNCTION update_at();
CREATE TRIGGER trg_branch_update_at BEFORE UPDATE ON branch FOR EACH ROW EXECUTE FUNCTION update_at();
CREATE TRIGGER trg_time_slot_update_at BEFORE UPDATE ON time_slot FOR EACH ROW EXECUTE FUNCTION update_at();
CREATE TRIGGER trg_appointment_update_at BEFORE UPDATE ON appointment FOR EACH ROW EXECUTE FUNCTION update_at();
CREATE TRIGGER trg_invoice_update_at BEFORE UPDATE ON invoice FOR EACH ROW EXECUTE FUNCTION update_at();
CREATE tRIGGER trg_employee_update_at BEFORE UPDATE ON employee FOR EACH ROW EXECUTE FUNCTION update_at();

CREATE OR REPLACE FUNCTION book_appointment(
    p_time_slot_id UUID,
    p_patient_id UUID,
    p_created_by UUID,
    p_source appointment_source_enum,
    p_reason_for_visit VARCHAR
)
RETURNS TABLE (new_appointment_id UUID, assigned_queue_number INT) 
AS $$ DECLARE     v_max_tickets INT;     v_current_booked INT; v_next_queue_number INT;     v_appointment_id UUID; BEGIN
    SELECT max_tickets INTO v_max_tickets FROM time_slot WHERE time_slot_id = p_time_slot_id FOR UPDATE;

    IF NOT FOUND THEN RAISE EXCEPTION 'Time Slot not found';
    END IF;

    SELECT COUNT(*) INTO v_current_booked FROM appointment WHERE time_slot_id = p_time_slot_id AND status NOT IN ('Cancelled', 'NoShow');

    IF v_current_booked >= v_max_tickets THEN RAISE EXCEPTION 'Time Slot is full';
    END IF;

    SELECT COALESCE(MAX(queue_number), 0) + 1 INTO v_next_queue_number FROM appointment WHERE time_slot_id = p_time_slot_id;

    INSERT INTO appointment (
        time_slot_id,
        patient_id,
        queue_number,
        created_by,
        source,
        reason_for_visit
    ) VALUES (
        p_time_slot_id,
        p_patient_id,
        v_next_queue_number,
        p_created_by,
        p_source,
        p_reason_for_visit
    ) RETURNING appointment_id INTO v_appointment_id;

    RETURN QUERY SELECT v_appointment_id, v_next_queue_number;

END;
$$ LANGUAGE plpgsql;