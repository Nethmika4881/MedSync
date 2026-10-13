CREATE OR REPLACE FUNCTION fn_sync_time_slots(
    p_doctor_id UUID,
    p_from      DATE,
    p_to        DATE
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_created INT := 0;
BEGIN
    IF p_to < p_from THEN
        RETURN 0;
    END IF;

    IF EXISTS (SELECT 1 FROM doctor WHERE doctor_id = p_doctor_id AND is_available IS FALSE) THEN
        RETURN 0;
    END IF;

    INSERT INTO time_slot (doctor_id, branch_id, available_date, start_time, end_time, max_tickets)
    SELECT ds.doctor_id,
           ds.branch_id,
           d::DATE,
           ds.start_time,
           ds.end_time,
           GREATEST(
               1,
               FLOOR(EXTRACT(EPOCH FROM (ds.end_time - ds.start_time)) / 60
                     / GREATEST(1, COALESCE(ds.slot_duration_minutes, 15)))
           )::INT
    FROM doctor_schedule ds
    CROSS JOIN generate_series(p_from, p_to, INTERVAL '1 day') AS d
    WHERE ds.doctor_id = p_doctor_id
      AND ds.day_of_week = EXTRACT(DOW FROM d)::INT
    ON CONFLICT ON CONSTRAINT idx_doctor_session_overlap DO NOTHING;

    GET DIAGNOSTICS v_created = ROW_COUNT;
    RETURN v_created;
END;
$$;

CREATE OR REPLACE FUNCTION trg_doctor_schedule_drop_old_slots()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM time_slot ts
    WHERE ts.doctor_id      = OLD.doctor_id
      AND ts.branch_id      = OLD.branch_id
      AND ts.start_time     = OLD.start_time
      AND ts.end_time       = OLD.end_time
      AND ts.available_date >= CURRENT_DATE
      AND EXTRACT(DOW FROM ts.available_date)::INT = OLD.day_of_week
      AND NOT EXISTS (SELECT 1 FROM appointment a WHERE a.time_slot_id = ts.time_slot_id);

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER doctor_schedule_drop_old_slots
AFTER UPDATE OR DELETE ON doctor_schedule
FOR EACH ROW EXECUTE FUNCTION trg_doctor_schedule_drop_old_slots();
