ALTER TABLE medication
    ADD COLUMN strength VARCHAR(50), ADD COLUMN form VARCHAR(30), ADD COLUMN category VARCHAR(50), ADD COLUMN is_active BOOLEAN DEFAULT TRUE, ADD COLUMN created_at TIMESTAMP DEFAULT NOW(), ADD COLUMN updated_at TIMESTAMP;

CREATE INDEX idx_medication_generic_name ON medication(generic_name);

CREATE INDEX idx_medication_brand_name ON medication(brand_name);
