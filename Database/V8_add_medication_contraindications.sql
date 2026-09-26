-- lib/contraindication.ts reads this field to
-- block unsafe prescriptions against a patient's known allergies. The
-- column doesn't exist yet, so the safety check currently can't run.

ALTER TABLE medication ADD COLUMN contraindications TEXT;