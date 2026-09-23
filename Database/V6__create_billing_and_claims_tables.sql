-- ============================================================
-- PART 6
-- BILLING & INSURANCE CLAIMS
-- ============================================================


-- ------------------------------------------------------------
-- INVOICE
-- ------------------------------------------------------------

CREATE TABLE invoice (
    invoice_id UUID
        PRIMARY KEY DEFAULT gen_random_uuid(),

    appointment_id UUID
        NOT NULL UNIQUE,

    patient_id UUID
        NOT NULL,

    invoice_date TIMESTAMP
        DEFAULT NOW(),

    gross_amount DECIMAL(12,2)
        NOT NULL,

    discount_amount DECIMAL(12,2)
        DEFAULT 0.00,

    tax_amount DECIMAL(12,2)
        DEFAULT 0.00,

    net_amount DECIMAL(12,2)
        NOT NULL,

    paid_amount DECIMAL(12,2)
        DEFAULT 0.00,

    due_amount DECIMAL(12,2)
        NOT NULL,

    insurance_covered_amount DECIMAL(12,2)
        DEFAULT 0.00,

    status invoice_status_enum
        DEFAULT 'Unpaid',

    created_at TIMESTAMP
        DEFAULT NOW(),

    updated_at TIMESTAMP,

    CONSTRAINT fk_invoice_bills_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES appointment(appointment_id),

    CONSTRAINT fk_invoice_charged_to_patient
        FOREIGN KEY (patient_id)
        REFERENCES patient(patient_id)
);


CREATE INDEX idx_invoice_patient_id
ON invoice(patient_id);


CREATE INDEX idx_invoice_status
ON invoice(status);


CREATE INDEX idx_invoice_invoice_date
ON invoice(invoice_date);


-- ------------------------------------------------------------
-- PAYMENT
-- ------------------------------------------------------------

CREATE TABLE payment (
    payment_id UUID
        PRIMARY KEY DEFAULT gen_random_uuid(),

    invoice_id UUID
        NOT NULL,

    amount DECIMAL(12,2)
        NOT NULL,

    payment_date TIMESTAMP
        DEFAULT NOW(),

    payment_method payment_method_enum
        NOT NULL,

    received_by UUID
        NOT NULL,

    reference_number VARCHAR(50),

    created_at TIMESTAMP
        DEFAULT NOW(),

    CONSTRAINT fk_payment_settles_invoice
        FOREIGN KEY (invoice_id)
        REFERENCES invoice(invoice_id),

    CONSTRAINT fk_payment_received_by_employee
        FOREIGN KEY (received_by)
        REFERENCES employee(employee_id)
);


CREATE INDEX idx_payment_invoice_id
ON payment(invoice_id);


CREATE INDEX idx_payment_payment_date
ON payment(payment_date);


-- ------------------------------------------------------------
-- INSURANCE CLAIM
-- ------------------------------------------------------------

CREATE TABLE insurance_claim (
    claim_id UUID
        PRIMARY KEY DEFAULT gen_random_uuid(),

    invoice_id UUID
        NOT NULL,

    insurance_id UUID
        NOT NULL,

    claim_date TIMESTAMP
        DEFAULT NOW(),

    claimed_amount DECIMAL(12,2)
        NOT NULL,

    approved_amount DECIMAL(12,2)
        DEFAULT 0.00,

    status claim_status_enum
        DEFAULT 'Submitted',

    settlement_date TIMESTAMP,

    remarks VARCHAR(255),

    created_at TIMESTAMP
        DEFAULT NOW(),

    updated_at TIMESTAMP,

    CONSTRAINT fk_insurance_claim_filed_against_invoice
        FOREIGN KEY (invoice_id)
        REFERENCES invoice(invoice_id),

    CONSTRAINT fk_insurance_claim_drawn_from_policy
        FOREIGN KEY (insurance_id)
        REFERENCES insurance(insurance_id)
);


CREATE INDEX idx_insurance_claim_invoice_id
ON insurance_claim(invoice_id);


CREATE INDEX idx_insurance_claim_insurance_id
ON insurance_claim(insurance_id);


CREATE INDEX idx_insurance_claim_status
ON insurance_claim(status);


-- ------------------------------------------------------------
-- INSURANCE CLAIM ITEM
-- ------------------------------------------------------------

CREATE TABLE insurance_claim_item (
    claim_item_id UUID
        PRIMARY KEY DEFAULT gen_random_uuid(),

    claim_id UUID
        NOT NULL,

    appointment_treatment_id UUID
        NOT NULL,

    claimed_amount DECIMAL(10,2)
        NOT NULL,

    approved_amount DECIMAL(10,2)
        DEFAULT 0.00,

    CONSTRAINT fk_insurance_claim_item_itemizes_claim
        FOREIGN KEY (claim_id)
        REFERENCES insurance_claim(claim_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_insurance_claim_item_covers_treatment
        FOREIGN KEY (appointment_treatment_id)
        REFERENCES appointment_treatment(appointment_treatment_id)
);


CREATE INDEX idx_insurance_claim_item_claim_id
ON insurance_claim_item(claim_id);


CREATE INDEX idx_insurance_claim_item_treatment_id
ON insurance_claim_item(appointment_treatment_id);