-- 1. A doctor may hold several specializations (composite PK doctor_id + specialization_id
--    from V3 still prevents the same specialization being added twice).
ALTER TABLE doctor_specialization
DROP CONSTRAINT IF EXISTS uq_doctor_one_specialization;

-- 2. A doctor cannot have two overlapping sessions on the same day, in any branch.
--    The old UNIQUE (doctor_id, available_date, start_time, end_time) only caught identical
--    periods. Back-to-back sessions (09:00-13:00 and 13:00-17:00) stay allowed because the
--    range is half-open.
CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
DECLARE
    v_overlaps INT;
BEGIN
    SELECT COUNT(*)
      INTO v_overlaps
    FROM time_slot a
    JOIN time_slot b
      ON  a.doctor_id      = b.doctor_id
      AND a.available_date = b.available_date
      AND a.time_slot_id   < b.time_slot_id
      AND a.start_time     < b.end_time
      AND b.start_time     < a.end_time;

    IF v_overlaps > 0 THEN
        RAISE EXCEPTION
            '% overlapping doctor time slot pair(s) already exist. Fix or remove them before applying this migration.',
            v_overlaps;
    END IF;
END;
$$;

ALTER TABLE time_slot
ADD CONSTRAINT excl_doctor_time_slot_overlap
EXCLUDE USING gist (
    doctor_id WITH =,
    tsrange(available_date + start_time, available_date + end_time) WITH &&
);

-- fn_sync_time_slots named the old unique constraint in ON CONFLICT, which would no longer
-- absorb a partially overlapping period. Skip any conflicting row instead.
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

    -- A doctor who is not accepting appointments gets no new sessions.
    IF EXISTS (SELECT 1 FROM doctor WHERE doctor_id = p_doctor_id AND is_available IS FALSE) THEN
        RETURN 0;
    END IF;

    -- day_of_week: 0 = Sunday ... 6 = Saturday, the same as EXTRACT(DOW ...).
    -- Tickets = session length / minutes per slot (09:00-13:00 at 15 minutes = 16).
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
    ON CONFLICT DO NOTHING;

    GET DIAGNOSTICS v_created = ROW_COUNT;
    RETURN v_created;
END;
$$;
