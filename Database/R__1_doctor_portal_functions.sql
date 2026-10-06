CREATE OR REPLACE FUNCTION fn_ticket_minutes(
    p_start       TIME,
    p_end         TIME,
    p_max_tickets INT
)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT GREATEST(
        1,
        ROUND(EXTRACT(EPOCH FROM (p_end - p_start)) / 60.0 / NULLIF(p_max_tickets, 0))
    )::INT;
$$;

CREATE OR REPLACE FUNCTION fn_schedule_overlaps(
    p_doctor_id  UUID,
    p_day        INT,
    p_start      TIME,
    p_end        TIME,
    p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM doctor_schedule ds
        WHERE ds.doctor_id   = p_doctor_id
          AND ds.day_of_week = p_day
          AND ds.start_time  < p_end
          AND ds.end_time    > p_start
          AND (p_exclude_id IS NULL OR ds.schedule_id <> p_exclude_id)
    );
$$;

CREATE OR REPLACE FUNCTION fn_consultation_total(p_appointment_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
    SELECT d.consultation_fee
         + COALESCE((
               SELECT SUM(at.line_total)
               FROM appointment_treatment at
               WHERE at.appointment_id = a.appointment_id
                 AND at.status <> 'Cancelled'
           ), 0)
    FROM appointment a
    JOIN time_slot ts ON ts.time_slot_id = a.time_slot_id
    JOIN doctor    d  ON d.doctor_id     = ts.doctor_id
    WHERE a.appointment_id = p_appointment_id;
$$;

CREATE OR REPLACE FUNCTION fn_age_years(p_dob DATE)
RETURNS INT
LANGUAGE sql
STABLE
AS $$
    SELECT EXTRACT(YEAR FROM AGE(CURRENT_DATE, p_dob))::INT;
$$;