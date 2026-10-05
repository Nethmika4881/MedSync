import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export const GET: (request: NextRequest, context: { params: Promise<{ id: string; }>; }) => void | Response | Promise<void | Response> = async (request, { params }) => {
  try {
    const {id: branchId } = await params;

    const branchQuery = `
      SELECT 
        b.branch_id, 
        b.branch_name, 
        b.is_active,
        a.address_line1, 
        a.city, 
        a.province,
        u.full_name AS manager_name,
        (SELECT COUNT(*) FROM employee e WHERE e.branch_id = b.branch_id AND e.role = 'Doctor') as doctor_count,
        (SELECT COUNT(*) FROM patient p WHERE p.registered_branch_id = b.branch_id) as patient_count
      FROM branch b
      LEFT JOIN address a ON b.address_id = a.address_id
      LEFT JOIN employee m ON b.manager_id = m.employee_id
      LEFT JOIN app_user u ON m.employee_id = u.user_id
      WHERE b.branch_id = $1;
    `;
    const branchResult = await db.query(branchQuery, [branchId]);

    if (branchResult.rows.length === 0) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const branchData = branchResult.rows[0];

    const staffQuery = `
      SELECT 
        e.employee_id AS "employeeId", 
        u.full_name AS name, 
        e.role
      FROM employee e
      JOIN app_user u ON e.employee_id = u.user_id
      WHERE e.branch_id = $1 AND e.is_active = true;
    `;
    const staffResult = await db.query(staffQuery, [branchId]);

    const availableStaffQuery = `
      SELECT 
        e.employee_id AS "employeeId", 
        u.full_name AS name, 
        e.role
      FROM employee e
      JOIN app_user u ON e.employee_id = u.user_id
      WHERE e.is_active = true AND e.branch_id IS NULL;
    `;
    const availableStaffResult = await db.query(availableStaffQuery);

    return NextResponse.json({
      ...branchResult.rows[0],
      manager_name: branchResult.rows[0].manager_name || "Unassigned",
      staff: staffResult.rows,
      available_staff: availableStaffResult.rows
    });
  } 
  catch (error: any) {
    console.error("Failed to fetch branch details:", error);
    return NextResponse.json(
      { error: "Failed to fetch branch details", details: error.message }, 
      { status: 500 }
    );
  }
}

export const DELETE: (request: NextRequest, context: { params: Promise<{ id: string; }>; }) => void | Response | Promise<void | Response> = async (request, { params }) => {
  try {
    const { id: branchID } = await params;

    await db.query(`DELETE FROM branch WHERE branch_id = $1`, [branchID]);
    return NextResponse.json({ success: true, message: "Branch deleted successfully"});
  }
  catch (error: any) {
    console.error("Failed to delete branch:", error);
    return NextResponse.json( { error: "Failed to delete branch", details: error.message }, { status: 500 });
  }
}

export const PATCH: (request: NextRequest, context: { params: Promise<{ id: string; }>; }) => void | Response | Promise<void | Response> = async (request, { params }) => {
  try {
    const { id: branchID } = await params;
    const body = await request.json();
    const { action } = body;

    if(!action) {
      return NextResponse.json({ error: "No action provided" }, { status: 400 });
    }

    // Edit branch details
    if(action === "edit_branch") {
      const { branch_name, address_line1, city, province } = body;
      const branchResult = await db.query(`SELECT address_id FROM branch WHERE branch_id = $1`, [branchID]);

      if(branchResult.rows.length === 0) {
        return NextResponse.json({ error: "Branch not found" }, { status: 404 });
      }
      const addressID = branchResult.rows[0].address_id;

      // I have to update 2 tables
      await db.query(`BEGIN`);

      await db.query(`UPDATE branch SET branch_name = $1 WHERE branch_id = $2`, [branch_name, branchID]);
      await db.query(`UPDATE address SET address_line1 = $1, city = $2, province = $3 WHERE address_id = $4`, [address_line1, city, province, addressID]);

      await db.query('COMMIT');
      return NextResponse.json({ success: true, message: "Branch updated successfully" });
    }

    // change branch manager
    if(action === "change_manager") {
      const { manager_id } = body;
      await db.query(`UPDATE branch SET manager_id = $1 WHERE branch_id = $2`, [manager_id, branchID]);

      return NextResponse.json({ success: true, message: "Manager assigned successfully" });
    }

    // remove branch manager
    if (action === "remove_manager") {
      await db.query(`UPDATE branch SET manager_id = NULL WHERE branch_id = $1`, [branchID]);
      return NextResponse.json({ success: true, message: "Manager removed successfully" });
    }
    
    // assign staff
    if (action === "assign_staff") {
      const { employee_id } = body;
      await db.query(`UPDATE employee SET branch_id = $1 WHERE employee_id = $2`, [branchID, employee_id]);

      return NextResponse.json({ success: true, message: "Staff assigned succesfully" });
    }

    // remove staff
    if (action === "remove_staff") {
      const { employee_id } = body;
      await db.query(`UPDATE employee SET branch_id = NULL WHERE employee_id = $1`, [employee_id]);

      return NextResponse.json({ success: true, message: "Staff removed successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  catch (error: any) {
    await db.query(`ROLLBACK`);
    console.error("PATCH error:", error);
    return NextResponse.json({ error: "Failed to update branch", details: error.message }, { status: 500 });
  }
} 