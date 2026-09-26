-- ============================================================
-- PART 1
-- CATMS - PostgreSQL ENUMS
-- ============================================================

-- Allows PostgreSQL to generate UUIDs automatically
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ------------------------------------------------------------
-- User Type
-- ------------------------------------------------------------

CREATE TYPE user_type_enum AS ENUM (
    'Patient',
    'Employee'
);


-- ------------------------------------------------------------
-- Gender
-- ------------------------------------------------------------

CREATE TYPE gender_enum AS ENUM (
    'Male',
    'Female',
    'Other'
);


-- ------------------------------------------------------------
-- Contact Number Type
-- ------------------------------------------------------------

CREATE TYPE contact_number_type_enum AS ENUM (
    'Mobile',
    'Home',
    'Work'
);


-- ------------------------------------------------------------
-- Employee Role
-- ------------------------------------------------------------

CREATE TYPE employee_role_enum AS ENUM (
    'Doctor',
    'FrontDesk',
    'Admin'
);


-- ------------------------------------------------------------
-- Treatment Category
-- ------------------------------------------------------------

CREATE TYPE treatment_category_enum AS ENUM (
    'Consultation',
    'Radiology',
    'Laboratory',
    'Injection',
    'Surgery',
    'Other'
);


-- ------------------------------------------------------------
-- Appointment Status
-- ------------------------------------------------------------

CREATE TYPE appointment_status_enum AS ENUM (
    'Scheduled',
    'Completed',
    'Cancelled',
    'NoShow',
    'Rescheduled'
);


-- ------------------------------------------------------------
-- Appointment Source
-- ------------------------------------------------------------

CREATE TYPE appointment_source_enum AS ENUM (
    'Booked',
    'Walkin',
    'Emergency'
);


-- ------------------------------------------------------------
-- Invoice Status
-- ------------------------------------------------------------

CREATE TYPE invoice_status_enum AS ENUM (
    'Unpaid',
    'PartiallyPaid',
    'Paid'
);


-- ------------------------------------------------------------
-- Payment Method
-- ------------------------------------------------------------

CREATE TYPE payment_method_enum AS ENUM (
    'Cash',
    'Card',
    'BankTransfer',
    'InsuranceSettlement',
    'OnlinePayment'
);


-- ------------------------------------------------------------
-- Insurance Claim Status
-- ------------------------------------------------------------

CREATE TYPE claim_status_enum AS ENUM (
    'Submitted',
    'UnderReview',
    'Approved',
    'PartiallyApproved',
    'Rejected',
    'Settled'
);


-- ------------------------------------------------------------
-- Insurance Policy Status
-- ------------------------------------------------------------

CREATE TYPE policy_status_enum AS ENUM (
    'Active',
    'Expired',
    'Cancelled'
);