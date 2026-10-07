import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const [branches, employees, patients] = await Promise.all([
      db.query(`
        SELECT b.branch_id, b.branch_name, b.is_active, b.manager_id, a.city, a.province, u.full_name AS manager_name FROM branch b
        LEFT JOIN address a ON b.address_id = a.address_id
        LEFT JOIN app_user u ON b.manager_id = u.user_id
      `),
      db.query(`SELECT employee_id, branch_id, role, is_active FROM employee`),
      db.query(`SELECT patient_id, registered_branch_id FROM patient`),
    ]);

    const branch = branches.rows.map((branch) => {
        const emplyee = employees.rows.filter((employee) => employee.branch_id === branch.branch_id && employee.is_active);
        const patient = patients.rows.filter((patient) => patient.registered_branch_id === branch.branch_id);
        return {
            branchId: branch.branch_id,
            branchName: branch.branch_name,
            isActive: branch.is_active,
            city: branch.city,
            province: branch.province,
            managerName: branch.manager_name || "Unassigned",
            doctorCount: emplyee.filter((employee) => employee.role === "Doctor").length,
            staffCount: emplyee.filter((employee) => employee.role !== "Doctor").length,
            patientCount: patient.length,
        };
    });

    const totals = {
        activeBranches: branch.filter((branch) => branch.isActive).length,
        totalBranches: branch.length,
        totalDoctors: employees.rows.filter((employee) => employee.role === "Doctor" && employee.is_active).length,
        totalFrontdesk: employees.rows.filter((e) => e.role === "FrontDesk" && e.is_active).length,
        totalAdmins: employees.rows.filter((e) => e.role === "Admin" && e.is_active).length,
        unassignedStaff: employees.rows.filter((employee) => !branch.some((b) => b.branchId === employee.branch_id) && employee.is_active).length,
        totalPatients: patients.rows.length,
    };

    return NextResponse.json({totals, branches: branch});
  } 
  catch(error: any) {
    return NextResponse.json({error: error.message}, {status: 500});
  }
}