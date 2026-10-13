CREATE INDEX IF NOT EXISTS idx_insurance_patient_id ON insurance(patient_id);
CREATE INDEX IF NOT EXISTS idx_insurance_package_id ON insurance(insurance_package_id);
CREATE INDEX IF NOT EXISTS idx_insurance_status ON insurance(status);
CREATE INDEX IF NOT EXISTS idx_insurance_policy_number ON insurance(policy_number);