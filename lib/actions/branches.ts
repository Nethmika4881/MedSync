"use server";

import db from "../db";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { z } from "zod";

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

export interface BranchTraffic {
  branchId: string;
  branchName: string;
  patientCount: number;
  percentage: number;
}

export interface warnings {
  id: string;
  branchId: string;
  branchName: string;
  type: "no_manager" | "no_doctors" | "no_slots";
  message: string;
  severity: "high" | "warning";
}

export interface PatientComplaint {
  complaintId: string;
  branchId: string;
  branchName: string;
  patientName: string;
  subject: string;
  message: string;
  priority: string;
  createdAt: string;
}

export async function getBranches(): Promise<BranchOverview[]> {
  try {
    const user = await getCurrentUser();

    // If unauthenticated or non-admin, return public/basic branch directory without staff or patient details
    if (!user || user.role !== "admin") {
      const branchResult = await db.query(
        `SELECT b.branch_id, b.branch_name, b.is_active, a.address_line1, a.city, a.province 
         FROM branch b JOIN address a ON b.address_id = a.address_id 
         WHERE b.is_active = TRUE ORDER BY b.branch_name ASC;`
      );
      return branchResult.rows.map((branch) => ({
        branch_id: branch.branch_id,
        branch_name: branch.branch_name,
        is_active: branch.is_active,
        address_line1: branch.address_line1,
        city: branch.city,
        province: branch.province,
        patient_count: 0,
        doctor_count: 0,
        staff: [],
        manager_name: "Unassigned",
      }));
    }

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
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

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

export async function getBranchById(branchId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return null;
    if (user.role !== "admin" && user.branchId !== branchId) return null;

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
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

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

export async function branchOverview(timeRange: "today" | "7d" | "30d" = "30d") {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const timeRangeSchema = z.enum(["today", "7d", "30d"]);
    const parsedRange = timeRangeSchema.safeParse(timeRange);
    const safeRange = parsedRange.success ? parsedRange.data : "30d";

    const DATE_CONDITIONS = {
      today: "ts.available_date = CURRENT_DATE",
      "7d": "ts.available_date >= CURRENT_DATE - INTERVAL '7 days'",
      "30d": "ts.available_date >= CURRENT_DATE - INTERVAL '30 days'",
    } as const;

    const dateCondition = DATE_CONDITIONS[safeRange];

    const [trafficResults, warningsResults, complaintsResults] = await Promise.all([
      db.query(`
        SELECT b.branch_id AS "branchId", b.branch_name AS "branchName", COUNT(a.appointment_id) AS "patientCount"
        FROM branch b
        LEFT JOIN time_slot ts ON ts.branch_id = b.branch_id
        LEFT JOIN appointment a ON a.time_slot_id = ts.time_slot_id 
          AND a.status = 'Completed' AND ${dateCondition}
        WHERE b.is_active = true
        GROUP BY b.branch_id, b.branch_name
        ORDER BY "patientCount" DESC
      `),

      db.query(`
        SELECT b.branch_id, b.branch_name, b.manager_id,
          (
            SELECT COUNT(*) 
            FROM employee e 
            WHERE e.branch_id = b.branch_id 
              AND e.role = 'Doctor' AND e.is_active = true
          ) AS doctor_count,
          (
            SELECT COUNT(*) 
            FROM time_slot ts 
            WHERE ts.branch_id = b.branch_id 
              AND ts.available_date >= CURRENT_DATE AND ts.available_date <= CURRENT_DATE + INTERVAL '7 days'
          ) AS upcoming_slots_count
        FROM branch b
        WHERE b.is_active = true
      `),

      db.query(`
        SELECT 
          c.complaint_id AS "complaintId",
          c.branch_id AS "branchId",
          b.branch_name AS "branchName",
          COALESCE(u.full_name, 'Anonymous Patient') AS "patientName",
          c.subject,
          c.message,
          c.priority,
          TO_CHAR(c.created_at, 'Mon DD, YYYY') AS "createdAt"
        FROM branch_complaint c
        JOIN branch b ON b.branch_id = c.branch_id
        LEFT JOIN patient p ON p.patient_id = c.patient_id
        LEFT JOIN app_user u ON u.user_id = p.patient_id
        WHERE c.status = 'Pending'
        ORDER BY c.created_at DESC
        LIMIT 10
      `),
    ]);

    const rawTraffic = trafficResults.rows.map((row) => ({
      branchId: row.branchId,
      branchName: row.branchName,
      patientCount: Number(row.patientCount) || 0,
    }));

    const maxCount = Math.max(...rawTraffic.map((t) => t.patientCount), 1);
    const traffic: BranchTraffic[] = rawTraffic.map((t) => ({
      ...t,
      percentage: Math.round((t.patientCount / maxCount) * 100),
    }));

    const operationalWarnings: warnings[] = [];
    warningsResults.rows.forEach((b) => {
      if (!b.manager_id) {
        operationalWarnings.push({
          id: `${b.branch_id}-no-manager`,
          branchId: b.branch_id,
          branchName: b.branch_name,
          type: "no_manager",
          message: "No branch manager assigned",
          severity: "high",
        });
      }
      if (Number(b.doctor_count) === 0) {
        operationalWarnings.push({
          id: `${b.branch_id}-no-doctors`,
          branchId: b.branch_id,
          branchName: b.branch_name,
          type: "no_doctors",
          message: "0 active doctors assigned to this location",
          severity: "high",
        });
      }
      if (Number(b.upcoming_slots_count) === 0) {
        operationalWarnings.push({
          id: `${b.branch_id}-no-slots`,
          branchId: b.branch_id,
          branchName: b.branch_name,
          type: "no_slots",
          message: "No time slots open for the next 7 days",
          severity: "warning",
        });
      }
    });

    return {
      success: true,
      traffic,
      operationalWarnings,
      complaints: complaintsResults.rows as PatientComplaint[],
    };
  } 
  catch (error: any) {
    console.error("Failed to load branch overview analytics:", error);
    return { success: false, error: error.message };
  }
}

export async function complaints(complaintId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.role !== "receptionist")) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await db.query(
      `UPDATE branch_complaint 
       SET status = 'Resolved', resolved_at = CURRENT_TIMESTAMP 
       WHERE complaint_id = $1`,
      [complaintId]
    );

    if (result.rowCount === 0) {
      return { success: false, error: "Complaint not found" };
    }

    revalidatePath("/admin/branches");
    return { success: true };
  } 
  catch (error: any) {
    console.error("Failed to resolve complaint:", error);
    return { success: false, error: error.message };
  }
}

export async function updateBranchDetails(
  branchId: string,
  data: UpdateBranchDetailsInput
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

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
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

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
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

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
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

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
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

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

export async function getBranchDetails(branchId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.branchId !== branchId)) {
      return null;
    }

    const [branchResults, staffResults, availableStaffResults, treatmentsResults, visitsResults, invoicesResults, complaintsResults] = await Promise.all([

      //Branch Details
      db.query(`
        SELECT b.branch_id, b.branch_name, b.is_active, a.address_line1, a.city, a.province, u.full_name AS manager_name
        FROM branch b
        LEFT JOIN address a ON b.address_id = a.address_id
        LEFT JOIN app_user u ON b.manager_id = u.user_id
        WHERE b.branch_id = $1
      `, [branchId]),

      //Active Staff and Doctors
      db.query(`
        SELECT e.employee_id AS "employeeId", u.full_name AS name, e.role, spec.title AS specialization
        FROM employee e
        JOIN app_user u ON e.employee_id = u.user_id
        LEFT JOIN doctor d ON d.doctor_id = e.employee_id
        LEFT JOIN (
          SELECT DISTINCT ON (doctor_id) doctor_id, specialization_id
          FROM doctor_specialization
        ) ds ON ds.doctor_id = d.doctor_id
        LEFT JOIN specialization spec ON spec.specialization_id = ds.specialization_id
        WHERE e.branch_id = $1 AND e.is_active = true
        ORDER BY e.role ASC, u.full_name ASC
      `, [branchId]),

      //Unassigned Staff
      db.query(`
        SELECT e.employee_id AS "employeeId", u.full_name AS name, e.role
        FROM employee e
        JOIN app_user u ON e.employee_id = u.user_id
        WHERE e.is_active = true AND e.branch_id IS NULL
      `),

      //Treatments
      db.query(`
        SELECT t.treatment_service_code AS "treatmentId", t.treatment_name AS "treatmentName", t.category, t.base_price AS "basePrice",
        COALESCE(bt.is_available, false) AS "isOffered"
        FROM treatment_catalogue t
        LEFT JOIN branch_treatment bt ON bt.treatment_service_code = t.treatment_service_code AND bt.branch_id = $1
        ORDER BY t.category ASC, t.treatment_name ASC
      `, [branchId]),

      //Visits / Treatment History
      db.query(`
        SELECT 
          a.appointment_id AS "appointmentId",
          TO_CHAR(ts.available_date, 'YYYY-MM-DD') AS "visitDate",
          TO_CHAR(ts.start_time, 'HH24:MI') AS "startTime",
          a.status,
          a.reason_for_visit AS "reason",
          pat_u.full_name AS "patientName",
          doc_u.full_name AS "doctorName",
          inv.status AS "paymentStatus",
          inv.net_amount AS "amount"
        FROM appointment a
        JOIN time_slot ts ON ts.time_slot_id = a.time_slot_id
        JOIN patient p ON p.patient_id = a.patient_id
        JOIN app_user pat_u ON pat_u.user_id = p.patient_id
        JOIN employee doc_e ON doc_e.employee_id = ts.doctor_id
        JOIN app_user doc_u ON doc_u.user_id = doc_e.employee_id
        LEFT JOIN invoice inv ON inv.appointment_id = a.appointment_id
        WHERE ts.branch_id = $1
        ORDER BY ts.available_date DESC, ts.start_time DESC
        LIMIT 20
      `, [branchId]),

      //Invoices & Financials
      db.query(`
        SELECT 
          inv.invoice_id AS "invoiceId",
          TO_CHAR(inv.created_at, 'YYYY-MM-DD') AS "invoiceDate",
          inv.net_amount AS "netAmount",
          inv.paid_amount AS "paidAmount",
          inv.due_amount AS "dueAmount",
          inv.status,
          u.full_name AS "patientName"
        FROM invoice inv
        JOIN appointment a ON a.appointment_id = inv.appointment_id
        JOIN time_slot ts ON ts.time_slot_id = a.time_slot_id
        JOIN patient p ON p.patient_id = inv.patient_id
        JOIN app_user u ON u.user_id = p.patient_id
        WHERE ts.branch_id = $1
        ORDER BY inv.created_at DESC
        LIMIT 20
      `, [branchId]),

      //Complaints
      db.query(`
        SELECT 
          c.complaint_id AS "complaintId",
          COALESCE(u.full_name, 'Anonymous Patient') AS "patientName",
          c.subject,
          c.message,
          c.priority,
          c.status,
          TO_CHAR(c.created_at, 'Mon DD, YYYY') AS "createdAt"
        FROM branch_complaint c
        LEFT JOIN patient p ON p.patient_id = c.patient_id
        LEFT JOIN app_user u ON u.user_id = p.patient_id
        WHERE c.branch_id = $1
        ORDER BY c.created_at DESC
      `, [branchId]),
    ]);

    if (branchResults.rows.length === 0) return null;

    const branch = branchResults.rows[0];
    const staff = staffResults.rows;
    const invoices = invoicesResults.rows;

    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);
    const totalDue = invoices.reduce((sum, inv) => sum + Number(inv.dueAmount || 0), 0);

    return {
      branch: {
        branch_id: branch.branch_id,
        branch_name: branch.branch_name,
        is_active: branch.is_active,
        address_line1: branch.address_line1,
        city: branch.city,
        province: branch.province,
        manager_name: branch.manager_name || "Unassigned",
      },
      staff,
      available_staff: availableStaffResults.rows,
      treatments: treatmentsResults.rows,
      visits: visitsResults.rows,
      invoices,
      complaints: complaintsResults.rows,
      metrics: {
        doctorCount: staff.filter((s: any) => s.role === "Doctor").length,
        staffCount: staff.filter((s: any) => s.role !== "Doctor").length,
        totalRevenue,
        totalDue,
        pendingComplaints: complaintsResults.rows.filter((c: any) => c.status === "Pending").length,
      }
    };
  } catch (error: any) {
    console.error("getBranchCompleteDetails error:", error);
    return null;
  }
}

export async function branchTreatment(branchId: string, treatmentId: string, isAvailable: boolean) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    await db.query(`
      INSERT INTO branch_treatment (branch_id, treatment_service_code, is_available)
      VALUES ($1, $2, $3)
      ON CONFLICT (branch_id, treatment_service_code)
      DO UPDATE SET is_available = $3
    `, [branchId, treatmentId, isAvailable]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
