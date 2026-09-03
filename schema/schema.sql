CREATE TABLE address (
    address_id VARCHAR(36) PRIMARY KEY,
    address_line1 VARCHAR(100) NOT NULL,
    address_line2 VARCHAR(100),
    city VARCHAR(50) NOT NULL,
    province VARCHAR(50),
    postal_code VARCHAR(10),
    country VARCHAR(50) DEFAULT 'Sri Lanka',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE contact (
    contact_id VARCHAR(36) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE doctor (
    doctor_id VARCHAR(36) PRIMARY KEY,
    room_no VARCHAR(5),
    medical_licence_no VARCHAR(50) NOT NULL UNIQUE,
    consultation_fee DECIMAL(10,2) DEFAULT 1500 NOT NULL,
    years_experience INT,
    qualification VARCHAR(150),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES employee(employee_id)
);

CREATE TABLE specialization (
    specialization_id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    other_details VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE insurance_package (
    insurance_package_id VARCHAR(36) PRIMARY KEY,
    provider_name VARCHAR(100) NOT NULL,
    package_name VARCHAR(100) NOT NULL,
    annual_limit DECIMAL(12,2),
    copayment_percentage DECIMAL(5,2) DEFAULT 0.00,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE treatment_catalogue (
    treatment_service_code VARCHAR(36) PRIMARY KEY,
    category ENUM('Consultation', 'Radiology', 'Laboratory', 'Injection', 'Surgery', 'Other') NOT NULL,
    treatment_name VARCHAR(100) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    duration TIME,
    description VARCHAR(255),
    is_insurable BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE medication (
    medication_id VARCHAR(36) PRIMARY KEY,
    generic_name VARCHAR(100) NOT NULL,
    brand_name VARCHAR(100)
);

CREATE TABLE branch (
    branch_id VARCHAR(36) PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL,
    address_id VARCHAR(36) NOT NULL,
    contact_id VARCHAR(36) NOT NULL,
    manager_id VARCHAR(36), 
    opened_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (address_id) REFERENCES address(address_id),
    FOREIGN KEY (contact_id) REFERENCES contact(contact_id),
    FOREIGN KEY (manager_id) REFERENCES employee(employee_id);
);

CREATE TABLE contact_number (
    contact_number_id VARCHAR(36) PRIMARY KEY,
    contact_id VARCHAR(36) NOT NULL,
    number_type ENUM('Mobile', 'Home', 'Work') NOT NULL,
    number VARCHAR(20) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (contact_id) REFERENCES contact(contact_id)
);

CREATE TABLE doctor_specialization (
    doctor_id VARCHAR(36) NOT NULL,
    specialization_id VARCHAR(36) NOT NULL,
    certification_date DATE,
    PRIMARY KEY (doctor_id, specialization_id),
    FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id),
    FOREIGN KEY (specialization_id) REFERENCES specialization(specialization_id)
);

CREATE TABLE app_user (
    user_id VARCHAR(36) PRIMARY KEY,
    address_id VARCHAR(36) NOT NULL,
    contact_id VARCHAR(36) NOT NULL,
    user_type ENUM('Patient', 'Employee') NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    nic VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    gender ENUM('Male', 'Female', 'Other'),
    dob DATE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (address_id) REFERENCES address(address_id),
    FOREIGN KEY (contact_id) REFERENCES contact(contact_id)
);

CREATE TABLE employee (
    employee_id VARCHAR(36) PRIMARY KEY,
    branch_id VARCHAR(36) NOT NULL,
    role ENUM('Doctor', 'FrontDesk', 'Admin') NOT NULL,
    salary DECIMAL(10,2),
    joined_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES app_user(user_id),
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id)
);

CREATE TABLE patient (
    patient_id VARCHAR(36) PRIMARY KEY,
    blood_group VARCHAR(5),
    registered_branch_id VARCHAR(36) NOT NULL,
    emergency_contact_name VARCHAR(100),
    emergency_contact_number VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES app_user(user_id),
    FOREIGN KEY (registered_branch_id) REFERENCES branch(branch_id)
);

CREATE TABLE doctor_schedule (
    schedule_id VARCHAR(36) PRIMARY KEY,
    doctor_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id),
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id)
);

CREATE TABLE time_slot (
    time_slot_id VARCHAR(36) PRIMARY KEY,
    doctor_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NOT NULL,
    available_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_tickets INT NOT NULL,
    current_serving_number INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id),
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id)
);

CREATE TABLE insurance (
    insurance_id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL,
    insurance_package_id VARCHAR(36) NOT NULL,
    policy_number VARCHAR(50) NOT NULL,
    used_coverage_amount DECIMAL(12,2) DEFAULT 0.00,
    status ENUM('Active', 'Expired', 'Cancelled'),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id),
    FOREIGN KEY (insurance_package_id) REFERENCES insurance_package(insurance_package_id)
);

CREATE TABLE appointment (
    appointment_id VARCHAR(36) PRIMARY KEY,
    time_slot_id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    queue_number INT NOT NULL,
    created_by VARCHAR(36) NOT NULL,
    rescheduled_from VARCHAR(36),
    status ENUM('Scheduled', 'Completed', 'Cancelled', 'NoShow', 'Rescheduled'),
    source ENUM('Booked', 'WalkIn', 'Emergency'),
    reason_for_visit VARCHAR(255),
    notes TEXT,
    cancelled_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (time_slot_id) REFERENCES time_slot(time_slot_id),
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id),
    FOREIGN KEY (created_by) REFERENCES employee(employee_id),
    FOREIGN KEY (rescheduled_from) REFERENCES appointment(appointment_id)
);

CREATE TABLE consultation_record (
    consultation_rec_id VARCHAR(36) PRIMARY KEY,
    appointment_id VARCHAR(36) NOT NULL,
    symptoms TEXT,
    diagnosis TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointment(appointment_id)
);

CREATE TABLE appointment_treatment (
    appointment_treatment_id VARCHAR(36) PRIMARY KEY,
    appointment_id VARCHAR(36) NOT NULL,
    treatment_service_code VARCHAR(36) NOT NULL,
    performed_by VARCHAR(36) NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(10,2) NOT NULL,
    notes VARCHAR(255),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointment(appointment_id),
    FOREIGN KEY (treatment_service_code) REFERENCES treatment_catalogue(treatment_service_code),
    FOREIGN KEY (performed_by) REFERENCES employee(employee_id)
);

CREATE TABLE prescription (
    prescription_id VARCHAR(36) PRIMARY KEY,
    appointment_id VARCHAR(36) NOT NULL,
    medication_id VARCHAR(36) NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    frequency VARCHAR(50),
    duration_days INT,
    notes VARCHAR(255),
    allergy_checked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointment(appointment_id),
    FOREIGN KEY (medication_id) REFERENCES medication(medication_id)
);

CREATE TABLE invoice (
    invoice_id VARCHAR(36) PRIMARY KEY,
    appointment_id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    invoice_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    gross_amount DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    net_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0.00,
    due_amount DECIMAL(12,2) DEFAULT 0.00 NOT NULL,
    insurance_covered_amount DECIMAL(12,2) DEFAULT 0.00,
    status ENUM('Paid', 'Unpaid', 'Partially Paid') DEFAULT 'Unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointment(appointment_id),
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id)
);

CREATE TABLE payment (
    payment_id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method ENUM('cash', 'Card', 'Bank Transfer', 'InsuranceSettlement', 'OnlinePayment'),
    received_by VARCHAR(36) NOT NULL,
    reference_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoice(invoice_id),
    FOREIGN KEY (received_by) REFERENCES employee(employee_id)
);

CREATE TABLE insurance_claim (
    claim_id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NOT NULL,
    insurance_id VARCHAR(36) NOT NULL,
    claim_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    claimed_amount DECIMAL(12, 2),
    approved_amount DECIMAL(12, 2) DEFAULT 0.00,
    status ENUM ('Submitted', 'UnderReview', 'Approved', 'PartiallyApproved', 'Rejected', 'Settled') DEFAULT 'Submitted',
    settlement_date TIMESTAMP,
    remarks VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoice(invoice_id),
    FOREIGN KEY (insurance_id) REFERENCES insurance(insurance_id)
);

CREATE TABLE insurance_claim_item (
    claim_item_id VARCHAR(36) PRIMARY KEY,
    claim_id VARCHAR(36) NOT NULL,
    appointment_treatment_id VARCHAR(36) NOT NULL,
    claimed_amount DECIMAL(10, 2) NOT NULL,
    approved_amount DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (claim_id) REFERENCES insurance_claim(claim_id),
    FOREIGN KEY (appointment_treatment_id) REFERENCES appointment_treatment(appointment_treatment_id)
);