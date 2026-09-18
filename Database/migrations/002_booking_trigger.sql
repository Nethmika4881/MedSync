-- Migration: 002_booking_trigger.sql
-- Adds session-based ticket assignment and anti-collision guard to the appointment table.
-- Run this against your Neon database before using the bookAppointment Server Action.

-- ─── 1. Add missing columns to appointment ─────────────────────────────────────

ALTER TABLE appointment
  ADD COLUMN IF NOT EXISTS ticket_number INT,
  ADD COLUMN IF NOT EXISTS session VARCHAR(20),
  ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'Booked';

-- ─── 2. Anti-collision trigger function ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_assign_ticket_and_guard_capacity()
RETURNS TRIGGER AS $$
DECLARE
  v_slot_id       VARCHAR(10);
  v_max           INT;
  v_current       INT;
  v_next_ticket   INT;
  v_start_time    TIME;
  v_end_time      TIME;
  v_slot_hash     TEXT;
BEGIN
  -- Skip if no session specified (legacy inserts without session)
  IF NEW.session IS NULL THEN
    RETURN NEW;
  END IF;

  -- Derive start/end time from session name
  v_start_time := CASE NEW.session
    WHEN 'Morning'   THEN '08:00'::TIME
    WHEN 'Midday'    THEN '11:00'::TIME
    WHEN 'Afternoon' THEN '14:00'::TIME
    WHEN 'Evening'   THEN '17:00'::TIME
    ELSE '08:00'::TIME
  END;
  v_end_time := v_start_time + INTERVAL '3 hours';

  -- Deterministic slot ID from doctor + date + start_time
  v_slot_hash := LEFT(md5(
    NEW.doctor_id || '|' || (NEW.appointment_date_time::DATE)::TEXT || '|' || v_start_time::TEXT
  ), 7);

  -- Upsert time_slot: auto-create on first booking for this doctor/date/session
  INSERT INTO time_slot (
    time_slot_id, doctor_id, branch_id, available_date,
    slot_start_time, slot_end_time, max_tickets,
    current_ticket_count, last_ticket_number
  )
  VALUES (
    'TS-' || v_slot_hash,
    NEW.doctor_id,
    NEW.branch_id,
    NEW.appointment_date_time::DATE,
    v_start_time,
    v_end_time,
    4,    -- default capacity
    0,
    0
  )
  ON CONFLICT (doctor_id, available_date, slot_start_time) DO NOTHING;

  -- Lock the time_slot row and read current capacity
  SELECT time_slot_id, max_tickets, current_ticket_count, last_ticket_number
    INTO v_slot_id, v_max, v_current, v_next_ticket
    FROM time_slot
   WHERE doctor_id      = NEW.doctor_id
     AND available_date  = NEW.appointment_date_time::DATE
     AND slot_start_time = v_start_time
     FOR UPDATE;

  -- Guard: reject if at capacity
  IF v_current >= v_max THEN
    RAISE EXCEPTION 'SLOT_FULL: Doctor % on % session % is at capacity (%/%)',
      NEW.doctor_id,
      NEW.appointment_date_time::DATE,
      NEW.session,
      v_current,
      v_max;
  END IF;

  -- Assign next ticket number
  v_next_ticket := v_next_ticket + 1;
  NEW.ticket_number := v_next_ticket;

  -- Increment counters on the time_slot row
  UPDATE time_slot
     SET current_ticket_count = current_ticket_count + 1,
         last_ticket_number   = v_next_ticket,
         updated_at           = NOW()
   WHERE time_slot_id = v_slot_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── 3. Attach trigger ──────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_booking_guard ON appointment;
CREATE TRIGGER trg_booking_guard
  BEFORE INSERT ON appointment
  FOR EACH ROW
  EXECUTE FUNCTION fn_assign_ticket_and_guard_capacity();
