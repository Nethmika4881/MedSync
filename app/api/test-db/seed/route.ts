import { NextResponse } from "next/server";
import db from "@/lib/db"; 

export async function GET() {
  try {
    await db.query(`
      INSERT INTO treatment_catalogue 
          (category, treatment_name, base_price, duration, description, is_insurable, is_active)
      VALUES 
          ('Consultation', 'General Physician Visit', 1500.00, '00:15:00', 'Standard 15-minute consultation with a general practitioner.', TRUE, TRUE),
          ('Radiology', 'Chest X-Ray (PA View)', 2500.00, '00:30:00', 'Standard chest X-ray for diagnostic purposes.', TRUE, TRUE),
          ('Laboratory', 'Complete Blood Count (CBC)', 850.00, '00:10:00', 'Full blood analysis including hemoglobin, WBC, and platelets.', TRUE, TRUE),
          ('Injection', 'Vitamin B12 Shot', 600.00, '00:05:00', 'Intramuscular Vitamin B12 injection. Medication cost not included.', FALSE, TRUE),
          ('Surgery', 'Minor Laceration Suturing', 4500.00, '00:45:00', 'Cleaning and suturing of minor cuts under local anesthesia.', TRUE, TRUE),
          ('Other', 'Basic Wound Dressing', 1200.00, '00:20:00', 'Standard cleaning and dressing of surface wounds.', TRUE, TRUE);
    `);

    return NextResponse.json({ success: true, message: "Mock treatments seeded successfully!" });
  } catch (error) {
    console.error("Seeding error:", error); // Look in your VS Code terminal to see this exact error
    return NextResponse.json(
      { success: false, error: "Failed to seed database" },
      { status: 500 }
    );
  }
}