-- Treatments are ordered by the doctor first and performed later by staff,
-- so performer/performed time must be optional until the treatment is done.

CREATE TYPE treatment_status_enum AS ENUM (
    'Ordered',
    'InProgress',
    'Completed',
    'Cancelled'
);

ALTER TABLE appointment_treatment
    ADD COLUMN status      treatment_status_enum NOT NULL DEFAULT 'Ordered',
    ADD COLUMN ordered_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    ADD COLUMN result_file VARCHAR(255);

ALTER TABLE appointment_treatment
    ALTER COLUMN performed_by DROP NOT NULL,
    ALTER COLUMN performed_at DROP DEFAULT;

-- A completed treatment must record who did it and when.
ALTER TABLE appointment_treatment
    ADD CONSTRAINT chk_treatment_completed_has_performer
    CHECK (status <> 'Completed' OR (performed_by IS NOT NULL AND performed_at IS NOT NULL));

ALTER TABLE appointment_treatment
    ADD CONSTRAINT chk_treatment_quantity_positive
    CHECK (quantity > 0);

-- Align catalogue categories with the frontend.
ALTER TYPE treatment_category_enum ADD VALUE IF NOT EXISTS 'Procedure';
ALTER TYPE treatment_category_enum ADD VALUE IF NOT EXISTS 'Therapy';

CREATE INDEX idx_appointment_treatment_status
ON appointment_treatment(status);
