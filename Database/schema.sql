-- Create table for doctor 
DROP TABLE IF EXISTS doctor;
CREATE TABLE doctor (
    doctor_id VARCHAR(7) PRIMARY KEY,
    room_no VARCHAR(5) NOT NULL,
    medical_licence_no VARCHAR(15) NOT NULL UNIQUE,
    consultation_fee DECIMAL(10,2) NOT NULL,
    years_experience INT NOT NULL,
    qualification VARCHAR(50) NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY(doctor_id) REFERENCES employee(employee_id) ON DELETE CASCADE
);

-- Create table for doctor_specialization
DROP TABLE IF EXISTS doctor_specialization;
CREATE TABLE doctor_specialization (
    doctor_id VARCHAR(7) NOT NULL,
    specialization_id VARCHAR(10) NOT NULL,
    certification_date DATE,
    PRIMARY KEY (doctor_id, specialization_id),
    FOREIGN KEY(doctor_id) REFERENCES doctor(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY(specialization_id) REFERENCES specialization(specialization_id) ON DELETE CASCADE
);

-- Create table for specialization
DROP TABLE IF EXISTS specialization;
CREATE TABLE specialization (
    specialization_id VARCHAR(10) NOT NULL PRIMARY KEY,
    title VARCHAR(50) UNIQUE,
    other_details VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create table for doctor_schedule
DROP TABLE IF EXISTS doctor_schedule;
CREATE TABLE doctor_schedule (
    schedule_id VARCHAR(10) PRIMARY KEY,
    doctor_id VARCHAR(7) NOT NULL,
    branch_id VARCHAR(10) NOT NULL,
    day_of_week INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INT NOT NULL DEFAULT 180,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY(doctor_id) REFERENCES doctor(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY(branch_id) REFERENCES branch(branch_id) ON DELETE CASCADE
);

-- Create table for time_slot 
DROP TABLE IF EXISTS time_slot;
CREATE TABLE time_slot (
    time_slot_id VARCHAR(10) PRIMARY KEY,
    doctor_id VARCHAR(7) NOT NULL,
    branch_id VARCHAR(10) NOT NULL,
    available_date DATE NOT NULL,
    slot_start_time TIME NOT NULL,
    slot_end_time TIME NOT NULL,
    slot_duration_minutes INT NOT NULL DEFAULT 180,
    max_tickets INT NOT NULL DEFAULT 4,
    current_ticket_count INT NOT NULL DEFAULT 0,
    current_serving_number INT NOT NULL DEFAULT 0,
    last_ticket_number INT NOT NULL DEFAULT 0,
    is_overbooked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (doctor_id, available_date, slot_start_time),
    FOREIGN KEY(doctor_id) REFERENCES doctor(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY(branch_id) REFERENCES branch(branch_id) ON DELETE CASCADE
);

-- Create table for consultation_record 
DROP TABLE IF EXISTS consultation_record;
CREATE TABLE consultation_record (
    consultation_rec_id VARCHAR(10) PRIMARY KEY,
    appointment_id VARCHAR(10) UNIQUE NOT NULL,
    symptoms VARCHAR(500),
    diagnosis VARCHAR(500),
    follow_up_required BOOLEAN DEFAULT TRUE,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY(appointment_id) REFERENCES appointment(appointment_id) ON DELETE CASCADE
);

-- Create table for prescription
DROP TABLE If EXISTS prescription;
CREATE TABLE prescription (
    prescription_id VARCHAR(10) PRIMARY KEY,
    appointment_id VARCHAR(10) NOT NULL,
    medication_id VARCHAR(10) NOT NULL,
    dosage VARCHAR(50),
    frequency VARCHAR(50),
    duration_days INT,
    notes VARCHAR(500),
    allergy_checked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(appointment_id) REFERENCES appointment(appointment_id) ON DELETE CASCADE,
    FOREIGN KEY(medication_id) REFERENCES medication(medication_id) ON DELETE RESTRICT
);

-- Create table for medication
DROP TABLE IF EXISTS medication;
CREATE TABLE medication(
    medication_id VARCHAR(10) PRIMARY KEY,
    generic_name VARCHAR(50) NOT NULL,
    brand_name VARCHAR(50)
);

-- Create table for appointment_treatment
DROP TABLE IF EXISTS appointment_treatment;
CREATE TABLE appointment_treatment (
    appointment_treatment_id VARCHAR(10) PRIMARY KEY,
    appointment_id VARCHAR(10) NOT NULL,
    treatment_service_code VARCHAR(10) NOT NULL,
    performed_by VARCHAR(10) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(10,2) NOT NULL,
    notes VARCHAR(500),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(appointment_id) REFERENCES appointment(appointment_id) ON DELETE CASCADE,
    FOREIGN KEY(treatment_service_code) REFERENCES treatment_catalogue(treatment_service_code) ON DELETE RESTRICT,
    FOREIGN KEY(performed_by) REFERENCES employee(employee_id) ON DELETE RESTRICT
);