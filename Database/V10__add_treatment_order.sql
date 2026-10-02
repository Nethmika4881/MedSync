CREATE TYPE treatment_status_enum AS ENUM (
    'Ordered',
    'InProgress',
    'Completed',
    'Cancelled'
);

ALTER TABLE appointment_treatment
    ADD COLUMN status treatment_status_enum NOT NULL DEFAULT 'Ordered', ADD COLUMN ordered_at TIMESTAMP NOT NULL DEFAULT NOW(), ADD COLUMN result_file VARCHAR(255);

ALTER TABLE appointment_treatment
    ALTER COLUMN performed_by DROP NOT NULL, ALTER COLUMN performed_at DROP DEFAULT;

ALTER TABLE appointment_treatment
    ADD CONSTRAINT chk_treatment_completed_has_performer CHECK (status <> 'Completed' OR (performed_by IS NOT NULL AND performed_at IS NOT NULL));

ALTER TABLE appointment_treatment
    ADD CONSTRAINT chk_treatment_quantity_positive CHECK (quantity > 0);

ALTER TYPE treatment_category_enum ADD VALUE IF NOT EXISTS 'Procedure';

ALTER TYPE treatment_category_enum ADD VALUE IF NOT EXISTS 'Therapy';

CREATE INDEX idx_appointment_treatment_status ON appointment_treatment(status);
