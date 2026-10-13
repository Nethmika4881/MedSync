/*
 MedSync demo seed for PostgreSQL and Neon

 Prerequisite: apply Flyway migrations V1 through V39 first.

 This script is safe to run more than once. It uses stable UUID values and
 ON CONFLICT clauses. It adds at least ten demo rows to every application
 table. Existing admin@medsync.com and frontdesk@medsync.com accounts are
 given the same demo password as the accounts created here.

 Shared demo password: password123
 Password storage: Node.js crypto.scrypt, 64 bytes, hexadecimal output.
 The plain password is never stored in the database.
*/

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.seed_uuid(seed_key TEXT)
RETURNS UUID
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT (
    SUBSTR(MD5(seed_key), 1, 8) || '-' ||
    SUBSTR(MD5(seed_key), 9, 4) || '-' ||
    SUBSTR(MD5(seed_key), 13, 4) || '-' ||
    SUBSTR(MD5(seed_key), 17, 4) || '-' ||
    SUBSTR(MD5(seed_key), 21, 12)
  )::UUID;
$$;

/* The shared password is password123. */
UPDATE app_user
SET salt = 'mx9OM4mf7LRDXiYwIJ4n',
    password_hash = 'c20040d3b12cc17e020b8dcdac7b2834ff5b5dafa907a60878416a374498f35d73458c82f0f6e26c539197185f05c2c6ca4341e4aaa092812c98cd726df2f08b',
    is_active = TRUE
WHERE email IN ('admin@medsync.com', 'frontdesk@medsync.com');

/* Ten branches need ten addresses and contacts. They start inactive because
   the live schema requires an active branch to already have a manager. */
INSERT INTO address (
  address_id, address_line1, address_line2, city, province, postal_code, country
)
SELECT
  pg_temp.seed_uuid('branch-address-' || i),
  (ARRAY['12 Galle Road','44 Kandy Road','18 Negombo Road','91 Main Street','27 Temple Road',
         '63 Lake Road','35 Hospital Lane','72 Station Road','10 Beach Road','55 Park Avenue'])[i],
  'MedSync Branch ' || LPAD(i::TEXT, 2, '0'),
  (ARRAY['Colombo','Kandy','Galle','Jaffna','Negombo','Kurunegala','Matara','Ratnapura','Batticaloa','Anuradhapura'])[i],
  (ARRAY['Western','Central','Southern','Northern','Western','North Western','Southern','Sabaragamuwa','Eastern','North Central'])[i],
  LPAD((10000 + i * 137)::TEXT, 5, '0'),
  'Sri Lanka'
FROM generate_series(1, 10) AS g(i)
ON CONFLICT (address_id) DO NOTHING;

INSERT INTO contact (contact_id)
SELECT pg_temp.seed_uuid('branch-contact-' || i)
FROM generate_series(1, 10) AS g(i)
ON CONFLICT (contact_id) DO NOTHING;

INSERT INTO contact_number (
  contact_number_id, contact_id, number_type, number, is_primary
)
SELECT
  pg_temp.seed_uuid('branch-phone-' || i),
  pg_temp.seed_uuid('branch-contact-' || i),
  'Work'::contact_number_type_enum,
  '0112' || LPAD((100000 + i)::TEXT, 6, '0'),
  TRUE
FROM generate_series(1, 10) AS g(i)
ON CONFLICT (contact_number_id) DO NOTHING;

INSERT INTO branch (
  branch_id, branch_name, address_id, contact_id, opened_date, is_active
)
SELECT
  pg_temp.seed_uuid('branch-' || i),
  (ARRAY['Colombo Central','Kandy City','Galle Fort','Jaffna Medical','Negombo Coast',
         'Kurunegala Care','Matara Wellness','Ratnapura Health','Batticaloa East','Anuradhapura North'])[i],
  pg_temp.seed_uuid('branch-address-' || i),
  pg_temp.seed_uuid('branch-contact-' || i),
  DATE '2015-01-01' + (i * 180),
  FALSE
FROM generate_series(1, 10) AS g(i)
ON CONFLICT (branch_id) DO NOTHING;

/* Forty demo people: ten patients, doctors, front desk workers, and admins. */
INSERT INTO address (
  address_id, address_line1, address_line2, city, province, postal_code, country
)
SELECT
  pg_temp.seed_uuid(role_name || '-address-' || i),
  (20 + i)::TEXT || ' ' || INITCAP(role_name) || ' Residence',
  'Apartment ' || i,
  (ARRAY['Colombo','Kandy','Galle','Jaffna','Negombo','Kurunegala','Matara','Ratnapura','Batticaloa','Anuradhapura'])[i],
  (ARRAY['Western','Central','Southern','Northern','Western','North Western','Southern','Sabaragamuwa','Eastern','North Central'])[i],
  LPAD((20000 + i * 91)::TEXT, 5, '0'),
  'Sri Lanka'
FROM (VALUES ('patient'), ('doctor'), ('frontdesk'), ('admin')) AS roles(role_name)
CROSS JOIN generate_series(1, 10) AS g(i)
ON CONFLICT (address_id) DO NOTHING;

INSERT INTO contact (contact_id)
SELECT pg_temp.seed_uuid(role_name || '-contact-' || i)
FROM (VALUES ('patient'), ('doctor'), ('frontdesk'), ('admin')) AS roles(role_name)
CROSS JOIN generate_series(1, 10) AS g(i)
ON CONFLICT (contact_id) DO NOTHING;

INSERT INTO contact_number (
  contact_number_id, contact_id, number_type, number, is_primary
)
SELECT
  pg_temp.seed_uuid(role_name || '-phone-' || i),
  pg_temp.seed_uuid(role_name || '-contact-' || i),
  'Mobile'::contact_number_type_enum,
  CASE role_name
    WHEN 'patient' THEN '0771'
    WHEN 'doctor' THEN '0772'
    WHEN 'frontdesk' THEN '0773'
    ELSE '0774'
  END || LPAD(i::TEXT, 6, '0'),
  TRUE
FROM (VALUES ('patient'), ('doctor'), ('frontdesk'), ('admin')) AS roles(role_name)
CROSS JOIN generate_series(1, 10) AS g(i)
ON CONFLICT (contact_number_id) DO NOTHING;

INSERT INTO app_user (
  user_id, address_id, contact_id, user_type, full_name, nic, email,
  gender, dob, password_hash, salt, is_active
)
SELECT
  pg_temp.seed_uuid(role_name || '-user-' || i),
  pg_temp.seed_uuid(role_name || '-address-' || i),
  pg_temp.seed_uuid(role_name || '-contact-' || i),
  CASE WHEN role_name = 'patient' THEN 'Patient' ELSE 'Employee' END::user_type_enum,
  CASE role_name
    WHEN 'patient' THEN (ARRAY['Nimal Perera','Kavindi Silva','Dinesh Fernando','Ayesha Jayasinghe','Ruwan Bandara','Tharushi Dias','Kasun Herath','Ishara Gunawardena','Malith Senanayake','Piumi Wijeratne'])[i]
    WHEN 'doctor' THEN (ARRAY['Dr Amal Perera','Dr Sachi Silva','Dr Ruwan Fernando','Dr Nadeesha Jayasinghe','Dr Ishan Bandara','Dr Dilani Dias','Dr Kavish Herath','Dr Tharindu Gunawardena','Dr Minoli Senanayake','Dr Asela Wijeratne'])[i]
    WHEN 'frontdesk' THEN 'Front Desk Officer ' || LPAD(i::TEXT, 2, '0')
    ELSE 'Branch Administrator ' || LPAD(i::TEXT, 2, '0')
  END,
  CASE role_name WHEN 'patient' THEN '199' WHEN 'doctor' THEN '198' WHEN 'frontdesk' THEN '200' ELSE '197' END
    || LPAD(i::TEXT, 9, '0'),
  CASE
    WHEN role_name = 'patient' AND i = 1 THEN 'patient@medsync.com'
    WHEN role_name = 'doctor' AND i = 1 THEN 'doctor@medsync.com'
    ELSE role_name || LPAD(i::TEXT, 2, '0') || '@medsync.com'
  END,
  (ARRAY['Male','Female','Male','Female','Male','Female','Male','Female','Male','Female'])[i]::gender_enum,
  CASE role_name
    WHEN 'patient' THEN DATE '1988-01-15' + (i * 260)
    WHEN 'doctor' THEN DATE '1972-03-10' + (i * 310)
    WHEN 'frontdesk' THEN DATE '1990-06-20' + (i * 190)
    ELSE DATE '1978-09-01' + (i * 220)
  END,
  'c20040d3b12cc17e020b8dcdac7b2834ff5b5dafa907a60878416a374498f35d73458c82f0f6e26c539197185f05c2c6ca4341e4aaa092812c98cd726df2f08b',
  'mx9OM4mf7LRDXiYwIJ4n',
  TRUE
FROM (VALUES ('patient'), ('doctor'), ('frontdesk'), ('admin')) AS roles(role_name)
CROSS JOIN generate_series(1, 10) AS g(i)
ON CONFLICT DO NOTHING;

/* Employees are inserted before managers are assigned to avoid the circular
   branch to employee relationship. */
INSERT INTO employee (
  employee_id, branch_id, role, salary, joined_date, is_active
)
SELECT
  pg_temp.seed_uuid(role_name || '-user-' || i),
  pg_temp.seed_uuid('branch-' || i),
  CASE role_name
    WHEN 'doctor' THEN 'Doctor'
    WHEN 'frontdesk' THEN 'FrontDesk'
    ELSE 'Admin'
  END::employee_role_enum,
  CASE role_name WHEN 'doctor' THEN 275000.00 WHEN 'frontdesk' THEN 85000.00 ELSE 185000.00 END + i * 2500,
  DATE '2020-01-01' + (i * 45),
  TRUE
FROM (VALUES ('doctor'), ('frontdesk'), ('admin')) AS roles(role_name)
CROSS JOIN generate_series(1, 10) AS g(i)
ON CONFLICT (employee_id) DO NOTHING;

UPDATE branch b
SET manager_id = pg_temp.seed_uuid('admin-user-' || s.i),
    is_active = TRUE
FROM generate_series(1, 10) AS s(i)
WHERE b.branch_id = pg_temp.seed_uuid('branch-' || s.i);

INSERT INTO doctor (
  doctor_id, room_no, medical_licence_no, consultation_fee,
  years_experience, qualification, is_available
)
SELECT
  pg_temp.seed_uuid('doctor-user-' || i),
  'R' || LPAD(i::TEXT, 2, '0'),
  'SLMC-DEMO-' || LPAD(i::TEXT, 4, '0'),
  1800.00 + i * 200,
  4 + i * 2,
  (ARRAY['MBBS, MD','MBBS, MD Cardiology','MBBS, MS','MBBS, DCH','MBBS, MD Neurology',
         'MBBS, MD Dermatology','MBBS, MS ENT','MBBS, MD Psychiatry','MBBS, MD Radiology','MBBS, MD Oncology'])[i],
  TRUE
FROM generate_series(1, 10) AS g(i)
ON CONFLICT (doctor_id) DO NOTHING;

INSERT INTO patient (
  patient_id, blood_group, registered_branch_id,
  emergency_contact_name, emergency_contact_phone, emergency_contact_relationship
)
SELECT
  pg_temp.seed_uuid('patient-user-' || i),
  (ARRAY['O+','A+','B+','AB+','O-','A-','B-','AB-','O+','A+'])[i],
  pg_temp.seed_uuid('branch-' || i),
  'Emergency Contact ' || LPAD(i::TEXT, 2, '0'),
  '0715' || LPAD(i::TEXT, 6, '0'),
  (ARRAY['Spouse','Parent','Sibling','Parent','Spouse','Sibling','Parent','Spouse','Sibling','Parent'])[i]
FROM generate_series(1, 10) AS g(i)
ON CONFLICT (patient_id) DO NOTHING;

INSERT INTO specialization (specialization_id, title, other_details)
SELECT
  pg_temp.seed_uuid('specialization-' || i),
  (ARRAY['General Medicine','Cardiology','General Surgery','Paediatrics','Neurology',
         'Dermatology','Otolaryngology','Psychiatry','Radiology','Oncology'])[i],
  'Demo specialist service number ' || i
FROM generate_series(1, 10) AS g(i)
ON CONFLICT DO NOTHING;

INSERT INTO doctor_specialization (
  doctor_id, specialization_id, certification_date
)
SELECT
  pg_temp.seed_uuid('doctor-user-' || i),
  pg_temp.seed_uuid('specialization-' || i),
  DATE '2012-01-01' + (i * 210)
FROM generate_series(1, 10) AS g(i)
ON CONFLICT DO NOTHING;

INSERT INTO doctor_schedule (
  schedule_id, doctor_id, branch_id, day_of_week,
  start_time, end_time, slot_duration_minutes
)
SELECT
  pg_temp.seed_uuid('schedule-' || i),
  pg_temp.seed_uuid('doctor-user-' || i),
  pg_temp.seed_uuid('branch-' || i),
  i % 7,
  TIME '08:00' + ((i % 3) * INTERVAL '1 hour'),
  TIME '12:00' + ((i % 3) * INTERVAL '1 hour'),
  20
FROM generate_series(1, 10) AS g(i)
ON CONFLICT (schedule_id) DO NOTHING;

INSERT INTO insurance_package (
  insurance_package_id, provider_name, package_name, annual_limit,
  copayment_percentage, description, is_active
)
SELECT
  pg_temp.seed_uuid('insurance-package-' || i),
  (ARRAY['Ceylinco Life','AIA Sri Lanka','Union Assurance','Sri Lanka Insurance','Allianz Lanka',
         'Softlogic Life','Janashakthi Life','HNB Assurance','Fairfirst Insurance','Cooperative Insurance'])[i],
  'MedCare ' || (ARRAY['Basic','Silver','Gold','Family','Plus','Prime','Essential','Premium','Elite','Complete'])[i],
  250000.00 + i * 75000,
  5.00 + i,
  'Demo health insurance package ' || i,
  TRUE
FROM generate_series(1, 10) AS g(i)
ON CONFLICT DO NOTHING;

INSERT INTO insurance (
  insurance_id, patient_id, insurance_package_id, policy_number,
  used_coverage_amount, status, start_date, end_date
)
SELECT
  pg_temp.seed_uuid('insurance-' || i),
  pg_temp.seed_uuid('patient-user-' || i),
  pg_temp.seed_uuid('insurance-package-' || i),
  'POL-DEMO-' || LPAD(i::TEXT, 6, '0'),
  i * 3500.00,
  'Active'::policy_status_enum,
  CURRENT_DATE - INTERVAL '90 days',
  CURRENT_DATE + INTERVAL '275 days'
FROM generate_series(1, 10) AS g(i)
ON CONFLICT DO NOTHING;

INSERT INTO treatment_catalogue (
  treatment_service_code, category, treatment_name, base_price,
  duration, description, is_insurable, is_active
)
SELECT
  pg_temp.seed_uuid('treatment-' || i),
  (ARRAY['Consultation','Laboratory','Radiology','Injection','Procedure',
         'Therapy','Surgery','Laboratory','Radiology','Other'])[i]::treatment_category_enum,
  (ARRAY['Specialist Consultation','Full Blood Count','Chest X Ray','Vitamin B12 Injection','Wound Dressing',
         'Physiotherapy Session','Minor Surgical Procedure','Lipid Profile','Abdominal Ultrasound','Medical Certificate'])[i],
  (ARRAY[2500,1800,4500,1200,2200,3500,15000,2800,6500,1000])[i]::NUMERIC,
  (ARRAY['00:30','00:20','00:25','00:15','00:30','00:45','01:30','00:20','00:40','00:15'])[i]::TIME,
  'Demo catalogue service ' || i,
  i <> 10,
  TRUE
FROM generate_series(1, 10) AS g(i)
ON CONFLICT (treatment_service_code) DO NOTHING;

INSERT INTO branch_treatment (
  branch_id, treatment_service_code, is_available
)
SELECT
  pg_temp.seed_uuid('branch-' || i),
  pg_temp.seed_uuid('treatment-' || i),
  TRUE
FROM generate_series(1, 10) AS g(i)
ON CONFLICT DO NOTHING;

INSERT INTO medication (
  medication_id, generic_name, brand_name, strength, form,
  category, is_active, contraindications
)
SELECT
  pg_temp.seed_uuid('medication-' || i),
  (ARRAY['Paracetamol','Amoxicillin','Metformin','Atorvastatin','Amlodipine',
         'Omeprazole','Cetirizine','Salbutamol','Losartan','Azithromycin'])[i],
  (ARRAY['Panadol','Amoxil','Glucophage','Lipitor','Norvasc','Losec','Zyrtec','Ventolin','Cozaar','Zithromax'])[i],
  (ARRAY['500 mg','500 mg','500 mg','20 mg','5 mg','20 mg','10 mg','100 mcg','50 mg','500 mg'])[i],
  (ARRAY['Tablet','Capsule','Tablet','Tablet','Tablet','Capsule','Tablet','Inhaler','Tablet','Tablet'])[i],
  (ARRAY['Analgesic','Antibiotic','Antidiabetic','Lipid lowering','Antihypertensive',
         'Gastrointestinal','Antihistamine','Bronchodilator','Antihypertensive','Antibiotic'])[i],
  TRUE,
  (ARRAY['Severe liver impairment','Penicillin allergy','Severe renal impairment','Active liver disease','Severe hypotension',
         'Known hypersensitivity','Known hypersensitivity','Severe tachyarrhythmia','Pregnancy with specialist review','Macrolide allergy'])[i]
FROM generate_series(1, 10) AS g(i)
ON CONFLICT (medication_id) DO NOTHING;

/* One nonoverlapping session per doctor, with a future date that remains useful. */
INSERT INTO time_slot (
  time_slot_id, doctor_id, branch_id, available_date,
  start_time, end_time, max_tickets, current_serving_number
)
SELECT
  pg_temp.seed_uuid('time-slot-' || i),
  pg_temp.seed_uuid('doctor-user-' || i),
  pg_temp.seed_uuid('branch-' || i),
  CURRENT_DATE + (i + 7),
  TIME '09:00',
  TIME '12:00',
  12,
  0
FROM generate_series(1, 10) AS g(i)
ON CONFLICT DO NOTHING;

INSERT INTO appointment (
  appointment_id, time_slot_id, patient_id, queue_number, created_by,
  status, source, reason_for_visit, notes
)
SELECT
  pg_temp.seed_uuid('appointment-' || i),
  pg_temp.seed_uuid('time-slot-' || i),
  pg_temp.seed_uuid('patient-user-' || i),
  1,
  pg_temp.seed_uuid('frontdesk-user-' || i),
  'Scheduled'::appointment_status_enum,
  (ARRAY['Booked','Walkin','Booked','Emergency','Booked','Walkin','Booked','Booked','Emergency','Booked'])[i]::appointment_source_enum,
  (ARRAY['Routine health review','Persistent cough','Blood pressure review','Acute abdominal pain','Migraine follow up',
         'Skin rash','Ear discomfort','Sleep difficulty','Imaging review','General wellness visit'])[i],
  'Demo appointment number ' || i
FROM generate_series(1, 10) AS g(i)
ON CONFLICT (appointment_id) DO NOTHING;

/* Clinical children are inserted while appointments are editable. */
INSERT INTO consultation_record (
  consultation_rec_id, appointment_id, symptoms, diagnosis, notes,
  follow_up_required, follow_up_date
)
SELECT
  pg_temp.seed_uuid('consultation-' || i),
  pg_temp.seed_uuid('appointment-' || i),
  (ARRAY['Mild fatigue','Dry cough for five days','Occasional dizziness','Abdominal cramps','Recurring headache',
         'Itchy skin patches','Reduced hearing','Poor sleep','Intermittent discomfort','No acute symptoms'])[i],
  (ARRAY['General fatigue','Upper respiratory infection','Mild hypertension','Gastritis','Migraine',
         'Contact dermatitis','Cerumen impaction','Insomnia','Further imaging required','Healthy adult'])[i],
  'Demo consultation note ' || i,
  i % 2 = 0,
  CASE WHEN i % 2 = 0 THEN CURRENT_DATE + 30 + i ELSE NULL END
FROM generate_series(1, 10) AS g(i)
ON CONFLICT DO NOTHING;

INSERT INTO appointment_treatment (
  appointment_treatment_id, appointment_id, treatment_service_code,
  performed_by, quantity, unit_price, line_total, notes,
  status, ordered_at, performed_at
)
SELECT
  pg_temp.seed_uuid('appointment-treatment-' || i),
  pg_temp.seed_uuid('appointment-' || i),
  pg_temp.seed_uuid('treatment-' || i),
  NULL,
  1,
  (ARRAY[2500,1800,4500,1200,2200,3500,15000,2800,6500,1000])[i]::NUMERIC,
  (ARRAY[2500,1800,4500,1200,2200,3500,15000,2800,6500,1000])[i]::NUMERIC,
  'Ordered during demo consultation ' || i,
  'Ordered'::treatment_status_enum,
  NOW() - (i || ' hours')::INTERVAL,
  NULL
FROM generate_series(1, 10) AS g(i)
ON CONFLICT (appointment_treatment_id) DO NOTHING;

INSERT INTO prescription (
  prescription_id, appointment_id, medication_id, dosage,
  frequency, duration_days, notes, allergy_checked
)
SELECT
  pg_temp.seed_uuid('prescription-' || i),
  pg_temp.seed_uuid('appointment-' || i),
  pg_temp.seed_uuid('medication-' || i),
  (ARRAY['500 mg','500 mg','500 mg','20 mg','5 mg','20 mg','10 mg','2 puffs','50 mg','500 mg'])[i],
  (ARRAY['Every 8 hours','Every 8 hours','Twice daily','Once nightly','Once daily',
         'Once daily','Once daily','When required','Once daily','Once daily'])[i],
  (ARRAY[5,7,30,30,30,14,10,7,30,3])[i],
  'Demo prescription instructions ' || i,
  TRUE
FROM generate_series(1, 10) AS g(i)
ON CONFLICT (prescription_id) DO NOTHING;

INSERT INTO invoice (
  invoice_id, appointment_id, patient_id, invoice_date,
  gross_amount, discount_amount, tax_amount, net_amount,
  paid_amount, due_amount, insurance_covered_amount, status
)
SELECT
  pg_temp.seed_uuid('invoice-' || i),
  pg_temp.seed_uuid('appointment-' || i),
  pg_temp.seed_uuid('patient-user-' || i),
  NOW() - (i || ' days')::INTERVAL,
  4000.00 + i * 500,
  100.00,
  0.00,
  3900.00 + i * 500,
  1000.00,
  1900.00 + i * 250,
  1000.00 + i * 250,
  'PartiallyPaid'::invoice_status_enum
FROM generate_series(1, 10) AS g(i)
ON CONFLICT DO NOTHING;

INSERT INTO payment (
  payment_id, invoice_id, amount, payment_date,
  payment_method, received_by, reference_number
)
SELECT
  pg_temp.seed_uuid('payment-' || i),
  pg_temp.seed_uuid('invoice-' || i),
  1000.00,
  NOW() - (i || ' days')::INTERVAL,
  (ARRAY['Cash','Card','BankTransfer','OnlinePayment','Cash','Card','BankTransfer','Cash','OnlinePayment','Card'])[i]::payment_method_enum,
  pg_temp.seed_uuid('frontdesk-user-' || i),
  'PAY-DEMO-' || LPAD(i::TEXT, 6, '0')
FROM generate_series(1, 10) AS g(i)
ON CONFLICT (payment_id) DO NOTHING;

INSERT INTO insurance_claim (
  claim_id, invoice_id, insurance_id, claim_date,
  claimed_amount, approved_amount, status, settlement_date, remarks
)
SELECT
  pg_temp.seed_uuid('claim-' || i),
  pg_temp.seed_uuid('invoice-' || i),
  pg_temp.seed_uuid('insurance-' || i),
  NOW() - ((11 - i) || ' days')::INTERVAL,
  1000.00 + i * 250,
  CASE WHEN i <= 4 THEN 900.00 + i * 200 ELSE 0.00 END,
  (ARRAY['Submitted','UnderReview','Approved','PartiallyApproved','Rejected',
         'Submitted','UnderReview','Submitted','Approved','Submitted'])[i]::claim_status_enum,
  NULL,
  'Demo insurance claim ' || i
FROM generate_series(1, 10) AS g(i)
ON CONFLICT (claim_id) DO NOTHING;

INSERT INTO insurance_claim_item (
  claim_item_id, claim_id, appointment_treatment_id,
  claimed_amount, approved_amount
)
SELECT
  pg_temp.seed_uuid('claim-item-' || i),
  pg_temp.seed_uuid('claim-' || i),
  pg_temp.seed_uuid('appointment-treatment-' || i),
  LEAST((ARRAY[2500,1800,4500,1200,2200,3500,15000,2800,6500,1000])[i]::NUMERIC, 1000.00 + i * 250),
  CASE WHEN i <= 4 THEN 750.00 + i * 100 ELSE 0.00 END
FROM generate_series(1, 10) AS g(i)
ON CONFLICT (claim_item_id) DO NOTHING;

INSERT INTO branch_complaint (
  complaint_id, branch_id, patient_id, subject, message,
  priority, status, created_at, resolved_at
)
SELECT
  pg_temp.seed_uuid('complaint-' || i),
  pg_temp.seed_uuid('branch-' || i),
  pg_temp.seed_uuid('patient-user-' || i),
  (ARRAY['Waiting time','Parking access','Reception service','Pharmacy stock','Cleanliness',
         'Appointment reminder','Wheelchair access','Billing question','Queue display','Laboratory delay'])[i],
  'Demo complaint message number ' || i || ' for operational testing.',
  (ARRAY['Normal','Low','High','Urgent','Normal','Low','High','Normal','Urgent','High'])[i],
  (ARRAY['Pending','Reviewed','Resolved','Pending','Reviewed','Resolved','Pending','Reviewed','Resolved','Pending'])[i],
  NOW() - (i || ' days')::INTERVAL,
  CASE WHEN i IN (3,6,9) THEN NOW() - ((i - 1) || ' days')::INTERVAL ELSE NULL END
FROM generate_series(1, 10) AS g(i)
ON CONFLICT (complaint_id) DO NOTHING;

INSERT INTO notification (
  notification_id, user_id, title, message, type, is_read, created_at
)
SELECT
  pg_temp.seed_uuid('notification-' || i),
  pg_temp.seed_uuid('doctor-user-' || i),
  'Demo notification ' || LPAD(i::TEXT, 2, '0'),
  'A demo appointment or clinical update is ready for review.',
  (ARRAY['info','appointment','clinical','warning','info','appointment','clinical','info','warning','appointment'])[i],
  i % 3 = 0,
  NOW() - (i || ' hours')::INTERVAL
FROM generate_series(1, 10) AS g(i)
ON CONFLICT (notification_id) DO NOTHING;

INSERT INTO doctor_notification_read (doctor_id, notification_id, read_at)
SELECT
  pg_temp.seed_uuid('doctor-user-' || i),
  pg_temp.seed_uuid('notification-' || i)::TEXT,
  NOW() - (i || ' minutes')::INTERVAL
FROM generate_series(1, 10) AS g(i)
ON CONFLICT DO NOTHING;

INSERT INTO admin_patient_access_log (
  access_id, admin_id, patient_id, access_reason, accessed_at
)
SELECT
  pg_temp.seed_uuid('admin-access-' || i),
  pg_temp.seed_uuid('admin-user-' || i),
  pg_temp.seed_uuid('patient-user-' || i),
  (ARRAY['Operational oversight','Insurance review','Complaint investigation','Billing assistance','Record correction',
         'Branch support','Audit sampling','Identity verification','Care coordination','Management review'])[i],
  NOW() - (i || ' hours')::INTERVAL
FROM generate_series(1, 10) AS g(i)
ON CONFLICT (access_id) DO NOTHING;

COMMIT;

/* Verification result: every application table should report at least 10.
   A failure here raises an error after the committed seed, making the missing
   table obvious without rolling back valid seed data. */
DO $$
DECLARE
  table_name TEXT;
  row_count BIGINT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'address','contact','contact_number','app_user','branch','employee','doctor',
    'specialization','doctor_specialization','doctor_schedule','patient',
    'insurance_package','insurance','treatment_catalogue','branch_treatment',
    'medication','time_slot','appointment','consultation_record',
    'appointment_treatment','prescription','invoice','payment','insurance_claim',
    'insurance_claim_item','branch_complaint','notification',
    'doctor_notification_read','admin_patient_access_log'
  ]
  LOOP
    EXECUTE FORMAT('SELECT COUNT(*) FROM %I', table_name) INTO row_count;
    IF row_count < 10 THEN
      RAISE EXCEPTION 'Seed verification failed: table % has only % rows', table_name, row_count;
    END IF;
    RAISE NOTICE '%: % rows', table_name, row_count;
  END LOOP;
END;
$$;
