CREATE TABLE admin_patient_access_log (
    access_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    access_reason VARCHAR(100) NOT NULL DEFAULT 'Operational oversight',
    accessed_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_admin_patient_access_admin
        FOREIGN KEY (admin_id)
        REFERENCES app_user(user_id),

    CONSTRAINT fk_admin_patient_access_patient
        FOREIGN KEY (patient_id)
        REFERENCES patient(patient_id)
);

CREATE INDEX idx_admin_patient_access_admin
    ON admin_patient_access_log(admin_id);

CREATE INDEX idx_admin_patient_access_patient
    ON admin_patient_access_log(patient_id);

CREATE INDEX idx_admin_patient_access_time
    ON admin_patient_access_log(accessed_at DESC);