ALTER TABLE doctor_specialization
ADD CONSTRAINT uq_doctor_one_specialization
UNIQUE (doctor_id);