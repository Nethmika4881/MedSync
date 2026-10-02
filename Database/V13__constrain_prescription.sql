ALTER TABLE prescription
    ADD CONSTRAINT chk_prescription_dosage_not_blank CHECK (TRIM(dosage) <> '');

ALTER TABLE prescription
    ADD CONSTRAINT chk_prescription_duration_positive CHECK (duration_days IS NULL OR duration_days > 0);

CREATE INDEX idx_prescription_appointment_id ON prescription(appointment_id);
