CREATE EXTENSION IF NOT EXISTS pg_uuidv7;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TYPE user_type_enum AS ENUM ('Patient', 'Employee');
CREATE TYPE gender_enum AS ENUM ('Male', 'Female', 'Other');
CREATE TYPE employee_role_enum AS ENUM ('Doctor', 'FrontDesk', 'Admin');
CREATE TYPE contact_number_type_enum AS ENUM ('Mobile', 'Home', 'Work');
CREATE TYPE treatment_category_enum AS ENUM ('Consultation', 'Radiology', 'Laboratory', 'Injection', 'Surgery', 'Other');
CREATE TYPE day_of_week_enum AS ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
CREATE TYPE insurance_status_enum AS ENUM ('Active', 'Expired', 'Cancelled');
CREATE TYPE appointment_status_enum AS ENUM ('Scheduled', 'Completed', 'Cancelled', 'NoShow', 'Rescheduled');
CREATE TYPE appointment_source_enum AS ENUM ('Booked', 'WalkIn', 'Emergency');
CREATE TYPE invoice_status_enum AS ENUM ('Paid', 'Unpaid', 'Partially Paid');
CREATE TYPE payment_method_enum AS ENUM ('cash', 'Card', 'Bank Transfer', 'InsuranceSettlement', 'OnlinePayment');
CREATE TYPE claim_status_enum AS ENUM ('Submitted', 'UnderReview', 'Approved', 'PartiallyApproved', 'Rejected', 'Settled');

CREATE TABLE address (
    address_id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    address_line1 VARCHAR(100) NOT NULL,
    address_line2 VARCHAR(100),
    city VARCHAR(50) NOT NULL,
    province VARCHAR(50),
    postal_code VARCHAR(10),
    country VARCHAR(50) DEFAULT 'Sri Lanka',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contact (
    contact_id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contact_number (
    contact_number_id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    contact_id UUID NOT NULL REFERENCES contact(contact_id),
    number_type contact_number_type_enum NOT NULL,
    number VARCHAR(20) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE
);

CREATE TABLE app_user (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    address_id UUID NOT NULL REFERENCES address(address_id),
    contact_id UUID NOT NULL REFERENCES contact(contact_id),
    user_type user_type_enum NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    nic VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    gender gender_enum,
    dob DATE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    last_login TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE branch (
    branch_id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    branch_name VARCHAR(100) NOT NULL,
    address_id UUID NOT NULL REFERENCES address(address_id),
    contact_id UUID NOT NULL REFERENCES contact(contact_id),
    manager_id UUID,
    opened_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employee (
    employee_id UUID PRIMARY KEY REFERENCES app_user(user_id),
    branch_id UUID NOT NULL REFERENCES branch(branch_id),
    role employee_role_enum NOT NULL,
    salary DECIMAL(10,2),
    joined_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE branch 
    ADD CONSTRAINT fk_branch_manager 
    FOREIGN KEY (manager_id) REFERENCES employee(employee_id);

CREATE TABLE doctor (
    doctor_id UUID PRIMARY KEY REFERENCES employee(employee_id),
    room_no VARCHAR(5),
    medical_licence_no VARCHAR(50) NOT NULL UNIQUE,
    consultation_fee DECIMAL(10,2) DEFAULT 1500 NOT NULL,
    years_experience INT,
    qualification VARCHAR(150),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE specialization (
    specialization_id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    title VARCHAR(100) NOT NULL,
    other_details VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE doctor_specialization (
    doctor_id UUID NOT NULL REFERENCES doctor(doctor_id),
    specialization_id UUID NOT NULL REFERENCES specialization(specialization_id),
    certification_date DATE,
    PRIMARY KEY (doctor_id, specialization_id)
);

CREATE TABLE patient (
    patient_id UUID PRIMARY KEY REFERENCES app_user(user_id),
    blood_group VARCHAR(5),
    registered_branch_id UUID NOT NULL REFERENCES branch(branch_id),
    emergency_contact_name VARCHAR(100),
    emergency_contact_number VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE insurance_package (
    insurance_package_id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    provider_name VARCHAR(100) NOT NULL,
    package_name VARCHAR(100) NOT NULL,
    annual_limit DECIMAL(12,2),
    copayment_percentage DECIMAL(5,2) DEFAULT 0.00,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE insurance (
    insurance_id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    patient_id UUID NOT NULL REFERENCES patient(patient_id),
    insurance_package_id UUID NOT NULL REFERENCES insurance_package(insurance_package_id),
    policy_number VARCHAR(50) NOT NULL,
    used_coverage_amount DECIMAL(12,2) DEFAULT 0.00,
    status insurance_status_enum,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE treatment_catalogue (
    treatment_service_code UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    category treatment_category_enum NOT NULL,
    treatment_name VARCHAR(100) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    duration TIME,
    description VARCHAR(255),
    is_insurable BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medication (
    medication_id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    generic_name VARCHAR(100) NOT NULL,
    brand_name VARCHAR(100)
);

CREATE TABLE doctor_schedule (
    schedule_id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    doctor_id UUID NOT NULL REFERENCES doctor(doctor_id),
    branch_id UUID NOT NULL REFERENCES branch(branch_id),
    day_of_week day_of_week_enum NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE time_slot (
    time_slot_id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    doctor_id UUID NOT NULL REFERENCES doctor(doctor_id),
    branch_id UUID NOT NULL REFERENCES branch(branch_id),
    available_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_tickets INT NOT NULL,
    current_serving_number INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointment (
    appointment_id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    time_slot_id UUID NOT NULL REFERENCES time_slot(time_slot_id),
    patient_id UUID NOT NULL REFERENCES patient(patient_id),
    queue_number INT NOT NULL,
    created_by UUID NOT NULL REFERENCES employee(employee_id),
    rescheduled_from UUID REFERENCES appointment(appointment_id),
    status appointment_status_enum,
    source appointment_source_enum,
    reason_for_visit VARCHAR(255),
    notes TEXT,
    cancelled_reason VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE consultation_record (
    consultation_rec_id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    appointment_id UUID NOT NULL REFERENCES appointment(appointment_id),
    symptoms TEXT,
    diagnosis TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointment_treatment (
    appointment_treatment_id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    appointment_id UUID NOT NULL REFERENCES appointment(appointment_id),
    treatment_service_code UUID NOT NULL REFERENCES treatment_catalogue(treatment_service_code),
    performed_by UUID NOT NULL REFERENCES employee(employee_id),
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(10,2) NOT NULL,
    notes VARCHAR(255),
    performed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE prescription (
    prescription_id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    appointment_id UUID NOT NULL REFERENCES appointment(appointment_id),
    medication_id UUID NOT NULL REFERENCES medication(medication_id),
    dosage VARCHAR(50) NOT NULL,
    frequency VARCHAR(50),
    duration_days INT,
    notes VARCHAR(255),
    allergy_checked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. BILLING & INSURANCE CLAIMS
CREATE TABLE invoice (
    invoice_id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    appointment_id UUID NOT NULL REFERENCES appointment(appointment_id),
    patient_id UUID NOT NULL REFERENCES patient(patient_id),
    invoice_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    gross_amount DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    net_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0.00,
    due_amount DECIMAL(12,2) DEFAULT 0.00 NOT NULL,
    insurance_covered_amount DECIMAL(12,2) DEFAULT 0.00,
    status invoice_status_enum DEFAULT 'Unpaid',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    invoice_id UUID NOT NULL REFERENCES invoice(invoice_id),
    amount DECIMAL(12, 2) NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    payment_method payment_method_enum,
    received_by UUID NOT NULL REFERENCES employee(employee_id),
    reference_number VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE insurance_claim (
    claim_id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    invoice_id UUID NOT NULL REFERENCES invoice(invoice_id),
    insurance_id UUID NOT NULL REFERENCES insurance(insurance_id),
    claim_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    claimed_amount DECIMAL(12, 2),
    approved_amount DECIMAL(12, 2) DEFAULT 0.00,
    status claim_status_enum DEFAULT 'Submitted',
    settlement_date TIMESTAMPTZ,
    remarks VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE insurance_claim_item (
    claim_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    claim_id UUID NOT NULL REFERENCES insurance_claim(claim_id),
    appointment_treatment_id UUID NOT NULL REFERENCES appointment_treatment(appointment_treatment_id),
    claimed_amount DECIMAL(10, 2) NOT NULL,
    approved_amount DECIMAL(10, 2) DEFAULT 0.00
);

DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
          AND table_schema = current_schema()
    LOOP
        EXECUTE format('CREATE TRIGGER trg_update_timestamp 
                        BEFORE UPDATE ON %I 
                        FOR EACH ROW 
                        EXECUTE FUNCTION update_updated_at_column();', t);
    END LOOP;
END $$;