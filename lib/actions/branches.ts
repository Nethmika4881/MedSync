"use server";

import db from "../db";
import { revalidatePath } from "next/cache";

export interface BranchStaff {
  employeeId: string;
  name: string;
  role: string;
}

export interface BranchOverview {
  branch_id: string;
  branch_name: string;
  is_active: boolean;
  address_line1: string;
  city: string;
  province: string;
  patient_count: number;
  doctor_count: number;
  staff: BranchStaff[];
  manager_name: string;
}

export interface CreateBranchInput {
  branch_name: string;
  address_line1: string;
  city: string;
  province: string;
}

export async function getBranches(): Promise<BranchOverview[]> {
  try {
    // Branch data
    const branch = `SELECT b.branch_id, b.branch_name, b.is_active, b.manager_id, a.address_line1, a.city, a.province 
      FROM branch b JOIN address a ON b.address_id = a.address_id ORDER BY b.created_at ASC;`;
    const branchResult = await db.query(branch);
    const branches = branchResult.rows;

    //employees
    const staff = `SELECT e.branch_id, e.employee_id, e.role, a.full_name 
      FROM employee e JOIN app_user a ON e.employee_id = a.user_id  WHERE e.is_active = TRUE;`;
    const staffResult = await db.query(staff);
    const employees = staffResult.rows;

    // Patient count
    const patient = `SELECT registered_branch_id, COUNT(*) as patient_count 
      FROM patient GROUP BY registered_branch_id;`;
    const patientResult = await db.query(patient);
    const patients = patientResult.rows;

    const mergeBranches: BranchOverview[] = branches.map((branch) => {
      const branchStaff = employees.filter((staff) => staff.branch_id === branch.branch_id);
      const branchPatients = patients.find((p) => p.registered_branch_id === branch.branch_id);

      return {
        branch_id: branch.branch_id,
        branch_name: branch.branch_name,
        is_active: branch.is_active,
        address_line1: branch.address_line1,
        city: branch.city,
        province: branch.province,
        patient_count: branchPatients ? parseInt(branchPatients.patient_count, 10) : 0,
        doctor_count: branchStaff.filter((staff) => staff.role === "Doctor").length,
        staff: branchStaff.map((s) => ({
          employeeId: s.employee_id,
          name: s.full_name,
          role: s.role,
        })),
        manager_name: branchStaff.find((staff) => staff.employee_id === branch.manager_id)?.full_name || "Unassigned",
      };
    });

    return mergeBranches;
  } catch (error) {
    console.error("Failed to fetch branches:", error);
    throw new Error("Failed to load branches.");
  }
}

export async function createBranch(data: CreateBranchInput) {
  const { branch_name, address_line1, city, province } = data;

  if (!branch_name || !address_line1 || !city || !province) {
    return { success: false, error: "Missing required fields." };
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const addressResult = await client.query(`INSERT INTO address (address_line1, city, province) 
       VALUES ($1, $2, $3) RETURNING address_id;`,
      [address_line1, city, province]
    );
    const newAddress = addressResult.rows[0].address_id;

    const contactResult = await client.query(`INSERT INTO contact DEFAULT VALUES RETURNING contact_id;`);
    const newContact = contactResult.rows[0].contact_id;

    const branchResult = await client.query(`INSERT INTO branch (branch_name, address_id, contact_id, is_active) 
       VALUES ($1, $2, $3, TRUE) RETURNING *;`,
      [branch_name, newAddress, newContact]);

    await client.query("COMMIT");

    revalidatePath("/admin/branches");
    revalidatePath("/branches");

    return {success: true, message: "Branch created successfully", branch: branchResult.rows[0],};

  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Failed to create branch:", error);
    return {success: false, error: error.message || "Failed to create branch.",};

  } finally {
    client.release();
  }
}

export interface BranchStaffMember {
  employeeId: string;
  name: string;
  role: string;
}

export interface BranchDetails {
  branch_id: string;
  branch_name: string;
  is_active: boolean;
  address_line1: string;
  city: string;
  province: string;
  manager_name: string;
  doctor_count: number;
  patient_count: number;
  staff: BranchStaffMember[];
  available_staff: BranchStaffMember[];
}

export interface UpdateBranchDetailsInput {
  branch_name: string;
  address_line1: string;
  city: string;
  province: string;
}

export async function getBranchById(branchId: string) {
  try {
    const branch = `SELECT b.branch_id, b.branch_name, b.is_active, a.address_line1, a.city, a.province, u.full_name AS manager_name,
        (SELECT COUNT(*) FROM employee e WHERE e.branch_id = b.branch_id AND e.role = 'Doctor') AS doctor_count,
        (SELECT COUNT(*) FROM patient p WHERE p.registered_branch_id = b.branch_id) AS patient_count
        FROM branch b
        LEFT JOIN address a ON b.address_id = a.address_id
        LEFT JOIN employee m ON b.manager_id = m.employee_id
        LEFT JOIN app_user u ON m.employee_id = u.user_id
        WHERE b.branch_id = $1;`;

    const branchResult = await db.query(branch, [branchId]);

    if (branchResult.rows.length === 0) {
      return null;
    }

    const staff = `SELECT e.employee_id AS "employeeId", u.full_name AS name, e.role FROM employee e
      JOIN app_user u ON e.employee_id = u.user_id
      WHERE e.branch_id = $1 AND e.is_active = true;`;

    const staffResult = await db.query(staff, [branchId]);

    const availableStaff = `SELECT e.employee_id AS "employeeId", u.full_name AS name, e.role FROM employee e
      JOIN app_user u ON e.employee_id = u.user_id
      WHERE e.is_active = true AND e.branch_id IS NULL;`;

    const availableStaffResult = await db.query(availableStaff);

    const row = branchResult.rows[0];

    return {
      ...row,
      doctor_count: Number(row.doctor_count) || 0,
      patient_count: Number(row.patient_count) || 0,
      manager_name: row.manager_name || "Unassigned",
      staff: staffResult.rows,
      available_staff: availableStaffResult.rows,
    };
  } catch (error) {
    console.error("Failed to fetch branch details:", error);
    throw new Error("Failed to fetch branch details");
  }
}

export async function deleteBranch(branchId: string) {
  try {
    await db.query(`DELETE FROM branch WHERE branch_id = $1`, [branchId]);

    revalidatePath("/admin/branches");
    revalidatePath("/branches");

    return { success: true, message: "Branch deleted successfully" };
  } 
  catch (error: any) {
    console.error("Failed to delete branch:", error);
    return { success: false, error: error.message || "Failed to delete branch" };
  }
}

export async function updateBranchDetails(
  branchId: string,
  data: UpdateBranchDetailsInput
) {
  const { branch_name, address_line1, city, province } = data;

  if (!branch_name || !address_line1 || !city || !province) {
    return { success: false, error: "Missing required fields" };
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const branchResult = await client.query(`SELECT address_id FROM branch WHERE branch_id = $1 FOR UPDATE`,
      [branchId]
    );

    if (branchResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, error: "Branch not found" };
    }

    const addressId = branchResult.rows[0].address_id;

    await client.query(
      `UPDATE branch SET branch_name = $1 WHERE branch_id = $2`,
      [branch_name, branchId]
    );

    await client.query(
      `UPDATE address SET address_line1 = $1, city = $2, province = $3 WHERE address_id = $4`,
      [address_line1, city, province, addressId]
    );

    await client.query("COMMIT");

    revalidatePath(`/admin/branches/${branchId}`);
    revalidatePath("/admin/branches");
    revalidatePath("/branches");

    return { success: true, message: "Branch updated successfully" };
  } 
  catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Failed to update branch:", error);
    return { success: false, error: error.message || "Failed to update branch" };
  } 
  finally {
    client.release();
  }
}

export async function assignManager(branchId: string, managerId: string) {
  try {
    await db.query(
      `UPDATE branch SET manager_id = $1 WHERE branch_id = $2`,
      [managerId, branchId]
    );

    revalidatePath(`/admin/branches/${branchId}`);
    revalidatePath("/admin/branches");

    return { success: true, message: "Manager assigned successfully" };
  } 
  catch (error: any) {
    console.error("Failed to assign manager:", error);
    return { success: false, error: error.message || "Failed to assign manager" };
  }
}

export async function removeManager(branchId: string) {
  try {
    await db.query(
      `UPDATE branch SET manager_id = NULL WHERE branch_id = $1`,
      [branchId]
    );

    revalidatePath(`/admin/branches/${branchId}`);
    revalidatePath("/admin/branches");

    return { success: true, message: "Manager removed successfully" };
  } 
  catch (error: any) {
    console.error("Failed to remove manager:", error);
    return { success: false, error: error.message || "Failed to remove manager" };
  }
}

export async function assignStaff(branchId: string, employeeId: string) {
  try {
    await db.query(
      `UPDATE employee SET branch_id = $1 WHERE employee_id = $2`,
      [branchId, employeeId]
    );

    revalidatePath(`/admin/branches/${branchId}`);
    revalidatePath("/admin/branches");

    return { success: true, message: "Staff assigned successfully" };
  } 
  catch (error: any) {
    console.error("Failed to assign staff:", error);
    return { success: false, error: error.message || "Failed to assign staff" };
  }
}

export async function removeStaff(employeeId: string, branchId?: string) {
  try {
    await db.query(
      `UPDATE employee SET branch_id = NULL WHERE employee_id = $1`,
      [employeeId]
    );

    if (branchId) {
      revalidatePath(`/admin/branches/${branchId}`);
    }
    revalidatePath("/admin/branches");
    revalidatePath("/branches");

    return { success: true, message: "Staff removed successfully" };
  } 
  catch (error: any) {
    console.error("Failed to remove staff:", error);
    return { success: false, error: error.message || "Failed to remove staff" };
  }
}