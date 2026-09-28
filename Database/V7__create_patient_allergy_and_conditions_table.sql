-- Patient Allergy
CREATE TABLE patient_allergy (
    allergy_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES patient(patient_id) ON DELETE CASCADE,
    allergen_name   VARCHAR(150) NOT NULL,
    reaction        VARCHAR(255),
    severity        VARCHAR(20) NOT NULL DEFAULT 'Moderate'
                    CHECK (severity IN ('Mild', 'Moderate', 'Severe')),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
 
-- Patient condition 
CREATE TABLE patient_condition (
    condition_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id       UUID NOT NULL REFERENCES patient(patient_id) ON DELETE CASCADE,
    condition_name   VARCHAR(150) NOT NULL,
    diagnosed_date   DATE,
    is_chronic       BOOLEAN DEFAULT FALSE,
    notes            VARCHAR(255),
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);
 
CREATE INDEX idx_patient_allergy_patient ON patient_allergy(patient_id);
CREATE INDEX idx_patient_condition_patient ON patient_condition(patient_id);