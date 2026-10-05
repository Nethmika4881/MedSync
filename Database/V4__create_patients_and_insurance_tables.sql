CREATE TABLE patient (
    patient_id UUID PRIMARY KEY,
    blood_group VARCHAR(5),
    registered_branch_id UUID NOT NULL,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    CONSTRAINT fk_patient_isa_app_user FOREIGN KEY (patient_id) REFERENCES app_user(user_id),
    CONSTRAINT fk_patient_registered_at_branch FOREIGN KEY (registered_branch_id) REFERENCES branch(branch_id)
);

CREATE TABLE insurance_package (
    insurance_package_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name VARCHAR(100) NOT NULL,
    package_name VARCHAR(100) NOT NULL,
    annual_limit DECIMAL(12,2),
    copayment_percentage DECIMAL(5,2) DEFAULT 0.00,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    CONSTRAINT uq_insurance_package_provider_name UNIQUE ( provider_name, package_name )
);

CREATE TABLE insurance (
    insurance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    insurance_package_id UUID NOT NULL,
    policy_number VARCHAR(50) NOT NULL UNIQUE,
    used_coverage_amount DECIMAL(12,2) DEFAULT 0.00,
    status policy_status_enum DEFAULT 'Active',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    CONSTRAINT fk_insurance_held_by_patient FOREIGN KEY (patient_id) REFERENCES patient(patient_id),
    CONSTRAINT fk_insurance_based_on_package FOREIGN KEY (insurance_package_id) REFERENCES insurance_package(insurance_package_id)
);
