-- =============================================================================
-- MedSync Mock Data Seed
-- =============================================================================
-- Run against a database that already has ALL migrations (V1–V16) applied.
--
-- Contents:
--   3 Branches  ·  3 Front-desk staff  ·  10 Doctors (10 specializations)
--   40 Patients  ·  3 Insurance packages  ·  10 Policies
--   10 Treatment catalogue items  ·  12 Medications
--   18 Time slots  ·  30 Appointments (mixed statuses)
--   10 Consultation records  ·  15 Appointment treatments  ·  18 Prescriptions
--   10 Invoices  ·  10 Payments  ·  5 Insurance claims
--
-- Every user account password: password123
-- =============================================================================

DO $$
DECLARE
    -- Shared credential constants (password = 'password123')
    c_salt   CONSTANT VARCHAR := 'mx9OM4mf7LRDXiYwIJ4n';
    c_hash   CONSTANT VARCHAR := 'c20040d3b12cc17e020b8dcdac7b2834ff5b5dafa907a60878416a374498f35d73458c82f0f6e26c539197185f05c2c6ca4341e4aaa092812c98cd726df2f08b';

    -- Reusable temp vars
    t_addr UUID;  t_cont UUID;  t_user UUID;

    -- Branches
    br1 UUID;  br2 UUID;  br3 UUID;

    -- Front-desk employees
    fd1 UUID;  fd2 UUID;  fd3 UUID;

    -- Doctors (10)
    doc1  UUID;  doc2  UUID;  doc3  UUID;  doc4  UUID;  doc5  UUID;
    doc6  UUID;  doc7  UUID;  doc8  UUID;  doc9  UUID;  doc10 UUID;

    -- Specializations (10)
    sp_gen  UUID;  sp_card UUID;  sp_derm UUID;  sp_pedi UUID;  sp_orth UUID;
    sp_obgyn UUID; sp_neuro UUID; sp_ent  UUID;  sp_pulm UUID;  sp_ophth UUID;

    -- Active patients – referenced in appointments (20)
    p1  UUID;  p2  UUID;  p3  UUID;  p4  UUID;  p5  UUID;
    p6  UUID;  p7  UUID;  p8  UUID;  p9  UUID;  p10 UUID;
    p11 UUID;  p12 UUID;  p13 UUID;  p14 UUID;  p15 UUID;
    p16 UUID;  p17 UUID;  p18 UUID;  p19 UUID;  p20 UUID;

    -- Treatment catalogue
    tx_fbs  UUID;  tx_ecg  UUID;  tx_xray UUID;  tx_cbc  UUID;  tx_mri  UUID;
    tx_wound UUID; tx_physio UUID; tx_lipid UUID; tx_thyroid UUID; tx_urine UUID;

    -- Medications (12)
    med_para UUID;  med_amox UUID;  med_met  UUID;  med_ator UUID;
    med_omep UUID;  med_amlo UUID;  med_ceti UUID;  med_salb UUID;
    med_ibup UUID;  med_losa UUID;  med_metr UUID;  med_pred UUID;

    -- Insurance packages & policies
    ipkg1 UUID;  ipkg2 UUID;  ipkg3 UUID;
    ins1  UUID;  ins2  UUID;  ins3  UUID;  ins4  UUID;  ins5 UUID;
    ins6  UUID;  ins7  UUID;  ins8  UUID;  ins9  UUID;  ins10 UUID;

    -- Time slots (18)
    ts1  UUID;  ts2  UUID;  ts3  UUID;  ts4  UUID;  ts5  UUID;  ts6  UUID;
    ts7  UUID;  ts8  UUID;  ts9  UUID;  ts10 UUID;  ts11 UUID;  ts12 UUID;
    ts13 UUID;  ts14 UUID;  ts15 UUID;  ts16 UUID;  ts17 UUID;  ts18 UUID;

    -- Appointments (30)
    ap1  UUID;  ap2  UUID;  ap3  UUID;  ap4  UUID;  ap5  UUID;
    ap6  UUID;  ap7  UUID;  ap8  UUID;  ap9  UUID;  ap10 UUID;
    ap11 UUID;  ap12 UUID;  ap13 UUID;  ap14 UUID;  ap15 UUID;
    ap16 UUID;  ap17 UUID;  ap18 UUID;  ap19 UUID;  ap20 UUID;
    ap21 UUID;  ap22 UUID;  ap23 UUID;  ap24 UUID;  ap25 UUID;
    ap26 UUID;  ap27 UUID;  ap28 UUID;  ap29 UUID;  ap30 UUID;

    -- Appointment treatments
    at1 UUID;  at2 UUID;  at3 UUID;  at4 UUID;  at5 UUID;
    at6 UUID;  at7 UUID;  at8 UUID;  at9 UUID;  at10 UUID;
    at11 UUID; at12 UUID; at13 UUID; at14 UUID; at15 UUID;

    -- Invoices & claims
    inv1 UUID;  inv2 UUID;  inv3 UUID;  inv4 UUID;  inv5 UUID;
    inv6 UUID;  inv7 UUID;  inv8 UUID;  inv9 UUID;  inv10 UUID;
    cl1 UUID;  cl2 UUID;  cl3 UUID;  cl4 UUID;  cl5 UUID;

BEGIN

-- ============================================================================
--  1.  BRANCHES  (3)
-- ============================================================================

-- Branch 1 – Colombo
INSERT INTO address (address_line1, address_line2, city, province, postal_code) VALUES ('No. 124, Galle Road','Kollupitiya','Colombo','Western','00300') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id, number_type, number, is_primary) VALUES (t_cont,'Work','0112573400',TRUE);
INSERT INTO branch (branch_name, address_id, contact_id, opened_date) VALUES ('MedSync Central Colombo', t_addr, t_cont, '2023-01-15') RETURNING branch_id INTO br1;

-- Branch 2 – Kandy
INSERT INTO address (address_line1, address_line2, city, province, postal_code) VALUES ('No. 45, Peradeniya Road','','Kandy','Central','20000') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id, number_type, number, is_primary) VALUES (t_cont,'Work','0812234500',TRUE);
INSERT INTO branch (branch_name, address_id, contact_id, opened_date) VALUES ('MedSync Kandy Branch', t_addr, t_cont, '2023-06-01') RETURNING branch_id INTO br2;

-- Branch 3 – Galle
INSERT INTO address (address_line1, address_line2, city, province, postal_code) VALUES ('No. 78, Church Street','Galle Fort','Galle','Southern','80000') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id, number_type, number, is_primary) VALUES (t_cont,'Work','0912245600',TRUE);
INSERT INTO branch (branch_name, address_id, contact_id, opened_date) VALUES ('MedSync Southern Galle', t_addr, t_cont, '2024-02-10') RETURNING branch_id INTO br3;

-- ============================================================================
--  2.  FRONT-DESK EMPLOYEES  (3 – one per branch)
-- ============================================================================

-- FD 1 – Niluka Jayawardena (Colombo)
INSERT INTO address (address_line1, address_line2, city, province, postal_code) VALUES ('No. 33, High Level Road','Nugegoda','Colombo','Western','10250') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id, number_type, number, is_primary) VALUES (t_cont,'Mobile','0761234567',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Employee','Niluka Jayawardena','199351234567','niluka.fd@medsync.com','Female','1993-04-18',c_hash) RETURNING user_id INTO fd1;
INSERT INTO employee (employee_id,branch_id,role,salary,joined_date) VALUES (fd1,br1,'FrontDesk',75000.00,'2023-02-01');

-- FD 2 – Ruwan Abeysekara (Kandy)
INSERT INTO address (address_line1, address_line2, city, province, postal_code) VALUES ('No. 12, Trincomalee Street','','Kandy','Central','20000') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id, number_type, number, is_primary) VALUES (t_cont,'Mobile','0711234567',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Employee','Ruwan Abeysekara','199112345678','ruwan.fd@medsync.com','Male','1991-09-05',c_hash) RETURNING user_id INTO fd2;
INSERT INTO employee (employee_id,branch_id,role,salary,joined_date) VALUES (fd2,br2,'FrontDesk',72000.00,'2023-06-10');

-- FD 3 – Chamila Pathirage (Galle)
INSERT INTO address (address_line1, address_line2, city, province, postal_code) VALUES ('No. 55, Wakwella Road','','Galle','Southern','80000') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id, number_type, number, is_primary) VALUES (t_cont,'Mobile','0781234567',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Employee','Chamila Pathirage','199478901234','chamila.fd@medsync.com','Female','1994-12-30',c_hash) RETURNING user_id INTO fd3;
INSERT INTO employee (employee_id,branch_id,role,salary,joined_date) VALUES (fd3,br3,'FrontDesk',70000.00,'2024-03-01');

-- ============================================================================
--  3.  SPECIALIZATIONS  (10)
-- ============================================================================

INSERT INTO specialization (title, other_details) VALUES ('General Medicine','Primary care and internal medicine') RETURNING specialization_id INTO sp_gen;
INSERT INTO specialization (title, other_details) VALUES ('Cardiology','Heart and cardiovascular system') RETURNING specialization_id INTO sp_card;
INSERT INTO specialization (title, other_details) VALUES ('Dermatology','Skin, hair and nail disorders') RETURNING specialization_id INTO sp_derm;
INSERT INTO specialization (title, other_details) VALUES ('Pediatrics','Child and adolescent health') RETURNING specialization_id INTO sp_pedi;
INSERT INTO specialization (title, other_details) VALUES ('Orthopedics','Musculoskeletal system') RETURNING specialization_id INTO sp_orth;
INSERT INTO specialization (title, other_details) VALUES ('Obstetrics & Gynecology','Women''s reproductive health') RETURNING specialization_id INTO sp_obgyn;
INSERT INTO specialization (title, other_details) VALUES ('Neurology','Nervous system disorders') RETURNING specialization_id INTO sp_neuro;
INSERT INTO specialization (title, other_details) VALUES ('ENT (Otorhinolaryngology)','Ear, nose and throat') RETURNING specialization_id INTO sp_ent;
INSERT INTO specialization (title, other_details) VALUES ('Pulmonology','Respiratory system') RETURNING specialization_id INTO sp_pulm;
INSERT INTO specialization (title, other_details) VALUES ('Ophthalmology','Eye care and vision') RETURNING specialization_id INTO sp_ophth;

-- ============================================================================
--  4.  DOCTORS  (10)
-- ============================================================================

-- Doc 1 – Dr. Kasun Bandara  ·  Cardiology  ·  Colombo
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 18/2, Havelock Road','Colombo 05','Colombo','Western','00500') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0773456781',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Employee','Dr. Kasun Bandara','198212345678','kasun.bandara@medsync.com','Male','1982-08-14',c_hash) RETURNING user_id INTO doc1;
INSERT INTO employee (employee_id,branch_id,role,salary,joined_date) VALUES (doc1,br1,'Doctor',250000.00,'2023-01-20');
INSERT INTO doctor (doctor_id,room_no,medical_licence_no,consultation_fee,years_experience,qualification,is_available) VALUES (doc1,'R-101','SLMC-MD-34821',2500.00,14,'MBBS (Colombo), MD (Cardiology)',TRUE);
INSERT INTO doctor_specialization (doctor_id,specialization_id,certification_date) VALUES (doc1,sp_card,'2012-05-10');

-- Doc 2 – Dr. Chamari Wijesinghe  ·  Dermatology  ·  Kandy
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 72, Lady Gordon''s Drive','','Kandy','Central','20000') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0714567892',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Employee','Dr. Chamari Wijesinghe','198863456789','chamari.wijesinghe@medsync.com','Female','1988-11-22',c_hash) RETURNING user_id INTO doc2;
INSERT INTO employee (employee_id,branch_id,role,salary,joined_date) VALUES (doc2,br2,'Doctor',220000.00,'2023-06-05');
INSERT INTO doctor (doctor_id,room_no,medical_licence_no,consultation_fee,years_experience,qualification,is_available) VALUES (doc2,'R-204','SLMC-MD-41092',2000.00,9,'MBBS (Peradeniya), MD (Dermatology)',TRUE);
INSERT INTO doctor_specialization (doctor_id,specialization_id,certification_date) VALUES (doc2,sp_derm,'2016-09-18');

-- Doc 3 – Dr. Nuwan Perera  ·  General Medicine  ·  Colombo
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 5/1, Wijerama Mawatha','Colombo 07','Colombo','Western','00700') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0777654321',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Employee','Dr. Nuwan Perera','197812345678','nuwan.perera@medsync.com','Male','1978-03-27',c_hash) RETURNING user_id INTO doc3;
INSERT INTO employee (employee_id,branch_id,role,salary,joined_date) VALUES (doc3,br1,'Doctor',280000.00,'2023-01-20');
INSERT INTO doctor (doctor_id,room_no,medical_licence_no,consultation_fee,years_experience,qualification,is_available) VALUES (doc3,'R-102','SLMC-MD-28451',2000.00,18,'MBBS (Colombo), MD (Internal Medicine)',TRUE);
INSERT INTO doctor_specialization (doctor_id,specialization_id,certification_date) VALUES (doc3,sp_gen,'2008-03-15');

-- Doc 4 – Dr. Tharushi Fernando  ·  Pediatrics  ·  Galle
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 14, Matara Road','Unawatuna','Galle','Southern','80600') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0769871234',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Employee','Dr. Tharushi Fernando','199013345678','tharushi.fernando@medsync.com','Female','1990-06-15',c_hash) RETURNING user_id INTO doc4;
INSERT INTO employee (employee_id,branch_id,role,salary,joined_date) VALUES (doc4,br3,'Doctor',200000.00,'2024-03-01');
INSERT INTO doctor (doctor_id,room_no,medical_licence_no,consultation_fee,years_experience,qualification,is_available) VALUES (doc4,'R-301','SLMC-MD-45782',1800.00,7,'MBBS (Ruhuna), DCH (Colombo)',TRUE);
INSERT INTO doctor_specialization (doctor_id,specialization_id,certification_date) VALUES (doc4,sp_pedi,'2019-08-22');

-- Doc 5 – Dr. Asanka Rajapaksha  ·  Orthopedics  ·  Colombo
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 91, Bauddhaloka Mawatha','Colombo 04','Colombo','Western','00400') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0752345678',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Employee','Dr. Asanka Rajapaksha','198413345678','asanka.rajapaksha@medsync.com','Male','1984-01-09',c_hash) RETURNING user_id INTO doc5;
INSERT INTO employee (employee_id,branch_id,role,salary,joined_date) VALUES (doc5,br1,'Doctor',270000.00,'2023-03-15');
INSERT INTO doctor (doctor_id,room_no,medical_licence_no,consultation_fee,years_experience,qualification,is_available) VALUES (doc5,'R-103','SLMC-MS-39102',3000.00,12,'MBBS (Colombo), MS (Orthopedic Surgery)',TRUE);
INSERT INTO doctor_specialization (doctor_id,specialization_id,certification_date) VALUES (doc5,sp_orth,'2014-11-30');

-- Doc 6 – Dr. Dilini Senanayake  ·  Obstetrics & Gynecology  ·  Kandy
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 28, Rajapihilla Mawatha','','Kandy','Central','20000') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0712233445',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Employee','Dr. Dilini Senanayake','198613345678','dilini.senanayake@medsync.com','Female','1986-07-03',c_hash) RETURNING user_id INTO doc6;
INSERT INTO employee (employee_id,branch_id,role,salary,joined_date) VALUES (doc6,br2,'Doctor',240000.00,'2023-07-01');
INSERT INTO doctor (doctor_id,room_no,medical_licence_no,consultation_fee,years_experience,qualification,is_available) VALUES (doc6,'R-205','SLMC-MD-38756',2500.00,11,'MBBS (Peradeniya), MD (Obstetrics & Gynecology)',TRUE);
INSERT INTO doctor_specialization (doctor_id,specialization_id,certification_date) VALUES (doc6,sp_obgyn,'2015-04-20');

-- Doc 7 – Dr. Ruwantha Jayasuriya  ·  Neurology  ·  Colombo
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 40/A, Rosmead Place','Colombo 07','Colombo','Western','00700') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0778899001',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Employee','Dr. Ruwantha Jayasuriya','198013345678','ruwantha.jayasuriya@medsync.com','Male','1980-12-01',c_hash) RETURNING user_id INTO doc7;
INSERT INTO employee (employee_id,branch_id,role,salary,joined_date) VALUES (doc7,br1,'Doctor',300000.00,'2023-02-01');
INSERT INTO doctor (doctor_id,room_no,medical_licence_no,consultation_fee,years_experience,qualification,is_available) VALUES (doc7,'R-104','SLMC-MD-31290',3500.00,15,'MBBS (Sri Jayewardenepura), MD (Neurology)',TRUE);
INSERT INTO doctor_specialization (doctor_id,specialization_id,certification_date) VALUES (doc7,sp_neuro,'2011-06-25');

-- Doc 8 – Dr. Sachini Weerasinghe  ·  ENT  ·  Galle
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 6, Lighthouse Street','Galle Fort','Galle','Southern','80000') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0763344556',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Employee','Dr. Sachini Weerasinghe','199213345678','sachini.weerasinghe@medsync.com','Female','1992-04-11',c_hash) RETURNING user_id INTO doc8;
INSERT INTO employee (employee_id,branch_id,role,salary,joined_date) VALUES (doc8,br3,'Doctor',190000.00,'2024-03-01');
INSERT INTO doctor (doctor_id,room_no,medical_licence_no,consultation_fee,years_experience,qualification,is_available) VALUES (doc8,'R-302','SLMC-MS-47281',2000.00,6,'MBBS (Ruhuna), MS (ENT Surgery)',TRUE);
INSERT INTO doctor_specialization (doctor_id,specialization_id,certification_date) VALUES (doc8,sp_ent,'2020-02-14');

-- Doc 9 – Dr. Malik Gunaratne  ·  Pulmonology  ·  Colombo
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 15, Ward Place','Colombo 07','Colombo','Western','00700') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0724455667',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Employee','Dr. Malik Gunaratne','198313345678','malik.gunaratne@medsync.com','Male','1983-09-19',c_hash) RETURNING user_id INTO doc9;
INSERT INTO employee (employee_id,branch_id,role,salary,joined_date) VALUES (doc9,br1,'Doctor',260000.00,'2023-04-01');
INSERT INTO doctor (doctor_id,room_no,medical_licence_no,consultation_fee,years_experience,qualification,is_available) VALUES (doc9,'R-105','SLMC-MD-35678',2500.00,13,'MBBS (Kelaniya), MD (Pulmonology)',TRUE);
INSERT INTO doctor_specialization (doctor_id,specialization_id,certification_date) VALUES (doc9,sp_pulm,'2013-10-08');

-- Doc 10 – Dr. Hansika Rathnayake  ·  Ophthalmology  ·  Kandy
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 9, Sangaraja Mawatha','','Kandy','Central','20000') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0705566778',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Employee','Dr. Hansika Rathnayake','199013987654','hansika.rathnayake@medsync.com','Female','1990-02-28',c_hash) RETURNING user_id INTO doc10;
INSERT INTO employee (employee_id,branch_id,role,salary,joined_date) VALUES (doc10,br2,'Doctor',210000.00,'2023-08-01');
INSERT INTO doctor (doctor_id,room_no,medical_licence_no,consultation_fee,years_experience,qualification,is_available) VALUES (doc10,'R-206','SLMC-MS-42189',2200.00,8,'MBBS (Peradeniya), MS (Ophthalmology)',TRUE);
INSERT INTO doctor_specialization (doctor_id,specialization_id,certification_date) VALUES (doc10,sp_ophth,'2018-12-05');

-- ============================================================================
--  5.  DOCTOR SCHEDULES  (weekly recurring)
-- ============================================================================
-- day_of_week: 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat

INSERT INTO doctor_schedule (doctor_id,branch_id,day_of_week,start_time,end_time,slot_duration_minutes) VALUES (doc1,br1,1,'09:00','13:00',15);
INSERT INTO doctor_schedule (doctor_id,branch_id,day_of_week,start_time,end_time,slot_duration_minutes) VALUES (doc1,br1,4,'09:00','13:00',15);
INSERT INTO doctor_schedule (doctor_id,branch_id,day_of_week,start_time,end_time,slot_duration_minutes) VALUES (doc2,br2,2,'14:00','18:00',15);
INSERT INTO doctor_schedule (doctor_id,branch_id,day_of_week,start_time,end_time,slot_duration_minutes) VALUES (doc2,br2,5,'14:00','18:00',15);
INSERT INTO doctor_schedule (doctor_id,branch_id,day_of_week,start_time,end_time,slot_duration_minutes) VALUES (doc3,br1,1,'08:00','12:00',15);
INSERT INTO doctor_schedule (doctor_id,branch_id,day_of_week,start_time,end_time,slot_duration_minutes) VALUES (doc3,br1,3,'08:00','12:00',15);
INSERT INTO doctor_schedule (doctor_id,branch_id,day_of_week,start_time,end_time,slot_duration_minutes) VALUES (doc4,br3,2,'09:00','13:00',20);
INSERT INTO doctor_schedule (doctor_id,branch_id,day_of_week,start_time,end_time,slot_duration_minutes) VALUES (doc5,br1,3,'14:00','18:00',15);
INSERT INTO doctor_schedule (doctor_id,branch_id,day_of_week,start_time,end_time,slot_duration_minutes) VALUES (doc6,br2,1,'09:00','13:00',20);
INSERT INTO doctor_schedule (doctor_id,branch_id,day_of_week,start_time,end_time,slot_duration_minutes) VALUES (doc7,br1,2,'09:00','13:00',20);
INSERT INTO doctor_schedule (doctor_id,branch_id,day_of_week,start_time,end_time,slot_duration_minutes) VALUES (doc8,br3,4,'14:00','18:00',15);
INSERT INTO doctor_schedule (doctor_id,branch_id,day_of_week,start_time,end_time,slot_duration_minutes) VALUES (doc9,br1,5,'09:00','13:00',15);
INSERT INTO doctor_schedule (doctor_id,branch_id,day_of_week,start_time,end_time,slot_duration_minutes) VALUES (doc10,br2,3,'14:00','18:00',20);

-- ============================================================================
--  6.  PATIENTS  (40 total — 20 active, 20 background)
-- ============================================================================

-- ---- Active patients (referenced in appointments) ----

-- P1 – Kaveen De Silva
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 56/A, Station Road','Dehiwala','Colombo','Western','10350') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0778901234',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Kaveen De Silva','199518901234','kaveen.desilva@gmail.com','Male','1995-03-12',c_hash) RETURNING user_id INTO p1;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (p1,'B+',br1,'Anoma De Silva','0772233445','Mother');

-- P2 – Sanduni Gunawardena
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 12, Lake Round','','Kandy','Central','20000') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0723456789',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Sanduni Gunawardena','199874567890','sanduni.g@gmail.com','Female','1998-07-25',c_hash) RETURNING user_id INTO p2;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (p2,'O+',br2,'Sunil Gunawardena','0719988776','Father');

-- P3 – Dinesh Priyashantha
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 88, Kandy Road','Kadawatha','Gampaha','Western','11850') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0789012345',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Dinesh Priyashantha','198612987654','dinesh.priya@gmail.com','Male','1986-10-04',c_hash) RETURNING user_id INTO p3;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (p3,'A+',br1,'Manori Priyashantha','0783344556','Spouse');

-- P4 – Hasini Nanayakkara
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 21, Matara Road','','Galle','Southern','80000') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0756789012',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Hasini Nanayakkara','200034567890','hasini.n@gmail.com','Female','2000-01-18',c_hash) RETURNING user_id INTO p4;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (p4,'AB+',br3,'Kumari Nanayakkara','0714455667','Mother');

-- P5 – Tharanga Dissanayake
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 102, Baseline Road','Colombo 09','Colombo','Western','00900') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0771122334',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Tharanga Dissanayake','199214345678','tharanga.d@gmail.com','Male','1992-05-30',c_hash) RETURNING user_id INTO p5;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (p5,'O-',br1,'Nimal Dissanayake','0772233441','Father');

-- P6 – Pawani Samarasekara
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 7/3, Ampitiya Road','','Kandy','Central','20000') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0713344556',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Pawani Samarasekara','199656789012','pawani.s@gmail.com','Female','1996-11-08',c_hash) RETURNING user_id INTO p6;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (p6,'A-',br2,'Kamal Samarasekara','0725566778','Husband');

-- P7 – Amila Weerakoon
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 44, Dutugemunu Street','Kohuwala','Colombo','Western','10350') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0765544332',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Amila Weerakoon','198914345678','amila.w@gmail.com','Male','1989-04-22',c_hash) RETURNING user_id INTO p7;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (p7,'B+',br1,'Sriyani Weerakoon','0779988776','Mother');

-- P8 – Dinesha Perera
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 19, Hikkaduwa Road','','Galle','Southern','80240') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0781122334',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Dinesha Perera','200114345678','dinesha.p@gmail.com','Female','2001-09-17',c_hash) RETURNING user_id INTO p8;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (p8,'O+',br3,'Chaminda Perera','0763344558','Father');

-- P9 – Lahiru Samarawickrama
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 67, Negombo Road','Wattala','Gampaha','Western','11300') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0724433221',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Lahiru Samarawickrama','199314345678','lahiru.s@gmail.com','Male','1993-02-14',c_hash) RETURNING user_id INTO p9;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (p9,'A+',br1,'Priyantha Samarawickrama','0776655443','Father');

-- P10 – Vishmi Jayawardena
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 30, William Gopallawa Mawatha','','Kandy','Central','20000') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0701122334',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Vishmi Jayawardena','199914345678','vishmi.j@gmail.com','Female','1999-06-03',c_hash) RETURNING user_id INTO p10;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (p10,'B-',br2,'Indika Jayawardena','0718877665','Brother');

-- P11 – Roshan Wickremasinghe
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 75, Thimbirigasyaya Road','Colombo 05','Colombo','Western','00500') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0773322114',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Roshan Wickremasinghe','198714345678','roshan.w@gmail.com','Male','1987-12-21',c_hash) RETURNING user_id INTO p11;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (p11,'AB+',br1,'Deepani Wickremasinghe','0714433225','Spouse');

-- P12 – Achini Kulatunga
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 8, Closenberg Road','','Galle','Southern','80000') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0769988776',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Achini Kulatunga','200214345678','achini.k@gmail.com','Female','2002-03-08',c_hash) RETURNING user_id INTO p12;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (p12,'O+',br3,'Lalitha Kulatunga','0787766554','Mother');

-- P13 – Buddhika Karunarathne
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 52, Katugastota Road','','Kandy','Central','20800') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0714433226',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Buddhika Karunarathne','199414345678','buddhika.k@gmail.com','Male','1994-08-16',c_hash) RETURNING user_id INTO p13;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (p13,'A+',br2,'Ranjani Karunarathne','0723344556','Mother');

-- P14 – Nilmini Seneviratne
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 118, Pannipitiya Road','Battaramulla','Colombo','Western','10120') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0758877665',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Nilmini Seneviratne','199114987654','nilmini.s@gmail.com','Female','1991-11-02',c_hash) RETURNING user_id INTO p14;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (p14,'B+',br1,'Saman Seneviratne','0775544332','Husband');

-- P15 – Supun Madushanka
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 36, Baddegama Road','','Galle','Southern','80000') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0783322114',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Supun Madushanka','199714345678','supun.m@gmail.com','Male','1997-01-26',c_hash) RETURNING user_id INTO p15;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (p15,'O+',br3,'Malani Madushanka','0768877665','Mother');

-- P16 – Chathurika Alwis
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 60, Asgiriya Road','','Kandy','Central','20000') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0724455668',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Chathurika Alwis','200014345678','chathurika.a@gmail.com','Female','2000-04-14',c_hash) RETURNING user_id INTO p16;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (p16,'A+',br2,'Tilak Alwis','0712233441','Father');

-- P17 – Sampath Herath
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 23, Kotte Road','Rajagiriya','Colombo','Western','10100') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0766655443',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Sampath Herath','198814345678','sampath.h@gmail.com','Male','1988-07-09',c_hash) RETURNING user_id INTO p17;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (p17,'B-',br1,'Kumudini Herath','0778899002','Spouse');

-- P18 – Thilini Rajapaksha
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 90, Nawala Road','Nugegoda','Colombo','Western','10250') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0751122334',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Thilini Rajapaksha','199614345678','thilini.r@gmail.com','Female','1996-12-20',c_hash) RETURNING user_id INTO p18;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (p18,'O+',br1,'Janaka Rajapaksha','0773344552','Father');

-- P19 – Charith Munasinghe
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 15, Rumassala Road','','Galle','Southern','80600') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0789988776',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Charith Munasinghe','199114345679','charith.m@gmail.com','Male','1991-05-13',c_hash) RETURNING user_id INTO p19;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (p19,'AB-',br3,'Lasantha Munasinghe','0762233445','Brother');

-- P20 – Hiruni Mendis
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 41, Dalada Veediya','','Kandy','Central','20000') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0707788990',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Hiruni Mendis','200114987654','hiruni.m@gmail.com','Female','2001-08-07',c_hash) RETURNING user_id INTO p20;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (p20,'A+',br2,'Priyanthi Mendis','0718899001','Mother');

-- ---- Background patients (21–40) – not referenced in appointments ----

-- P21 – Nishan Rathnayake
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 34, Gampola Road','','Kandy','Central','20500') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0771234001',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Nishan Rathnayake','199314987654','nishan.r@gmail.com','Male','1993-10-10',c_hash) RETURNING user_id INTO t_user;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (t_user,'O+',br2,'Ranjith Rathnayake','0712345001','Father');

-- P22 – Asitha Gamage
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 99, Templers Road','Mt. Lavinia','Colombo','Western','10370') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0771234002',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Asitha Gamage','199114345680','asitha.g@gmail.com','Male','1991-03-15',c_hash) RETURNING user_id INTO t_user;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (t_user,'A+',br1,'Wasantha Gamage','0712345002','Father');

-- P23 – Chaminda Pathirana
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 17, Aluthgama Road','','Matara','Southern','81000') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0771234003',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Chaminda Pathirana','198714987654','chaminda.p@gmail.com','Male','1987-06-20',c_hash) RETURNING user_id INTO t_user;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (t_user,'B+',br3,'Ruwani Pathirana','0712345003','Spouse');

-- P24 – Isuru Kumara
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 63, Kurunegala Road','','Kurunegala','North Western','60000') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0771234004',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Isuru Kumara','199514345679','isuru.k@gmail.com','Male','1995-09-05',c_hash) RETURNING user_id INTO t_user;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (t_user,'O-',br1,'Nimali Kumara','0712345004','Spouse');

-- P25 – Thilina Weerasooriya
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 11, Negombo Road','','Negombo','Western','11500') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0771234005',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Thilina Weerasooriya','199814345679','thilina.w@gmail.com','Male','1998-02-28',c_hash) RETURNING user_id INTO t_user;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (t_user,'AB+',br1,'Sarath Weerasooriya','0712345005','Father');

-- P26 – Nuwan Abeynayake
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 82, Maharagama Road','','Maharagama','Western','10280') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0771234006',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Nuwan Abeynayake','199014345679','nuwan.a@gmail.com','Male','1990-07-16',c_hash) RETURNING user_id INTO t_user;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (t_user,'A-',br1,'Chandrika Abeynayake','0712345006','Mother');

-- P27 – Kalana Jayakody
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 27, Kottawa Road','Piliyandala','Colombo','Western','10300') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0771234007',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Kalana Jayakody','200214987654','kalana.j@gmail.com','Male','2002-11-19',c_hash) RETURNING user_id INTO t_user;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (t_user,'B-',br1,'Sandya Jayakody','0712345007','Mother');

-- P28 – Sanjaya Liyanage
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 50, Hospital Road','','Jaffna','Northern','40000') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0771234008',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Sanjaya Liyanage','198914987654','sanjaya.l@gmail.com','Male','1989-01-22',c_hash) RETURNING user_id INTO t_user;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (t_user,'O+',br1,'Rasika Liyanage','0712345008','Brother');

-- P29 – Kavisha Abeysinghe
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 38, Digana Road','','Kandy','Central','20180') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0771234009',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Kavisha Abeysinghe','200314345678','kavisha.a@gmail.com','Female','2003-05-05',c_hash) RETURNING user_id INTO t_user;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (t_user,'A+',br2,'Palitha Abeysinghe','0712345009','Father');

-- P30 – Gayani Fonseka
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 16, Marine Drive','','Colombo','Western','00300') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0771234010',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Gayani Fonseka','199414987654','gayani.f@gmail.com','Female','1994-02-14',c_hash) RETURNING user_id INTO t_user;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (t_user,'B+',br1,'Ajith Fonseka','0712345010','Husband');

-- P31 – Nimali Tennakoon
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 73, Dambulla Road','','Matale','Central','21000') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0771234011',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Nimali Tennakoon','199714987654','nimali.t@gmail.com','Female','1997-08-30',c_hash) RETURNING user_id INTO t_user;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (t_user,'O+',br2,'Gamini Tennakoon','0712345011','Father');

-- P32 – Priya Sivanathan
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 22, KKS Road','','Jaffna','Northern','40000') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0771234012',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Priya Sivanathan','199614987654','priya.s@gmail.com','Female','1996-04-12',c_hash) RETURNING user_id INTO t_user;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (t_user,'AB-',br1,'Kumaran Sivanathan','0712345012','Father');

-- P33 – Kumaran Balakrishnan
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 5, Trincomalee Road','','Batticaloa','Eastern','30000') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0771234013',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Kumaran Balakrishnan','198514345678','kumaran.b@gmail.com','Male','1985-12-25',c_hash) RETURNING user_id INTO t_user;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (t_user,'B+',br1,'Selvi Balakrishnan','0712345013','Spouse');

-- P34 – Deepika Amarasinghe
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 45, Anuradhapura Road','','Anuradhapura','North Central','50000') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0771234014',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Deepika Amarasinghe','199214987654','deepika.a@gmail.com','Female','1992-09-18',c_hash) RETURNING user_id INTO t_user;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (t_user,'O+',br1,'Bandula Amarasinghe','0712345014','Husband');

-- P35 – Sewwandi Bandara
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 29, Nuwara Eliya Road','','Nuwara Eliya','Central','22200') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0771234015',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Sewwandi Bandara','200114345679','sewwandi.b@gmail.com','Female','2001-01-01',c_hash) RETURNING user_id INTO t_user;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (t_user,'A-',br2,'Udaya Bandara','0712345015','Father');

-- P36 – Tharindu Ranasinghe
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 71, Avissawella Road','Kaduwela','Colombo','Western','10640') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0771234016',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Tharindu Ranasinghe','199814987654','tharindu.r@gmail.com','Male','1998-10-22',c_hash) RETURNING user_id INTO t_user;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (t_user,'B+',br1,'Wasantha Ranasinghe','0712345016','Father');

-- P37 – Udari Gunasekara
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 3, Ratnapura Road','','Ratnapura','Sabaragamuwa','70000') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0771234017',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Udari Gunasekara','200014987654','udari.g@gmail.com','Female','2000-06-14',c_hash) RETURNING user_id INTO t_user;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (t_user,'O-',br3,'Sumedha Gunasekara','0712345017','Father');

-- P38 – Nishadi Jayathilaka
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 58, Badulla Road','','Badulla','Uva','90000') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0771234018',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Nishadi Jayathilaka','199914987654','nishadi.j@gmail.com','Female','1999-03-28',c_hash) RETURNING user_id INTO t_user;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (t_user,'AB+',br2,'Siripala Jayathilaka','0712345018','Father');

-- P39 – Vijay Ramanathan
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 14, Kandy Road','','Trincomalee','Eastern','31000') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0771234019',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Vijay Ramanathan','198614345679','vijay.r@gmail.com','Male','1986-11-30',c_hash) RETURNING user_id INTO t_user;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (t_user,'A+',br1,'Lakshmi Ramanathan','0712345019','Spouse');

-- P40 – Dulanjaya Ekanayake
INSERT INTO address (address_line1,address_line2,city,province,postal_code) VALUES ('No. 85, Horana Road','Piliyandala','Colombo','Western','10300') RETURNING address_id INTO t_addr;
INSERT INTO contact DEFAULT VALUES RETURNING contact_id INTO t_cont;
INSERT INTO contact_number (contact_id,number_type,number,is_primary) VALUES (t_cont,'Mobile','0771234020',TRUE);
INSERT INTO app_user (salt,address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash) VALUES (c_salt,t_addr,t_cont,'Patient','Dulanjaya Ekanayake','200314987654','dulanjaya.e@gmail.com','Male','2003-08-12',c_hash) RETURNING user_id INTO t_user;
INSERT INTO patient (patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship) VALUES (t_user,'B-',br1,'Kumara Ekanayake','0712345020','Father');

-- ============================================================================
--  7.  INSURANCE PACKAGES  (3) & PATIENT POLICIES  (10)
-- ============================================================================

INSERT INTO insurance_package (provider_name,package_name,annual_limit,copayment_percentage,description,is_active) VALUES ('Sri Lanka Insurance','Comprehensive Health Guard',500000.00,10.00,'Full inpatient and outpatient coverage',TRUE) RETURNING insurance_package_id INTO ipkg1;
INSERT INTO insurance_package (provider_name,package_name,annual_limit,copayment_percentage,description,is_active) VALUES ('Ceylinco Life','Suwa Sampatha Premium',350000.00,15.00,'Specialist consultations and diagnostic tests',TRUE) RETURNING insurance_package_id INTO ipkg2;
INSERT INTO insurance_package (provider_name,package_name,annual_limit,copayment_percentage,description,is_active) VALUES ('Softlogic Life','Care Plus Gold',450000.00,12.00,'Advanced diagnostics, surgeries and specialist referrals',TRUE) RETURNING insurance_package_id INTO ipkg3;

INSERT INTO insurance (patient_id,insurance_package_id,policy_number,used_coverage_amount,status,start_date,end_date) VALUES (p1, ipkg1,'SLIC-2024-8831',12500.00,'Active','2024-01-01','2026-12-31') RETURNING insurance_id INTO ins1;
INSERT INTO insurance (patient_id,insurance_package_id,policy_number,used_coverage_amount,status,start_date,end_date) VALUES (p3, ipkg2,'CEYL-2024-4521',5000.00,'Active','2024-03-01','2026-02-28') RETURNING insurance_id INTO ins2;
INSERT INTO insurance (patient_id,insurance_package_id,policy_number,used_coverage_amount,status,start_date,end_date) VALUES (p5, ipkg1,'SLIC-2024-9102',0.00,'Active','2024-06-01','2026-05-31') RETURNING insurance_id INTO ins3;
INSERT INTO insurance (patient_id,insurance_package_id,policy_number,used_coverage_amount,status,start_date,end_date) VALUES (p7, ipkg3,'SOFT-2024-3378',8200.00,'Active','2024-01-15','2026-01-14') RETURNING insurance_id INTO ins4;
INSERT INTO insurance (patient_id,insurance_package_id,policy_number,used_coverage_amount,status,start_date,end_date) VALUES (p9, ipkg2,'CEYL-2024-5590',2000.00,'Active','2024-04-01','2026-03-31') RETURNING insurance_id INTO ins5;
INSERT INTO insurance (patient_id,insurance_package_id,policy_number,used_coverage_amount,status,start_date,end_date) VALUES (p11,ipkg1,'SLIC-2025-1001',0.00,'Active','2025-01-01','2026-12-31') RETURNING insurance_id INTO ins6;
INSERT INTO insurance (patient_id,insurance_package_id,policy_number,used_coverage_amount,status,start_date,end_date) VALUES (p13,ipkg3,'SOFT-2024-7712',15000.00,'Active','2024-08-01','2026-07-31') RETURNING insurance_id INTO ins7;
INSERT INTO insurance (patient_id,insurance_package_id,policy_number,used_coverage_amount,status,start_date,end_date) VALUES (p14,ipkg2,'CEYL-2025-2201',0.00,'Active','2025-02-01','2027-01-31') RETURNING insurance_id INTO ins8;
INSERT INTO insurance (patient_id,insurance_package_id,policy_number,used_coverage_amount,status,start_date,end_date) VALUES (p17,ipkg1,'SLIC-2025-3301',4000.00,'Active','2025-03-01','2027-02-28') RETURNING insurance_id INTO ins9;
INSERT INTO insurance (patient_id,insurance_package_id,policy_number,used_coverage_amount,status,start_date,end_date) VALUES (p20,ipkg3,'SOFT-2025-4401',0.00,'Active','2025-05-01','2027-04-30') RETURNING insurance_id INTO ins10;

-- ============================================================================
--  8.  TREATMENT CATALOGUE  (10)
-- ============================================================================

INSERT INTO treatment_catalogue (category,treatment_name,base_price,duration,description,is_insurable,is_active) VALUES ('Laboratory','Fasting Blood Sugar (FBS)',600.00,'00:10:00','Automated glucose oxidase method',TRUE,TRUE) RETURNING treatment_service_code INTO tx_fbs;
INSERT INTO treatment_catalogue (category,treatment_name,base_price,duration,description,is_insurable,is_active) VALUES ('Radiology','12-Lead ECG',1500.00,'00:15:00','Standard resting 12-lead ECG recording',TRUE,TRUE) RETURNING treatment_service_code INTO tx_ecg;
INSERT INTO treatment_catalogue (category,treatment_name,base_price,duration,description,is_insurable,is_active) VALUES ('Radiology','Chest X-Ray PA View',2200.00,'00:15:00','Digital chest radiography standard view',TRUE,TRUE) RETURNING treatment_service_code INTO tx_xray;
INSERT INTO treatment_catalogue (category,treatment_name,base_price,duration,description,is_insurable,is_active) VALUES ('Laboratory','Complete Blood Count (CBC)',800.00,'00:10:00','Automated hematology analyzer',TRUE,TRUE) RETURNING treatment_service_code INTO tx_cbc;
INSERT INTO treatment_catalogue (category,treatment_name,base_price,duration,description,is_insurable,is_active) VALUES ('Radiology','MRI Brain Scan',15000.00,'00:45:00','1.5T MRI with contrast as needed',TRUE,TRUE) RETURNING treatment_service_code INTO tx_mri;
INSERT INTO treatment_catalogue (category,treatment_name,base_price,duration,description,is_insurable,is_active) VALUES ('Procedure','Wound Debridement & Dressing',1800.00,'00:20:00','Minor sterile cleansing and antiseptic dressing',TRUE,TRUE) RETURNING treatment_service_code INTO tx_wound;
INSERT INTO treatment_catalogue (category,treatment_name,base_price,duration,description,is_insurable,is_active) VALUES ('Therapy','Physiotherapy Session',2500.00,'00:30:00','Therapeutic exercise and manual therapy',TRUE,TRUE) RETURNING treatment_service_code INTO tx_physio;
INSERT INTO treatment_catalogue (category,treatment_name,base_price,duration,description,is_insurable,is_active) VALUES ('Laboratory','Lipid Profile',1200.00,'00:10:00','Total cholesterol, LDL, HDL, triglycerides',TRUE,TRUE) RETURNING treatment_service_code INTO tx_lipid;
INSERT INTO treatment_catalogue (category,treatment_name,base_price,duration,description,is_insurable,is_active) VALUES ('Laboratory','Thyroid Function Test (TFT)',1500.00,'00:10:00','TSH, Free T3, Free T4',TRUE,TRUE) RETURNING treatment_service_code INTO tx_thyroid;
INSERT INTO treatment_catalogue (category,treatment_name,base_price,duration,description,is_insurable,is_active) VALUES ('Laboratory','Urinalysis',400.00,'00:10:00','Dipstick and microscopy',TRUE,TRUE) RETURNING treatment_service_code INTO tx_urine;

-- ============================================================================
--  9.  MEDICATIONS  (12)
-- ============================================================================

INSERT INTO medication (generic_name,brand_name,contraindications,strength,form,category,is_active) VALUES ('Paracetamol','Panadol','Severe hepatic impairment','500mg','Tablet','Analgesic',TRUE) RETURNING medication_id INTO med_para;
INSERT INTO medication (generic_name,brand_name,contraindications,strength,form,category,is_active) VALUES ('Amoxicillin','Amoxil','Penicillin hypersensitivity','500mg','Capsule','Antibiotic',TRUE) RETURNING medication_id INTO med_amox;
INSERT INTO medication (generic_name,brand_name,contraindications,strength,form,category,is_active) VALUES ('Metformin Hydrochloride','Glucophage','Renal dysfunction, metabolic acidosis','500mg','Tablet','Antidiabetic',TRUE) RETURNING medication_id INTO med_met;
INSERT INTO medication (generic_name,brand_name,contraindications,strength,form,category,is_active) VALUES ('Atorvastatin','Lipitor','Active liver disease, pregnancy','20mg','Tablet','Statin',TRUE) RETURNING medication_id INTO med_ator;
INSERT INTO medication (generic_name,brand_name,contraindications,strength,form,category,is_active) VALUES ('Omeprazole','Losec','Hypersensitivity to PPIs','20mg','Capsule','PPI',TRUE) RETURNING medication_id INTO med_omep;
INSERT INTO medication (generic_name,brand_name,contraindications,strength,form,category,is_active) VALUES ('Amlodipine','Norvasc','Severe aortic stenosis','5mg','Tablet','Antihypertensive',TRUE) RETURNING medication_id INTO med_amlo;
INSERT INTO medication (generic_name,brand_name,contraindications,strength,form,category,is_active) VALUES ('Cetirizine','Zyrtec','Severe renal impairment','10mg','Tablet','Antihistamine',TRUE) RETURNING medication_id INTO med_ceti;
INSERT INTO medication (generic_name,brand_name,contraindications,strength,form,category,is_active) VALUES ('Salbutamol','Ventolin','Hypersensitivity to salbutamol','100mcg','Inhaler','Bronchodilator',TRUE) RETURNING medication_id INTO med_salb;
INSERT INTO medication (generic_name,brand_name,contraindications,strength,form,category,is_active) VALUES ('Ibuprofen','Brufen','Active GI bleeding, renal failure','400mg','Tablet','NSAID',TRUE) RETURNING medication_id INTO med_ibup;
INSERT INTO medication (generic_name,brand_name,contraindications,strength,form,category,is_active) VALUES ('Losartan','Cozaar','Pregnancy, bilateral renal artery stenosis','50mg','Tablet','ARB',TRUE) RETURNING medication_id INTO med_losa;
INSERT INTO medication (generic_name,brand_name,contraindications,strength,form,category,is_active) VALUES ('Metronidazole','Flagyl','First trimester of pregnancy','400mg','Tablet','Antibiotic',TRUE) RETURNING medication_id INTO med_metr;
INSERT INTO medication (generic_name,brand_name,contraindications,strength,form,category,is_active) VALUES ('Prednisolone','Predsol','Systemic fungal infection','5mg','Tablet','Corticosteroid',TRUE) RETURNING medication_id INTO med_pred;

-- ============================================================================
-- 10.  TIME SLOTS  (18)
-- ============================================================================

-- Past slots (for Completed appointments)
INSERT INTO time_slot (doctor_id,branch_id,available_date,start_time,end_time,max_tickets,current_serving_number) VALUES (doc1,br1,CURRENT_DATE - 5,'09:00','13:00',20,3) RETURNING time_slot_id INTO ts1;
INSERT INTO time_slot (doctor_id,branch_id,available_date,start_time,end_time,max_tickets,current_serving_number) VALUES (doc3,br1,CURRENT_DATE - 4,'08:00','12:00',20,3) RETURNING time_slot_id INTO ts2;
INSERT INTO time_slot (doctor_id,branch_id,available_date,start_time,end_time,max_tickets,current_serving_number) VALUES (doc2,br2,CURRENT_DATE - 3,'14:00','18:00',15,3) RETURNING time_slot_id INTO ts3;
INSERT INTO time_slot (doctor_id,branch_id,available_date,start_time,end_time,max_tickets,current_serving_number) VALUES (doc4,br3,CURRENT_DATE - 3,'09:00','13:00',12,2) RETURNING time_slot_id INTO ts4;
INSERT INTO time_slot (doctor_id,branch_id,available_date,start_time,end_time,max_tickets,current_serving_number) VALUES (doc5,br1,CURRENT_DATE - 2,'14:00','18:00',15,2) RETURNING time_slot_id INTO ts5;
INSERT INTO time_slot (doctor_id,branch_id,available_date,start_time,end_time,max_tickets,current_serving_number) VALUES (doc6,br2,CURRENT_DATE - 2,'09:00','13:00',12,2) RETURNING time_slot_id INTO ts6;
INSERT INTO time_slot (doctor_id,branch_id,available_date,start_time,end_time,max_tickets,current_serving_number) VALUES (doc9,br1,CURRENT_DATE - 1,'09:00','13:00',20,2) RETURNING time_slot_id INTO ts7;

-- Today's slots (for InProgress, CheckedIn)
INSERT INTO time_slot (doctor_id,branch_id,available_date,start_time,end_time,max_tickets,current_serving_number) VALUES (doc1,br1,CURRENT_DATE,'09:00','13:00',20,3) RETURNING time_slot_id INTO ts8;
INSERT INTO time_slot (doctor_id,branch_id,available_date,start_time,end_time,max_tickets,current_serving_number) VALUES (doc3,br1,CURRENT_DATE,'08:00','12:00',20,2) RETURNING time_slot_id INTO ts9;
INSERT INTO time_slot (doctor_id,branch_id,available_date,start_time,end_time,max_tickets,current_serving_number) VALUES (doc7,br1,CURRENT_DATE,'09:00','13:00',15,3) RETURNING time_slot_id INTO ts10;
INSERT INTO time_slot (doctor_id,branch_id,available_date,start_time,end_time,max_tickets,current_serving_number) VALUES (doc2,br2,CURRENT_DATE,'14:00','18:00',15,2) RETURNING time_slot_id INTO ts11;

-- Future slots (for Scheduled)
INSERT INTO time_slot (doctor_id,branch_id,available_date,start_time,end_time,max_tickets,current_serving_number) VALUES (doc1,br1,CURRENT_DATE + 1,'09:00','13:00',20,0) RETURNING time_slot_id INTO ts12;
INSERT INTO time_slot (doctor_id,branch_id,available_date,start_time,end_time,max_tickets,current_serving_number) VALUES (doc4,br3,CURRENT_DATE + 1,'09:00','13:00',12,0) RETURNING time_slot_id INTO ts13;
INSERT INTO time_slot (doctor_id,branch_id,available_date,start_time,end_time,max_tickets,current_serving_number) VALUES (doc8,br3,CURRENT_DATE + 2,'14:00','18:00',15,0) RETURNING time_slot_id INTO ts14;
INSERT INTO time_slot (doctor_id,branch_id,available_date,start_time,end_time,max_tickets,current_serving_number) VALUES (doc10,br2,CURRENT_DATE + 2,'14:00','18:00',12,0) RETURNING time_slot_id INTO ts15;
INSERT INTO time_slot (doctor_id,branch_id,available_date,start_time,end_time,max_tickets,current_serving_number) VALUES (doc5,br1,CURRENT_DATE + 3,'14:00','18:00',15,0) RETURNING time_slot_id INTO ts16;
INSERT INTO time_slot (doctor_id,branch_id,available_date,start_time,end_time,max_tickets,current_serving_number) VALUES (doc6,br2,CURRENT_DATE + 3,'09:00','13:00',12,0) RETURNING time_slot_id INTO ts17;
INSERT INTO time_slot (doctor_id,branch_id,available_date,start_time,end_time,max_tickets,current_serving_number) VALUES (doc9,br1,CURRENT_DATE + 4,'09:00','13:00',20,0) RETURNING time_slot_id INTO ts18;

-- ============================================================================
-- 11.  APPOINTMENTS  (30)
-- ============================================================================

-- ======= COMPLETED (1-10) – past dates =======

-- AP1: Kaveen -> Dr. Kasun (Cardio, Colombo) – chest tightness
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit,notes,checked_in_at,consultation_started_at)
VALUES (ts1,p1,1,fd1,'Completed','Booked','Intermittent chest tightness and fatigue','Referred from Colombo South clinic',CURRENT_DATE - 5 + TIME '08:45',CURRENT_DATE - 5 + TIME '09:10')
RETURNING appointment_id INTO ap1;

-- AP2: Dinesh -> Dr. Nuwan (GenMed, Colombo) – routine checkup
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit,notes,checked_in_at,consultation_started_at)
VALUES (ts2,p3,1,fd1,'Completed','Booked','Annual health screening and blood work','Employer-mandated medical',CURRENT_DATE - 4 + TIME '07:50',CURRENT_DATE - 4 + TIME '08:15')
RETURNING appointment_id INTO ap2;

-- AP3: Tharanga -> Dr. Nuwan (GenMed, Colombo) – fever
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit,notes,checked_in_at,consultation_started_at)
VALUES (ts2,p5,2,fd1,'Completed','Walkin','High fever and persistent cough for 3 days','Walk-in, no prior appointment',CURRENT_DATE - 4 + TIME '08:30',CURRENT_DATE - 4 + TIME '08:50')
RETURNING appointment_id INTO ap3;

-- AP4: Sanduni -> Dr. Chamari (Derm, Kandy) – skin rash
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit,notes,checked_in_at,consultation_started_at)
VALUES (ts3,p2,1,fd2,'Completed','Booked','Recurrent itchy rash on forearms and neck','Suspected contact dermatitis',CURRENT_DATE - 3 + TIME '13:50',CURRENT_DATE - 3 + TIME '14:10')
RETURNING appointment_id INTO ap4;

-- AP5: Hasini -> Dr. Tharushi (Pedi, Galle) – child vaccination
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit,notes,checked_in_at,consultation_started_at)
VALUES (ts4,p4,1,fd3,'Completed','Booked','18-month routine vaccination and growth assessment','Child accompanied by mother',CURRENT_DATE - 3 + TIME '08:55',CURRENT_DATE - 3 + TIME '09:15')
RETURNING appointment_id INTO ap5;

-- AP6: Pawani -> Dr. Dilini (OBGYN, Kandy) – prenatal checkup
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit,notes,checked_in_at,consultation_started_at)
VALUES (ts6,p6,1,fd2,'Completed','Booked','Second trimester prenatal checkup','28 weeks gestation',CURRENT_DATE - 2 + TIME '08:50',CURRENT_DATE - 2 + TIME '09:05')
RETURNING appointment_id INTO ap6;

-- AP7: Amila -> Dr. Asanka (Ortho, Colombo) – knee pain
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit,notes,checked_in_at,consultation_started_at)
VALUES (ts5,p7,1,fd1,'Completed','Booked','Right knee pain after sports injury','Cricket – acute onset during bowling',CURRENT_DATE - 2 + TIME '13:45',CURRENT_DATE - 2 + TIME '14:10')
RETURNING appointment_id INTO ap7;

-- AP8: Dinesha -> Dr. Tharushi (Pedi, Galle) – child fever
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit,notes,checked_in_at,consultation_started_at)
VALUES (ts4,p8,2,fd3,'Completed','Emergency','High-grade fever with rash in 3-year-old','Emergency walk-in – suspected viral exanthem',CURRENT_DATE - 3 + TIME '09:40',CURRENT_DATE - 3 + TIME '10:00')
RETURNING appointment_id INTO ap8;

-- AP9: Lahiru -> Dr. Malik (Pulm, Colombo) – breathing difficulty
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit,notes,checked_in_at,consultation_started_at)
VALUES (ts7,p9,1,fd1,'Completed','Booked','Wheezing and shortness of breath for 1 week','Known asthma patient – exacerbation',CURRENT_DATE - 1 + TIME '08:50',CURRENT_DATE - 1 + TIME '09:10')
RETURNING appointment_id INTO ap9;

-- AP10: Roshan -> Dr. Kasun (Cardio, Colombo) – palpitations
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit,notes,checked_in_at,consultation_started_at)
VALUES (ts1,p11,2,fd1,'Completed','Booked','Irregular heartbeat and palpitations at rest','Family history of AF',CURRENT_DATE - 5 + TIME '09:30',CURRENT_DATE - 5 + TIME '09:50')
RETURNING appointment_id INTO ap10;

-- ======= IN PROGRESS (11-15) – today =======

-- AP11: Vishmi -> Dr. Chamari (Derm, Kandy) – acne
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit,notes,checked_in_at,consultation_started_at)
VALUES (ts11,p10,1,fd2,'InProgress','Booked','Severe cystic acne on face and back','Previously tried topical retinoids',CURRENT_TIMESTAMP - INTERVAL '45 min',CURRENT_TIMESTAMP - INTERVAL '30 min')
RETURNING appointment_id INTO ap11;

-- AP12: Buddhika -> Dr. Kasun (Cardio, Colombo) – chest pain
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit,notes,checked_in_at,consultation_started_at)
VALUES (ts8,p13,1,fd1,'InProgress','Walkin','Acute chest pain radiating to left arm','Emergency walk-in – ECG ordered stat',CURRENT_TIMESTAMP - INTERVAL '50 min',CURRENT_TIMESTAMP - INTERVAL '40 min')
RETURNING appointment_id INTO ap12;

-- AP13: Nilmini -> Dr. Nuwan (GenMed, Colombo) – headache
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit,notes,checked_in_at,consultation_started_at)
VALUES (ts9,p14,1,fd1,'InProgress','Booked','Persistent tension headache for 2 weeks','OTC painkillers not effective',CURRENT_TIMESTAMP - INTERVAL '35 min',CURRENT_TIMESTAMP - INTERVAL '20 min')
RETURNING appointment_id INTO ap13;

-- AP14: Sampath -> Dr. Ruwantha (Neuro, Colombo) – migraine
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit,notes,checked_in_at,consultation_started_at)
VALUES (ts10,p17,1,fd1,'InProgress','Booked','Recurring migraine with aura – 3rd episode this month','Previous MRI normal 6 months ago',CURRENT_TIMESTAMP - INTERVAL '40 min',CURRENT_TIMESTAMP - INTERVAL '25 min')
RETURNING appointment_id INTO ap14;

-- AP15: Dinesh (follow-up) -> Dr. Kasun (Cardio, Colombo)
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit,notes,checked_in_at,consultation_started_at)
VALUES (ts8,p3,2,fd1,'InProgress','Booked','Follow-up ECG and lipid profile review','Results from annual screening',CURRENT_TIMESTAMP - INTERVAL '25 min',CURRENT_TIMESTAMP - INTERVAL '10 min')
RETURNING appointment_id INTO ap15;

-- ======= CHECKED IN (16-18) – today, waiting =======

-- AP16: Thilini -> Dr. Nuwan (GenMed, Colombo) – sore throat
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit,notes,checked_in_at)
VALUES (ts9,p18,2,fd1,'CheckedIn','Booked','Sore throat and mild fever for 2 days','Waiting in lobby',CURRENT_TIMESTAMP - INTERVAL '15 min')
RETURNING appointment_id INTO ap16;

-- AP17: Hiruni -> Dr. Chamari (Derm, Kandy) – eczema
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit,notes,checked_in_at)
VALUES (ts11,p20,2,fd2,'CheckedIn','Booked','Chronic eczema flare-up on hands','Occupational exposure suspected',CURRENT_TIMESTAMP - INTERVAL '10 min')
RETURNING appointment_id INTO ap17;

-- AP18: Kaveen (follow-up) -> Dr. Ruwantha (Neuro, Colombo) – dizziness
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit,notes,checked_in_at)
VALUES (ts10,p1,2,NULL,'CheckedIn','Booked','Post-cardiac dizziness evaluation','Self-booked via patient portal',CURRENT_TIMESTAMP - INTERVAL '8 min')
RETURNING appointment_id INTO ap18;

-- ======= SCHEDULED (19-26) – future dates =======

-- AP19: Achini -> Dr. Tharushi (Pedi, Galle) – child check-up
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit)
VALUES (ts13,p12,1,fd3,'Scheduled','Booked','Routine growth and milestone check – 6 months')
RETURNING appointment_id INTO ap19;

-- AP20: Supun -> Dr. Sachini (ENT, Galle) – ear pain
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit)
VALUES (ts14,p15,1,fd3,'Scheduled','Booked','Right ear pain and hearing loss for 1 week')
RETURNING appointment_id INTO ap20;

-- AP21: Chathurika -> Dr. Hansika (Ophth, Kandy) – vision check
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit)
VALUES (ts15,p16,1,fd2,'Scheduled','Booked','Blurry near vision – possible myopia progression')
RETURNING appointment_id INTO ap21;

-- AP22: Charith -> Dr. Asanka (Ortho, Colombo) – shoulder pain
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit)
VALUES (ts16,p19,1,fd1,'Scheduled','Booked','Left shoulder impingement – pain with overhead movement')
RETURNING appointment_id INTO ap22;

-- AP23: Sanduni (follow-up) -> Dr. Dilini (OBGYN, Kandy)
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit)
VALUES (ts17,p2,1,NULL,'Scheduled','Booked','Third trimester follow-up – 32 weeks')
RETURNING appointment_id INTO ap23;

-- AP24: Lahiru (follow-up) -> Dr. Malik (Pulm, Colombo)
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit)
VALUES (ts18,p9,1,fd1,'Scheduled','Booked','Asthma management review – spirometry')
RETURNING appointment_id INTO ap24;

-- AP25: Amila -> Dr. Kasun (Cardio, Colombo) – cardiac follow-up
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit)
VALUES (ts12,p7,1,NULL,'Scheduled','Booked','Post-ortho cardiac clearance')
RETURNING appointment_id INTO ap25;

-- AP26: Pawani -> Dr. Hansika (Ophth, Kandy) – routine eye check
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit)
VALUES (ts15,p6,2,fd2,'Scheduled','Booked','Routine prenatal eye pressure screening')
RETURNING appointment_id INTO ap26;

-- ======= CANCELLED (27-28) =======

-- AP27: Tharanga -> Dr. Asanka (Ortho, Colombo) – back pain
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit,cancelled_reason)
VALUES (ts5,p5,2,fd1,'Cancelled','Booked','Lower back pain radiating to right leg','Patient could not travel – road flooding')
RETURNING appointment_id INTO ap27;

-- AP28: Chathurika -> Dr. Dilini (OBGYN, Kandy) – rescheduled
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit,cancelled_reason)
VALUES (ts6,p16,2,fd2,'Cancelled','Booked','Menstrual irregularity workup','Rescheduled to next week per patient request')
RETURNING appointment_id INTO ap28;

-- ======= NO SHOW (29-30) =======

-- AP29: Roshan -> Dr. Malik (Pulm, Colombo) – follow-up missed
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit)
VALUES (ts7,p11,2,fd1,'NoShow','Booked','Chronic cough follow-up')
RETURNING appointment_id INTO ap29;

-- AP30: Dinesha -> Dr. Chamari (Derm, Kandy) – skin allergy missed
INSERT INTO appointment (time_slot_id,patient_id,queue_number,created_by,status,source,reason_for_visit)
VALUES (ts3,p8,2,fd2,'NoShow','Booked','Contact dermatitis evaluation')
RETURNING appointment_id INTO ap30;

-- ============================================================================
-- 12.  CONSULTATION RECORDS  (10 – for completed appointments)
-- ============================================================================

INSERT INTO consultation_record (appointment_id,symptoms,diagnosis,follow_up_required,follow_up_date,notes) VALUES
(ap1,'Mild exertional dyspnea, palpitations over past 2 weeks','Sinus tachycardia – acute coronary syndrome ruled out',TRUE,CURRENT_DATE + 14,'Advised low-sodium diet and stress moderation. Review with lipid profile.');

INSERT INTO consultation_record (appointment_id,symptoms,diagnosis,follow_up_required,follow_up_date,notes) VALUES
(ap2,'No acute complaints – annual screening','Normal general health. Mild vitamin D deficiency',TRUE,CURRENT_DATE + 90,'Prescribed Vitamin D3 supplement. Review FBS and lipid in 3 months.');

INSERT INTO consultation_record (appointment_id,symptoms,diagnosis,follow_up_required,follow_up_date,notes) VALUES
(ap3,'High fever 39.2C, productive cough, body aches for 3 days','Acute upper respiratory tract infection',TRUE,CURRENT_DATE + 7,'Antibiotics started. Return if fever persists beyond 48 hours.');

INSERT INTO consultation_record (appointment_id,symptoms,diagnosis,follow_up_required,follow_up_date,notes) VALUES
(ap4,'Erythematous, pruritic, papular rash on bilateral forearms','Allergic contact dermatitis – probable nickel allergy',TRUE,CURRENT_DATE + 21,'Patch testing scheduled. Avoid costume jewellery. Topical steroid prescribed.');

INSERT INTO consultation_record (appointment_id,symptoms,diagnosis,follow_up_required,follow_up_date,notes) VALUES
(ap5,'Healthy child, adequate weight gain, developmental milestones met','Normal growth – 18-month assessment',TRUE,CURRENT_DATE + 180,'All vaccinations up to date. Next MMR booster at 24 months.');

INSERT INTO consultation_record (appointment_id,symptoms,diagnosis,follow_up_required,follow_up_date,notes) VALUES
(ap6,'Mild pedal oedema, Blood pressure 120/80','Normal second trimester progress – 28 weeks',TRUE,CURRENT_DATE + 28,'GDM screening normal. Iron and folic acid continued. Next visit at 32 weeks.');

INSERT INTO consultation_record (appointment_id,symptoms,diagnosis,follow_up_required,follow_up_date,notes) VALUES
(ap7,'Swelling and tenderness over right knee, limited ROM','Grade II medial collateral ligament sprain',TRUE,CURRENT_DATE + 14,'RICE protocol. Knee brace applied. Physiotherapy referral. X-ray clear.');

INSERT INTO consultation_record (appointment_id,symptoms,diagnosis,follow_up_required,follow_up_date,notes) VALUES
(ap8,'High fever 40.1C, maculopapular rash trunk and face','Roseola infantum (HHV-6)',FALSE,NULL,'Supportive care. Fever resolved within 24 hrs. Rash fading. No antibiotics needed.');

INSERT INTO consultation_record (appointment_id,symptoms,diagnosis,follow_up_required,follow_up_date,notes) VALUES
(ap9,'Wheezing, tachypnea (RR 28), SpO2 95% on room air','Acute asthma exacerbation – moderate severity',TRUE,CURRENT_DATE + 7,'Nebulisation given. Inhaler technique reviewed. Preventer dose stepped up.');

INSERT INTO consultation_record (appointment_id,symptoms,diagnosis,follow_up_required,follow_up_date,notes) VALUES
(ap10,'Palpitations at rest, 2 episodes of near-syncope','Paroxysmal supraventricular tachycardia (PSVT)',TRUE,CURRENT_DATE + 7,'ECG showed SVT run. Holter monitor ordered for 24-hour recording. Verapamil PRN.');

-- ============================================================================
-- 13.  APPOINTMENT TREATMENTS  (15 – for completed & in-progress appointments)
-- ============================================================================

-- AP1 (Kaveen – Cardio): ECG + Lipid Profile
INSERT INTO appointment_treatment (appointment_id,treatment_service_code,performed_by,quantity,unit_price,line_total,notes,status,ordered_at,performed_at)
VALUES (ap1,tx_ecg,doc1,1,1500.00,1500.00,'Sinus rhythm, rate 94 bpm','Completed',CURRENT_DATE - 5 + TIME '09:15',CURRENT_DATE - 5 + TIME '09:25')
RETURNING appointment_treatment_id INTO at1;

INSERT INTO appointment_treatment (appointment_id,treatment_service_code,performed_by,quantity,unit_price,line_total,notes,status,ordered_at,performed_at)
VALUES (ap1,tx_lipid,doc1,1,1200.00,1200.00,'Total cholesterol 220, LDL 145','Completed',CURRENT_DATE - 5 + TIME '09:15',CURRENT_DATE - 5 + TIME '10:00')
RETURNING appointment_treatment_id INTO at2;

-- AP2 (Dinesh – GenMed): FBS + CBC
INSERT INTO appointment_treatment (appointment_id,treatment_service_code,performed_by,quantity,unit_price,line_total,notes,status,ordered_at,performed_at)
VALUES (ap2,tx_fbs,doc3,1,600.00,600.00,'FBS 95 mg/dL – normal','Completed',CURRENT_DATE - 4 + TIME '08:20',CURRENT_DATE - 4 + TIME '08:35')
RETURNING appointment_treatment_id INTO at3;

INSERT INTO appointment_treatment (appointment_id,treatment_service_code,performed_by,quantity,unit_price,line_total,notes,status,ordered_at,performed_at)
VALUES (ap2,tx_cbc,doc3,1,800.00,800.00,'WBC 7.2, Hb 14.5, Plt 250k – all normal','Completed',CURRENT_DATE - 4 + TIME '08:20',CURRENT_DATE - 4 + TIME '08:40')
RETURNING appointment_treatment_id INTO at4;

-- AP3 (Tharanga – GenMed): CBC
INSERT INTO appointment_treatment (appointment_id,treatment_service_code,performed_by,quantity,unit_price,line_total,notes,status,ordered_at,performed_at)
VALUES (ap3,tx_cbc,doc3,1,800.00,800.00,'WBC 12.8 – elevated, neutrophilia','Completed',CURRENT_DATE - 4 + TIME '08:55',CURRENT_DATE - 4 + TIME '09:10')
RETURNING appointment_treatment_id INTO at5;

-- AP7 (Amila – Ortho): X-Ray + Physio
INSERT INTO appointment_treatment (appointment_id,treatment_service_code,performed_by,quantity,unit_price,line_total,notes,status,ordered_at,performed_at)
VALUES (ap7,tx_xray,doc5,1,2200.00,2200.00,'No fracture. Soft tissue swelling noted','Completed',CURRENT_DATE - 2 + TIME '14:15',CURRENT_DATE - 2 + TIME '14:30')
RETURNING appointment_treatment_id INTO at6;

INSERT INTO appointment_treatment (appointment_id,treatment_service_code,performed_by,quantity,unit_price,line_total,notes,status,ordered_at,performed_at)
VALUES (ap7,tx_physio,doc5,1,2500.00,2500.00,'Initial assessment and therapeutic ultrasound','Completed',CURRENT_DATE - 2 + TIME '14:35',CURRENT_DATE - 2 + TIME '15:00')
RETURNING appointment_treatment_id INTO at7;

-- AP8 (Dinesha – Pedi): CBC
INSERT INTO appointment_treatment (appointment_id,treatment_service_code,performed_by,quantity,unit_price,line_total,notes,status,ordered_at,performed_at)
VALUES (ap8,tx_cbc,doc4,1,800.00,800.00,'WBC 10.2, lymphocyte predominant – viral pattern','Completed',CURRENT_DATE - 3 + TIME '10:05',CURRENT_DATE - 3 + TIME '10:20')
RETURNING appointment_treatment_id INTO at8;

-- AP9 (Lahiru – Pulm): Chest X-Ray
INSERT INTO appointment_treatment (appointment_id,treatment_service_code,performed_by,quantity,unit_price,line_total,notes,status,ordered_at,performed_at)
VALUES (ap9,tx_xray,doc9,1,2200.00,2200.00,'Hyperinflated lungs, no consolidation','Completed',CURRENT_DATE - 1 + TIME '09:15',CURRENT_DATE - 1 + TIME '09:30')
RETURNING appointment_treatment_id INTO at9;

-- AP10 (Roshan – Cardio): ECG
INSERT INTO appointment_treatment (appointment_id,treatment_service_code,performed_by,quantity,unit_price,line_total,notes,status,ordered_at,performed_at)
VALUES (ap10,tx_ecg,doc1,1,1500.00,1500.00,'Short run of SVT captured on rhythm strip','Completed',CURRENT_DATE - 5 + TIME '09:55',CURRENT_DATE - 5 + TIME '10:05')
RETURNING appointment_treatment_id INTO at10;

-- ---- InProgress appointment treatments (ordered but not yet completed) ----

-- AP12 (Buddhika – Cardio): ECG ordered stat
INSERT INTO appointment_treatment (appointment_id,treatment_service_code,performed_by,quantity,unit_price,line_total,notes,status,ordered_at)
VALUES (ap12,tx_ecg,NULL,1,1500.00,1500.00,'Stat ECG – chest pain workup','Ordered',CURRENT_TIMESTAMP - INTERVAL '38 min')
RETURNING appointment_treatment_id INTO at11;

-- AP12 (Buddhika – Cardio): FBS baseline
INSERT INTO appointment_treatment (appointment_id,treatment_service_code,performed_by,quantity,unit_price,line_total,notes,status,ordered_at)
VALUES (ap12,tx_fbs,NULL,1,600.00,600.00,'FBS – baseline metabolic check during ACS workup','Ordered',CURRENT_TIMESTAMP - INTERVAL '38 min')
RETURNING appointment_treatment_id INTO at12;

-- AP14 (Sampath – Neuro): MRI Brain ordered
INSERT INTO appointment_treatment (appointment_id,treatment_service_code,performed_by,quantity,unit_price,line_total,notes,status,ordered_at)
VALUES (ap14,tx_mri,NULL,1,15000.00,15000.00,'MRI Brain with contrast – recurrent migraine with new symptoms','Ordered',CURRENT_TIMESTAMP - INTERVAL '20 min')
RETURNING appointment_treatment_id INTO at13;

-- AP15 (Dinesh follow-up – Cardio): ECG + Lipid
INSERT INTO appointment_treatment (appointment_id,treatment_service_code,performed_by,quantity,unit_price,line_total,notes,status,ordered_at)
VALUES (ap15,tx_ecg,NULL,1,1500.00,1500.00,'Follow-up ECG comparison','Ordered',CURRENT_TIMESTAMP - INTERVAL '8 min')
RETURNING appointment_treatment_id INTO at14;

INSERT INTO appointment_treatment (appointment_id,treatment_service_code,performed_by,quantity,unit_price,line_total,notes,status,ordered_at)
VALUES (ap15,tx_lipid,NULL,1,1200.00,1200.00,'3-month lipid profile comparison','Ordered',CURRENT_TIMESTAMP - INTERVAL '8 min')
RETURNING appointment_treatment_id INTO at15;

-- ============================================================================
-- 14.  PRESCRIPTIONS  (18)
-- ============================================================================

-- AP1 prescriptions (Kaveen – Cardio)
INSERT INTO prescription (appointment_id,medication_id,dosage,frequency,duration_days,notes,allergy_checked) VALUES (ap1,med_ator,'20mg','Once daily at bedtime',30,'Statin therapy for elevated LDL',TRUE);
INSERT INTO prescription (appointment_id,medication_id,dosage,frequency,duration_days,notes,allergy_checked) VALUES (ap1,med_para,'1000mg','TDS after meals',5,'For chest discomfort – PRN',TRUE);

-- AP2 prescriptions (Dinesh – GenMed)
INSERT INTO prescription (appointment_id,medication_id,dosage,frequency,duration_days,notes,allergy_checked) VALUES (ap2,med_omep,'20mg','Once daily before breakfast',14,'For mild dyspepsia noted during screening',TRUE);

-- AP3 prescriptions (Tharanga – GenMed)
INSERT INTO prescription (appointment_id,medication_id,dosage,frequency,duration_days,notes,allergy_checked) VALUES (ap3,med_amox,'500mg','TDS after meals',7,'For URTI with suspected secondary bacterial infection',TRUE);
INSERT INTO prescription (appointment_id,medication_id,dosage,frequency,duration_days,notes,allergy_checked) VALUES (ap3,med_para,'500mg','QDS – maximum 4g/day',5,'Antipyretic',TRUE);

-- AP4 prescriptions (Sanduni – Derm)
INSERT INTO prescription (appointment_id,medication_id,dosage,frequency,duration_days,notes,allergy_checked) VALUES (ap4,med_ceti,'10mg','Once daily at night',14,'Antihistamine for pruritis',TRUE);
INSERT INTO prescription (appointment_id,medication_id,dosage,frequency,duration_days,notes,allergy_checked) VALUES (ap4,med_pred,'5mg','BD for 5 days then taper',10,'Short course for acute flare',TRUE);

-- AP6 prescriptions (Pawani – OBGYN)
INSERT INTO prescription (appointment_id,medication_id,dosage,frequency,duration_days,notes,allergy_checked) VALUES (ap6,med_met,'500mg','BD with meals',90,'Iron supplement continued – pregnancy-safe formulation',TRUE);

-- AP7 prescriptions (Amila – Ortho)
INSERT INTO prescription (appointment_id,medication_id,dosage,frequency,duration_days,notes,allergy_checked) VALUES (ap7,med_ibup,'400mg','TDS after meals',7,'Anti-inflammatory for ligament sprain',TRUE);
INSERT INTO prescription (appointment_id,medication_id,dosage,frequency,duration_days,notes,allergy_checked) VALUES (ap7,med_para,'500mg','QDS PRN',7,'Additional analgesia',TRUE);

-- AP8 prescriptions (Dinesha – Pedi)
INSERT INTO prescription (appointment_id,medication_id,dosage,frequency,duration_days,notes,allergy_checked) VALUES (ap8,med_para,'250mg','QDS – paediatric syrup',3,'Antipyretic for child – 15mg/kg/dose',TRUE);

-- AP9 prescriptions (Lahiru – Pulm)
INSERT INTO prescription (appointment_id,medication_id,dosage,frequency,duration_days,notes,allergy_checked) VALUES (ap9,med_salb,'200mcg','2 puffs QDS and PRN',30,'Reliever inhaler – spacer device advised',TRUE);
INSERT INTO prescription (appointment_id,medication_id,dosage,frequency,duration_days,notes,allergy_checked) VALUES (ap9,med_pred,'30mg','Once daily morning',5,'Oral steroid burst for moderate exacerbation',TRUE);

-- AP10 prescriptions (Roshan – Cardio)
INSERT INTO prescription (appointment_id,medication_id,dosage,frequency,duration_days,notes,allergy_checked) VALUES (ap10,med_amlo,'5mg','Once daily morning',30,'Rate control for PSVT',TRUE);

-- AP13 prescriptions (Nilmini – GenMed, in-progress but Rx issued)
INSERT INTO prescription (appointment_id,medication_id,dosage,frequency,duration_days,notes,allergy_checked) VALUES (ap13,med_para,'1000mg','BD',7,'Tension headache management',TRUE);

-- AP14 prescriptions (Sampath – Neuro, in-progress)
INSERT INTO prescription (appointment_id,medication_id,dosage,frequency,duration_days,notes,allergy_checked) VALUES (ap14,med_losa,'50mg','Once daily',30,'Migraine prophylaxis – losartan trial',TRUE);

-- ============================================================================
-- 15.  INVOICES  (10 – for all completed appointments)
-- ============================================================================

-- AP1: Consult 2500 + ECG 1500 + Lipid 1200 = 5200
INSERT INTO invoice (appointment_id,patient_id,invoice_date,gross_amount,discount_amount,tax_amount,net_amount,paid_amount,due_amount,insurance_covered_amount,status)
VALUES (ap1,p1,CURRENT_DATE - 5 + TIME '10:30',5200.00,0.00,0.00,5200.00,520.00,0.00,4680.00,'Paid')
RETURNING invoice_id INTO inv1;

-- AP2: Consult 2000 + FBS 600 + CBC 800 = 3400
INSERT INTO invoice (appointment_id,patient_id,invoice_date,gross_amount,discount_amount,tax_amount,net_amount,paid_amount,due_amount,insurance_covered_amount,status)
VALUES (ap2,p3,CURRENT_DATE - 4 + TIME '09:30',3400.00,0.00,0.00,3400.00,510.00,0.00,2890.00,'Paid')
RETURNING invoice_id INTO inv2;

-- AP3: Consult 2000 + CBC 800 = 2800 (no insurance)
INSERT INTO invoice (appointment_id,patient_id,invoice_date,gross_amount,discount_amount,tax_amount,net_amount,paid_amount,due_amount,insurance_covered_amount,status)
VALUES (ap3,p5,CURRENT_DATE - 4 + TIME '10:00',2800.00,0.00,0.00,2800.00,2800.00,0.00,0.00,'Paid')
RETURNING invoice_id INTO inv3;

-- AP4: Consult 2000 (dermatology consult only)
INSERT INTO invoice (appointment_id,patient_id,invoice_date,gross_amount,discount_amount,tax_amount,net_amount,paid_amount,due_amount,insurance_covered_amount,status)
VALUES (ap4,p2,CURRENT_DATE - 3 + TIME '15:00',2000.00,0.00,0.00,2000.00,2000.00,0.00,0.00,'Paid')
RETURNING invoice_id INTO inv4;

-- AP5: Consult 1800 (paediatric consult)
INSERT INTO invoice (appointment_id,patient_id,invoice_date,gross_amount,discount_amount,tax_amount,net_amount,paid_amount,due_amount,insurance_covered_amount,status)
VALUES (ap5,p4,CURRENT_DATE - 3 + TIME '10:00',1800.00,0.00,0.00,1800.00,1800.00,0.00,0.00,'Paid')
RETURNING invoice_id INTO inv5;

-- AP6: Consult 2500 (OBGYN prenatal – discount applied)
INSERT INTO invoice (appointment_id,patient_id,invoice_date,gross_amount,discount_amount,tax_amount,net_amount,paid_amount,due_amount,insurance_covered_amount,status)
VALUES (ap6,p6,CURRENT_DATE - 2 + TIME '10:00',2500.00,200.00,0.00,2300.00,2300.00,0.00,0.00,'Paid')
RETURNING invoice_id INTO inv6;

-- AP7: Consult 3000 + X-Ray 2200 + Physio 2500 = 7700 (insured)
INSERT INTO invoice (appointment_id,patient_id,invoice_date,gross_amount,discount_amount,tax_amount,net_amount,paid_amount,due_amount,insurance_covered_amount,status)
VALUES (ap7,p7,CURRENT_DATE - 2 + TIME '15:30',7700.00,0.00,0.00,7700.00,924.00,0.00,6776.00,'Paid')
RETURNING invoice_id INTO inv7;

-- AP8: Consult 1800 + CBC 800 = 2600
INSERT INTO invoice (appointment_id,patient_id,invoice_date,gross_amount,discount_amount,tax_amount,net_amount,paid_amount,due_amount,insurance_covered_amount,status)
VALUES (ap8,p8,CURRENT_DATE - 3 + TIME '10:45',2600.00,0.00,0.00,2600.00,2600.00,0.00,0.00,'Paid')
RETURNING invoice_id INTO inv8;

-- AP9: Consult 2500 + X-Ray 2200 = 4700 (insured)
INSERT INTO invoice (appointment_id,patient_id,invoice_date,gross_amount,discount_amount,tax_amount,net_amount,paid_amount,due_amount,insurance_covered_amount,status)
VALUES (ap9,p9,CURRENT_DATE - 1 + TIME '10:00',4700.00,0.00,0.00,4700.00,705.00,0.00,3995.00,'Paid')
RETURNING invoice_id INTO inv9;

-- AP10: Consult 2500 + ECG 1500 = 4000
INSERT INTO invoice (appointment_id,patient_id,invoice_date,gross_amount,discount_amount,tax_amount,net_amount,paid_amount,due_amount,insurance_covered_amount,status)
VALUES (ap10,p11,CURRENT_DATE - 5 + TIME '10:30',4000.00,0.00,0.00,4000.00,4000.00,0.00,0.00,'Paid')
RETURNING invoice_id INTO inv10;

-- ============================================================================
-- 16.  PAYMENTS  (10 – one per invoice)
-- ============================================================================

INSERT INTO payment (invoice_id,amount,payment_date,payment_method,received_by,reference_number) VALUES (inv1,  520.00,CURRENT_DATE - 5 + TIME '10:35','Cash',fd1,'REC-CLM-0041');
INSERT INTO payment (invoice_id,amount,payment_date,payment_method,received_by,reference_number) VALUES (inv2,  510.00,CURRENT_DATE - 4 + TIME '09:35','Card',fd1,'REC-CLM-0042');
INSERT INTO payment (invoice_id,amount,payment_date,payment_method,received_by,reference_number) VALUES (inv3, 2800.00,CURRENT_DATE - 4 + TIME '10:05','Cash',fd1,'REC-CLM-0043');
INSERT INTO payment (invoice_id,amount,payment_date,payment_method,received_by,reference_number) VALUES (inv4, 2000.00,CURRENT_DATE - 3 + TIME '15:05','Card',fd2,'REC-KDY-0011');
INSERT INTO payment (invoice_id,amount,payment_date,payment_method,received_by,reference_number) VALUES (inv5, 1800.00,CURRENT_DATE - 3 + TIME '10:05','Cash',fd3,'REC-GLE-0006');
INSERT INTO payment (invoice_id,amount,payment_date,payment_method,received_by,reference_number) VALUES (inv6, 2300.00,CURRENT_DATE - 2 + TIME '10:05','BankTransfer',fd2,'REC-KDY-0012');
INSERT INTO payment (invoice_id,amount,payment_date,payment_method,received_by,reference_number) VALUES (inv7,  924.00,CURRENT_DATE - 2 + TIME '15:35','Card',fd1,'REC-CLM-0044');
INSERT INTO payment (invoice_id,amount,payment_date,payment_method,received_by,reference_number) VALUES (inv8, 2600.00,CURRENT_DATE - 3 + TIME '10:50','Cash',fd3,'REC-GLE-0007');
INSERT INTO payment (invoice_id,amount,payment_date,payment_method,received_by,reference_number) VALUES (inv9,  705.00,CURRENT_DATE - 1 + TIME '10:05','OnlinePayment',fd1,'REC-CLM-0045');
INSERT INTO payment (invoice_id,amount,payment_date,payment_method,received_by,reference_number) VALUES (inv10,4000.00,CURRENT_DATE - 5 + TIME '10:35','Card',fd1,'REC-CLM-0046');

-- ============================================================================
-- 17.  INSURANCE CLAIMS  (5 – for insured patients with completed appointments)
-- ============================================================================

-- Claim 1: Kaveen (ins1 / SLIC) on inv1 – ECG + Lipid covered
INSERT INTO insurance_claim (invoice_id,insurance_id,claim_date,claimed_amount,approved_amount,status,settlement_date,remarks)
VALUES (inv1,ins1,CURRENT_DATE - 5 + TIME '11:00',4680.00,4680.00,'Settled',CURRENT_DATE - 3 + TIME '15:00','Direct cashless settlement with SLIC')
RETURNING claim_id INTO cl1;

INSERT INTO insurance_claim_item (claim_id,appointment_treatment_id,claimed_amount,approved_amount) VALUES (cl1,at1,1500.00,1500.00);
INSERT INTO insurance_claim_item (claim_id,appointment_treatment_id,claimed_amount,approved_amount) VALUES (cl1,at2,1200.00,1200.00);

-- Claim 2: Dinesh (ins2 / Ceylinco) on inv2 – FBS + CBC covered
INSERT INTO insurance_claim (invoice_id,insurance_id,claim_date,claimed_amount,approved_amount,status,settlement_date,remarks)
VALUES (inv2,ins2,CURRENT_DATE - 4 + TIME '10:00',2890.00,2890.00,'Settled',CURRENT_DATE - 2 + TIME '14:00','Ceylinco Life direct settlement')
RETURNING claim_id INTO cl2;

INSERT INTO insurance_claim_item (claim_id,appointment_treatment_id,claimed_amount,approved_amount) VALUES (cl2,at3,600.00,600.00);
INSERT INTO insurance_claim_item (claim_id,appointment_treatment_id,claimed_amount,approved_amount) VALUES (cl2,at4,800.00,800.00);

-- Claim 3: Amila (ins4 / Softlogic) on inv7 – X-Ray + Physio
INSERT INTO insurance_claim (invoice_id,insurance_id,claim_date,claimed_amount,approved_amount,status,remarks)
VALUES (inv7,ins4,CURRENT_DATE - 2 + TIME '16:00',6776.00,5500.00,'PartiallyApproved','Physio partially covered – LKR 1276 shortfall to patient')
RETURNING claim_id INTO cl3;

INSERT INTO insurance_claim_item (claim_id,appointment_treatment_id,claimed_amount,approved_amount) VALUES (cl3,at6,2200.00,2200.00);
INSERT INTO insurance_claim_item (claim_id,appointment_treatment_id,claimed_amount,approved_amount) VALUES (cl3,at7,2500.00,1224.00);

-- Claim 4: Lahiru (ins5 / Ceylinco) on inv9 – X-Ray covered
INSERT INTO insurance_claim (invoice_id,insurance_id,claim_date,claimed_amount,approved_amount,status,remarks)
VALUES (inv9,ins5,CURRENT_DATE - 1 + TIME '10:30',3995.00,3995.00,'Approved','Under review – expected settlement within 5 working days')
RETURNING claim_id INTO cl4;

INSERT INTO insurance_claim_item (claim_id,appointment_treatment_id,claimed_amount,approved_amount) VALUES (cl4,at9,2200.00,2200.00);

-- Claim 5: Roshan (ins6 / SLIC) on inv10 – submitted but under review
INSERT INTO insurance_claim (invoice_id,insurance_id,claim_date,claimed_amount,approved_amount,status,remarks)
VALUES (inv10,ins6,CURRENT_DATE - 4 + TIME '11:00',4000.00,0.00,'Submitted','Initial claim submission – awaiting SLIC reviewer')
RETURNING claim_id INTO cl5;

INSERT INTO insurance_claim_item (claim_id,appointment_treatment_id,claimed_amount,approved_amount) VALUES (cl5,at10,1500.00,0.00);

-- ============================================================================
-- Done!
-- ============================================================================

RAISE NOTICE 'MedSync mock data seeded successfully!';
RAISE NOTICE '   3 Branches  |  3 Front-desk  |  10 Doctors  |  40 Patients';
RAISE NOTICE '   3 Insurance packages  |  10 Policies  |  5 Claims';
RAISE NOTICE '   10 Treatments  |  12 Medications';
RAISE NOTICE '   18 Time slots  |  30 Appointments  |  10 Invoices';
RAISE NOTICE '   All passwords: password123';

END $$;
