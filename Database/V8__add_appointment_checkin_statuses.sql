ALTER TYPE appointment_status_enum ADD VALUE IF NOT EXISTS 'CheckedIn' AFTER 'Scheduled';

ALTER TYPE appointment_status_enum ADD VALUE IF NOT EXISTS 'InProgress' AFTER 'CheckedIn';

ALTER TABLE appointment
    ADD COLUMN checked_in_at TIMESTAMP, ADD COLUMN consultation_started_at TIMESTAMP;
