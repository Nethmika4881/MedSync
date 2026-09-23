-- ============================================================
-- PART 2
-- IDENTITY
-- ============================================================


-- ------------------------------------------------------------
-- ADDRESS
-- ------------------------------------------------------------

CREATE TABLE address (
    address_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address_line1   VARCHAR(100) NOT NULL,
    address_line2   VARCHAR(100),
    city            VARCHAR(50) NOT NULL,
    province        VARCHAR(50),
    postal_code     VARCHAR(10),
    country         VARCHAR(50) DEFAULT 'Sri Lanka',
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP
);


-- ------------------------------------------------------------
-- CONTACT
-- ------------------------------------------------------------

CREATE TABLE contact (
    contact_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP
);


-- ------------------------------------------------------------
-- CONTACT NUMBER
-- ------------------------------------------------------------

CREATE TABLE contact_number (
    contact_number_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    contact_id        UUID NOT NULL,

    number_type       contact_number_type_enum NOT NULL,

    number            VARCHAR(20) NOT NULL,

    is_primary        BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_contact_number_belongs_to_contact
        FOREIGN KEY (contact_id)
        REFERENCES contact(contact_id)
        ON DELETE CASCADE
);


-- ------------------------------------------------------------
-- APP USER
-- ------------------------------------------------------------

CREATE TABLE app_user (
    user_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    address_id     UUID NOT NULL,

    contact_id     UUID NOT NULL,

    user_type      user_type_enum NOT NULL,

    full_name      VARCHAR(255) NOT NULL,

    nic            VARCHAR(20) NOT NULL UNIQUE,

    email          VARCHAR(255) NOT NULL UNIQUE,

    gender         gender_enum,

    dob            DATE NOT NULL,

    password_hash  VARCHAR(255) NOT NULL,

    last_login     TIMESTAMP,

    is_active      BOOLEAN DEFAULT TRUE,

    created_at     TIMESTAMP DEFAULT NOW(),

    updated_at     TIMESTAMP,

    CONSTRAINT fk_app_user_lives_at_address
        FOREIGN KEY (address_id)
        REFERENCES address(address_id),

    CONSTRAINT fk_app_user_has_contact
        FOREIGN KEY (contact_id)
        REFERENCES contact(contact_id)
);


-- Search index for user names
CREATE INDEX idx_app_user_full_name
ON app_user(full_name);