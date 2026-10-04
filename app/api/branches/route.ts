import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
    try {
        // branch and address data
        const branch = `SELECT b.branch_id, b.branch_name, b.is_active, b.manager_id, a.address_line1, a.city, a.province FROM branch b
        JOIN address a ON b.address_id = a.address_id ORDER BY b.created_at ASC
        `;
        const branchResult = await db.query(branch);
        const branches = branchResult.rows;

        //employees and user names
        const staff = `SELECT e.branch_id, e.employee_id, e.role, a.full_name FROM employee e
        JOIN app_user a ON e.employee_id = a.user_id WHERE e.is_active = TRUE
        `;
        const staffResult = await db.query(staff);
        const employees = staffResult.rows;

        //patients
        const patient = `SELECT registered_branch_id, COUNT(*) as patient_count FROM patient GROUP BY registered_branch_id
        `;
        const patientResult = await db.query(patient);
        const patients = patientResult.rows;

        const mergeBranches = branches.map((branch) => {
            const branchStaff = employees.filter((staff) => staff.branch_id === branch.branch_id);
            const branchPatients = patients.find((p) => p.registered_branch_id === branch.branch_id)
            return {
                branch_id: branch.branch_id,
                branch_name: branch.branch_name,
                is_active: branch.is_active,
                city: branch.city,
                province: branch.province,

                patient_count: branchPatients ? parseInt(branchPatients.patient_count) : 0,

                doctor_count: branchStaff.filter((staff) => staff.role === "Doctor").length,

                staff: branchStaff.map((s) => ({
                    emplyee_id: s.emloyee_id,
                    name: s.full_name,
                    role: s.role,
                })),

                manager_name: branchStaff.find((staff) => staff.emplyee_id === branch.manager_id)?.full_name || "Unassigned"
            };
        });

        return NextResponse.json(mergeBranches);

    }catch (error) {
        console.error("failed to fetch branches:", error);
        return NextResponse.json({ error: "Failed to load branch" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try{
        const body = await request.json();
        const { branch_name, address_line1, city, province } = body;

        if (!branch_name || !address_line1 || !city || !province) {
            return NextResponse.json(
                { error: "Missing required fields" }, { status: 400 }
            );
        }

        await db.query('BEGIN');

        const addressResult = await db.query(`INSERT INTO address (address_line1, city, province) VALUES ($1, $2, $3) RETURNING address_id;`
          , [address_line1, city, province]
        );
        const newAddressId = addressResult.rows[0].address_id;

        const contactResult = await db.query(`INSERT INTO contact DEFAULT VALUES RETURNING contact_id;`
        );
        const newContactId = contactResult.rows[0].contact_id;

        const branchResult = await db.query(`INSERT INTO branch (branch_name, address_id, contact_id, is_active) VALUES ($1, $2, $3, true) RETURNING *;`, [branch_name, newAddressId, newContactId]);

        await db.query('COMMIT');

        return NextResponse.json({
            success: true,
            message: "Branch created successfully",
            branch: branchResult.rows[0]
        }, { status: 201 });
    }
    catch (error: any) {
        await db.query('ROLLBACK');
        console.error("Failed to create branch:", error);
        return NextResponse.json({ error: "Failed to create branch", details: error.message }, { status: 500 });
    }
}