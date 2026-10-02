ALTER TABLE patient_allergy
    DROP CONSTRAINT patient_allergy_severity_check;

ALTER TABLE patient_allergy
    ADD CONSTRAINT patient_allergy_severity_check CHECK (severity IN ('Mild', 'Moderate', 'Severe', 'Life-threatening'));

ALTER TABLE patient_condition
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
