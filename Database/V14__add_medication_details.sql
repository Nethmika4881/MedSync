-- The consultation workspace shows strength/form/category in medication search
-- and uses strength as the default prescription dosage, so the catalogue needs them.

ALTER TABLE medication
    ADD COLUMN strength   VARCHAR(50),   -- e.g. '500mg', '5mg/5ml'
    ADD COLUMN form       VARCHAR(30),   -- e.g. 'Tablet', 'Capsule', 'Syrup', 'Injection'
    ADD COLUMN category   VARCHAR(50),   -- therapeutic class, e.g. 'Antibiotic', 'Analgesic'
    ADD COLUMN is_active  BOOLEAN DEFAULT TRUE,
    ADD COLUMN created_at TIMESTAMP DEFAULT NOW(),
    ADD COLUMN updated_at TIMESTAMP;

-- Doctors search medications by name while prescribing.
CREATE INDEX idx_medication_generic_name
ON medication(generic_name);

CREATE INDEX idx_medication_brand_name
ON medication(brand_name);
