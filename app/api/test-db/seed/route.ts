import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    // 1. FIX THE SCHEMA: Allow employees to be unassigned
    await db.query(`ALTER TABLE employee ALTER COLUMN branch_id DROP NOT NULL;`);
    
    const treatmentsQuery = `
      INSERT INTO treatment_catalogue 
          (category, treatment_name, base_price, duration, description, is_insurable, is_active)
      VALUES 
          ('Consultation', 'General Physician Visit', 1500.00, '00:15:00', 'Standard 15-minute consultation with a general practitioner.', TRUE, TRUE),
          ('Radiology', 'Chest X-Ray (PA View)', 2500.00, '00:30:00', 'Standard chest X-ray for diagnostic purposes.', TRUE, TRUE),
          ('Laboratory', 'Complete Blood Count (CBC)', 850.00, '00:10:00', 'Full blood analysis including hemoglobin, WBC, and platelets.', TRUE, TRUE),
          ('Injection', 'Vitamin B12 Shot', 600.00, '00:05:00', 'Intramuscular Vitamin B12 injection. Medication cost not included.', FALSE, TRUE),
          ('Surgery', 'Minor Laceration Suturing', 4500.00, '00:45:00', 'Cleaning and suturing of minor cuts under local anesthesia.', TRUE, TRUE),
          ('Other', 'Basic Wound Dressing', 1200.00, '00:20:00', 'Standard cleaning and dressing of surface wounds.', TRUE, TRUE)
      ON CONFLICT DO NOTHING;
    `;

    const branchesQuery = `
      -- 1. Create Addresses
      INSERT INTO address (address_id, address_line1, city, province) VALUES
      ('11111111-0000-0000-0000-000000000001', '123 Clinic Way', 'Colombo', 'Western Province'), 
      ('11111111-0000-0000-0000-000000000002', '45 Kandy Road', 'Kandy', 'Central Province'),
      ('11111111-0000-0000-0000-000000000003', '7A Temple St', 'Colombo', 'Western Province'),
      ('11111111-0000-0000-0000-000000000004', '99 Lake View', 'Kandy', 'Central Province'),  
      ('11111111-0000-0000-0000-000000000005', '12 Palm Ave', 'Colombo', 'Western Province'), 
      ('11111111-0000-0000-0000-000000000006', '34 Hill St', 'Kandy', 'Central Province'),
      ('11111111-0000-0000-0000-000000000007', '55 Doctor Lane', 'Colombo', 'Western Province'),
      ('11111111-0000-0000-0000-000000000008', '88 Patient Rd', 'Colombo', 'Western Province')
      ON CONFLICT DO NOTHING;

      -- 2. Create Contacts
      INSERT INTO contact (contact_id) VALUES
      ('22222222-0000-0000-0000-000000000001'), ('22222222-0000-0000-0000-000000000002'),
      ('22222222-0000-0000-0000-000000000003'), ('22222222-0000-0000-0000-000000000004'),
      ('22222222-0000-0000-0000-000000000005'), ('22222222-0000-0000-0000-000000000006'),
      ('22222222-0000-0000-0000-000000000007'), ('22222222-0000-0000-0000-000000000008')
      ON CONFLICT DO NOTHING;

      -- 3. Create Branches
      INSERT INTO branch (branch_id, branch_name, address_id, contact_id, opened_date, is_active) VALUES
      ('33333333-0000-0000-0000-000000000001', 'Colombo Central Clinic', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '2020-01-01', true),
      ('33333333-0000-0000-0000-000000000002', 'Kandy Branch', '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', '2021-06-15', true)
      ON CONFLICT DO NOTHING;

      -- 4. Create App Users (Fresh IDs and Data)
      INSERT INTO app_user (user_id, address_id, contact_id, user_type, full_name, nic, email, gender, dob, password_hash) VALUES
      ('88888888-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000003', 'Employee', 'Sarah Manager', '901234567Y', 'sarah3@medsync.com', 'Female', '1990-05-14', 'mock_hash_123'),
      ('88888888-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000004', 'Employee', 'David Admin', '851234567Y', 'david3@medsync.com', 'Male', '1985-11-20', 'mock_hash_123'),
      ('88888888-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000005', 'Employee', 'Nimali Desk', '951234567Y', 'nimali3@medsync.com', 'Female', '1995-02-10', 'mock_hash_123'),
      ('88888888-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000006', 'Employee', 'Kamal Staff', '981234567Y', 'kamal3@medsync.com', 'Male', '1998-08-30', 'mock_hash_123'),
      ('88888888-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000007', '22222222-0000-0000-0000-000000000007', 'Employee', 'Dr. James Smith', '198000000002Y', 'james3@medsync.com', 'Male', '1980-05-15', 'mock_hash_456'),
      ('99999999-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000008', '22222222-0000-0000-0000-000000000008', 'Patient', 'Test Patient', '199500000003Y', 'patient3@medsync.com', 'Male', '1995-10-20', 'mock_hash_789')
      ON CONFLICT DO NOTHING;

      -- 5. Create Employees and Assign to Branches (WITH ON CONFLICT DO NOTHING to prevent crashes)
      INSERT INTO employee (employee_id, branch_id, role, salary, joined_date, is_active) VALUES
      ('88888888-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'Admin', 150000.00, '2020-01-05', true),
      ('88888888-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000002', 'Admin', 140000.00, '2021-06-10', true),
      ('88888888-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000001', 'FrontDesk', 60000.00, '2022-03-01', true),
      ('88888888-0000-0000-0000-000000000004', '33333333-0000-0000-0000-000000000002', 'FrontDesk', 55000.00, '2023-01-15', true),
      ('88888888-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000001', 'Doctor', 200000.00, '2021-01-01', true)
      ON CONFLICT DO NOTHING;

      -- 6. Officially set the Branch Managers
      UPDATE branch SET manager_id = '88888888-0000-0000-0000-000000000001' WHERE branch_id = '33333333-0000-0000-0000-000000000001';
      UPDATE branch SET manager_id = '88888888-0000-0000-0000-000000000002' WHERE branch_id = '33333333-0000-0000-0000-000000000002';

      -- 7. Add the Mock Patient
      INSERT INTO patient (patient_id, registered_branch_id)
      VALUES ('99999999-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001')
      ON CONFLICT DO NOTHING;
    `;

    await db.query(treatmentsQuery);
    await db.query(branchesQuery);

    return NextResponse.json({ 
      success: true, 
      message: "Database seeded successfully!" 
    });

  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json({ error: "Failed to seed database.", details: error.message }, { status: 500 });
  }
}