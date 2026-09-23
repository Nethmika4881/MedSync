-- ============================================================
-- PART 5
-- APPOINTMENTS & CLINICAL
-- ============================================================


-- ------------------------------------------------------------
-- TREATMENT CATALOGUE
-- ------------------------------------------------------------

CREATE TABLE treatment_catalogue (
    treatment_service_code UUID
        PRIMARY KEY DEFAULT gen_random_uuid(),

    category treatment_category_enum
        NOT NULL,

    treatment_name VARCHAR(100)
        NOT NULL,

    base_price DECIMAL(10,2)
        NOT NULL,

    duration TIME,

    description TEXT,

    is_insurable BOOLEAN
        DEFAULT TRUE,

    is_active BOOLEAN
        DEFAULT TRUE,

    created_at TIMESTAMP
        DEFAULT NOW(),

    updated_at TIMESTAMP
);


CREATE INDEX idx_treatment_catalogue_category
ON treatment_catalogue(category);


-- ------------------------------------------------------------
-- MEDICATION
-- ------------------------------------------------------------

CREATE TABLE medication (
    medication_id UUID
        PRIMARY KEY DEFAULT gen_random_uuid(),

    generic_name VARCHAR(100)
        NOT NULL,

    brand_name VARCHAR(100)
);


-- ------------------------------------------------------------
-- TIME SLOT
-- ------------------------------------------------------------

CREATE TABLE time_slot (
    time_slot_id UUID
        PRIMARY KEY DEFAULT gen_random_uuid(),

    doctor_id UUID
        NOT NULL,

    branch_id UUID
        NOT NULL,

    available_date DATE
        NOT NULL,

    start_time TIME
        NOT NULL,

    end_time TIME
        NOT NULL,

    max_tickets INT
        NOT NULL,

    current_serving_number INT
        DEFAULT 0,

    created_at TIMESTAMP
        DEFAULT NOW(),

    updated_at TIMESTAMP,

    CONSTRAINT fk_time_slot_assigned_to_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctor(doctor_id),

    CONSTRAINT fk_time_slot_hosted_at_branch
        FOREIGN KEY (branch_id)
        REFERENCES branch(branch_id),

    CONSTRAINT idx_doctor_session_overlap
        UNIQUE (
            doctor_id,
            available_date,
            start_time,
            end_time
        )
);


CREATE INDEX idx_slot_search
ON time_slot(available_date);


-- ------------------------------------------------------------
-- APPOINTMENT
-- ------------------------------------------------------------

CREATE TABLE appointment (
    appointment_id UUID
        PRIMARY KEY DEFAULT gen_random_uuid(),

    time_slot_id UUID
        NOT NULL,

    patient_id UUID
        NOT NULL,

    queue_number INT
        NOT NULL,

    created_by UUID
        NOT NULL,

    rescheduled_from UUID,

    status appointment_status_enum
        DEFAULT 'Scheduled',

    source appointment_source_enum
        DEFAULT 'Booked',

    reason_for_visit VARCHAR(255),

    notes TEXT,

    cancelled_reason VARCHAR(255),

    created_at TIMESTAMP
        DEFAULT NOW(),

    updated_at TIMESTAMP,

    CONSTRAINT fk_appointment_booked_in_time_slot
        FOREIGN KEY (time_slot_id)
        REFERENCES time_slot(time_slot_id),

    CONSTRAINT fk_appointment_made_by_patient
        FOREIGN KEY (patient_id)
        REFERENCES patient(patient_id),

    CONSTRAINT fk_appointment_created_by_employee
        FOREIGN KEY (created_by)
        REFERENCES employee(employee_id),

    CONSTRAINT fk_appointment_rescheduled_from_appointment
        FOREIGN KEY (rescheduled_from)
        REFERENCES appointment(appointment_id),

    CONSTRAINT idx_unique_ticket_per_session
        UNIQUE (
            time_slot_id,
            queue_number
        )
);


CREATE INDEX idx_appointment_status
ON appointment(status);


-- ------------------------------------------------------------
-- CONSULTATION RECORD
-- ------------------------------------------------------------

CREATE TABLE consultation_record (
    consultation_rec_id UUID
        PRIMARY KEY DEFAULT gen_random_uuid(),

    appointment_id UUID
        NOT NULL UNIQUE,

    symptoms TEXT,

    diagnosis TEXT,

    follow_up_required BOOLEAN
        DEFAULT FALSE,

    follow_up_date DATE,

    created_at TIMESTAMP
        DEFAULT NOW(),

    updated_at TIMESTAMP,

    CONSTRAINT fk_consultation_record_documents_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES appointment(appointment_id)
);


-- ------------------------------------------------------------
-- APPOINTMENT TREATMENT
-- ------------------------------------------------------------

CREATE TABLE appointment_treatment (
    appointment_treatment_id UUID
        PRIMARY KEY DEFAULT gen_random_uuid(),

    appointment_id UUID
        NOT NULL,

    treatment_service_code UUID
        NOT NULL,

    performed_by UUID
        NOT NULL,

    quantity INT
        DEFAULT 1,

    unit_price DECIMAL(10,2)
        NOT NULL,

    line_total DECIMAL(10,2)
        NOT NULL,

    notes VARCHAR(255),

    performed_at TIMESTAMP
        DEFAULT NOW(),

    CONSTRAINT fk_appointment_treatment_billed_on_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES appointment(appointment_id),

    CONSTRAINT fk_appointment_treatment_selected_from_catalogue
        FOREIGN KEY (treatment_service_code)
        REFERENCES treatment_catalogue(treatment_service_code),

    CONSTRAINT fk_appointment_treatment_performed_by_employee
        FOREIGN KEY (performed_by)
        REFERENCES employee(employee_id)
);


-- ------------------------------------------------------------
-- PRESCRIPTION
-- ------------------------------------------------------------

CREATE TABLE prescription (
    prescription_id UUID
        PRIMARY KEY DEFAULT gen_random_uuid(),

    appointment_id UUID
        NOT NULL,

    medication_id UUID
        NOT NULL,

    dosage VARCHAR(50)
        NOT NULL,

    frequency VARCHAR(50),

    duration_days INT,

    notes VARCHAR(255),

    allergy_checked BOOLEAN
        DEFAULT FALSE,

    created_at TIMESTAMP
        DEFAULT NOW(),

    CONSTRAINT fk_prescription_issued_for_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES appointment(appointment_id),

    CONSTRAINT fk_prescription_specifies_medication
        FOREIGN KEY (medication_id)
        REFERENCES medication(medication_id)
);