CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_type_enum AS ENUM (
    'Patient',
    'Employee'
);

CREATE TYPE gender_enum AS ENUM (
    'Male',
    'Female',
    'Other'
);

CREATE TYPE contact_number_type_enum AS ENUM (
    'Mobile',
    'Home',
    'Work'
);

CREATE TYPE employee_role_enum AS ENUM (
    'Doctor',
    'FrontDesk',
    'Admin'
);

CREATE TYPE treatment_category_enum AS ENUM (
    'Consultation',
    'Radiology',
    'Laboratory',
    'Injection',
    'Surgery',
    'Other'
);

CREATE TYPE appointment_status_enum AS ENUM (
    'Scheduled',
    'Completed',
    'Cancelled',
    'NoShow',
    'Rescheduled'
);

CREATE TYPE appointment_source_enum AS ENUM (
    'Booked',
    'Walkin',
    'Emergency'
);

CREATE TYPE invoice_status_enum AS ENUM (
    'Unpaid',
    'PartiallyPaid',
    'Paid'
);

CREATE TYPE payment_method_enum AS ENUM (
    'Cash',
    'Card',
    'BankTransfer',
    'InsuranceSettlement',
    'OnlinePayment'
);

CREATE TYPE claim_status_enum AS ENUM (
    'Submitted',
    'UnderReview',
    'Approved',
    'PartiallyApproved',
    'Rejected',
    'Settled'
);

CREATE TYPE policy_status_enum AS ENUM (
    'Active',
    'Expired',
    'Cancelled'
);
