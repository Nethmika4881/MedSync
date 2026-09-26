ALTER TABLE patient_allergy
    DROP CONSTRAINT patient_allergy_severity_check;

ALTER TABLE patient_allergy
    ADD CONSTRAINT patient_allergy_severity_check
    CHECK (severity IN ('Mild', 'Moderate', 'Severe', 'Life-threatening'));

-- Chronic (long-term) and active (currently present) are different facts;
-- keep is_chronic and add is_active for the frontend's Active/Resolved view.
ALTER TABLE patient_condition
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
