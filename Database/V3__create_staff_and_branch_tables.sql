-- ============================================================
-- PART 3
-- STAFF & BRANCH
-- ============================================================


-- ------------------------------------------------------------
-- BRANCH
-- ------------------------------------------------------------

CREATE TABLE branch (
    branch_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    branch_name  VARCHAR(100) NOT NULL,

    address_id   UUID NOT NULL,

    contact_id   UUID NOT NULL,

    manager_id   UUID,

    opened_date  DATE,

    is_active    BOOLEAN DEFAULT TRUE,

    created_at   TIMESTAMP DEFAULT NOW(),

    updated_at   TIMESTAMP,

    CONSTRAINT fk_branch_located_at_address
        FOREIGN KEY (address_id)
        REFERENCES address(address_id),

    CONSTRAINT fk_branch_has_contact
        FOREIGN KEY (contact_id)
        REFERENCES contact(contact_id)
);


-- ------------------------------------------------------------
-- EMPLOYEE
-- ------------------------------------------------------------

CREATE TABLE employee (
    employee_id  UUID PRIMARY KEY,

    branch_id    UUID,

    role         employee_role_enum NOT NULL,

    salary       DECIMAL(10,2),

    joined_date  DATE,

    end_date     DATE,

    is_active    BOOLEAN DEFAULT TRUE,

    created_at   TIMESTAMP DEFAULT NOW(),

    updated_at   TIMESTAMP,

    CONSTRAINT fk_employee_isa_app_user
        FOREIGN KEY (employee_id)
        REFERENCES app_user(user_id),

    CONSTRAINT fk_employee_works_at_branch
        FOREIGN KEY (branch_id)
        REFERENCES branch(branch_id)
);


-- ------------------------------------------------------------
-- BRANCH MANAGER FOREIGN KEY
-- Added after employee exists
-- ------------------------------------------------------------

ALTER TABLE branch
ADD CONSTRAINT fk_branch_managed_by_employee
FOREIGN KEY (manager_id)
REFERENCES employee(employee_id);


-- ------------------------------------------------------------
-- EMPLOYEE INDEX
-- ------------------------------------------------------------

CREATE INDEX idx_employee_branch_role
ON employee(branch_id, role);


-- ------------------------------------------------------------
-- DOCTOR
-- ------------------------------------------------------------

CREATE TABLE doctor (
    doctor_id           UUID PRIMARY KEY,

    room_no             VARCHAR(5),

    medical_licence_no  VARCHAR(50) NOT NULL UNIQUE,

    consultation_fee    DECIMAL(10,2)
                        NOT NULL
                        DEFAULT 1500.00,

    years_experience    INT,

    qualification       VARCHAR(150),

    is_available        BOOLEAN DEFAULT TRUE,

    created_at          TIMESTAMP DEFAULT NOW(),

    updated_at          TIMESTAMP,

    CONSTRAINT fk_doctor_isa_employee
        FOREIGN KEY (doctor_id)
        REFERENCES employee(employee_id)
);


-- ------------------------------------------------------------
-- SPECIALIZATION
-- ------------------------------------------------------------

CREATE TABLE specialization (
    specialization_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title             VARCHAR(100) NOT NULL UNIQUE,

    other_details     VARCHAR(255),

    created_at        TIMESTAMP DEFAULT NOW()
);


-- ------------------------------------------------------------
-- DOCTOR SPECIALIZATION
-- Many-to-many relationship
-- ------------------------------------------------------------

CREATE TABLE doctor_specialization (
    doctor_id          UUID NOT NULL,

    specialization_id  UUID NOT NULL,

    certification_date DATE,

    CONSTRAINT pk_doctor_specialization
        PRIMARY KEY (
            doctor_id,
            specialization_id
        ),

    CONSTRAINT fk_doctor_specialization_of_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctor(doctor_id),

    CONSTRAINT fk_doctor_specialization_in_field
        FOREIGN KEY (specialization_id)
        REFERENCES specialization(specialization_id)
);


-- ------------------------------------------------------------
-- DOCTOR SCHEDULE
-- ------------------------------------------------------------

CREATE TABLE doctor_schedule (
    schedule_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    doctor_id             UUID NOT NULL,

    branch_id             UUID NOT NULL,

    day_of_week           INT NOT NULL,

    start_time            TIME NOT NULL,

    end_time              TIME NOT NULL,

    slot_duration_minutes INT DEFAULT 15,

    created_at             TIMESTAMP DEFAULT NOW(),

    updated_at             TIMESTAMP,

    CONSTRAINT fk_doctor_schedule_sets_hours_for_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctor(doctor_id),

    CONSTRAINT fk_doctor_schedule_held_at_branch
        FOREIGN KEY (branch_id)
        REFERENCES branch(branch_id)
);


CREATE INDEX idx_doctor_schedule_doctor_day
ON doctor_schedule(doctor_id, day_of_week);


CREATE INDEX idx_doctor_schedule_branch_day
ON doctor_schedule(branch_id, day_of_week);
