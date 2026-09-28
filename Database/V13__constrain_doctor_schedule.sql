-- day_of_week follows Postgres EXTRACT(DOW) / JS Date.getDay(): 0 = Sunday … 6 = Saturday.
COMMENT ON COLUMN doctor_schedule.day_of_week IS '0 = Sunday … 6 = Saturday (matches EXTRACT(DOW))';

ALTER TABLE doctor_schedule
    ADD CONSTRAINT chk_doctor_schedule_day_of_week
    CHECK (day_of_week BETWEEN 0 AND 6);

ALTER TABLE doctor_schedule
    ADD CONSTRAINT chk_doctor_schedule_time_order
    CHECK (end_time > start_time);

ALTER TABLE doctor_schedule
    ADD CONSTRAINT chk_doctor_schedule_slot_duration
    CHECK (slot_duration_minutes > 0);
