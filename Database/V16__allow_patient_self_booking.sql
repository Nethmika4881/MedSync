-- V16__allow_patient_self_booking.sql
-- Makes created_by nullable so patients can self-book appointments via the portal.
-- NULL created_by = patient self-booked (source = 'Booked').
-- Non-null created_by = created by a front-desk/doctor employee (existing behavior preserved).
-- The FK constraint remains active — employee IDs are still validated when provided.

ALTER TABLE appointment ALTER COLUMN created_by DROP NOT NULL;
