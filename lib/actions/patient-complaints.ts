"use server";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { revalidatePath } from "next/cache";

export interface SubmitComplaintInput {
  branchId: string;
  subject: string;
  message: string;
  priority?: "Low" | "Normal" | "High" | "Urgent";
}

export interface PatientComplaintItem {
  complaintId: string;
  branchName: string;
  subject: string;
  message: string;
  priority: string;
  status: "Pending" | "Reviewed" | "Resolved";
  createdAt: string;
}

export async function getBranches() {
  try {
    const { rows } = await db.query(
      `SELECT branch_id AS "branchId", branch_name AS "branchName" 
       FROM branch 
       WHERE is_active = true 
       ORDER BY branch_name ASC`
    );
    return { success: true, branches: rows };
  } 
  catch (error: any) {
    console.error("Failed to load branches:", error);
    return { success: false, branches: [] };
  }
}

export async function submitComplaint(data: SubmitComplaintInput) {
  const user = await getCurrentUser();
  if (!user || user.role !== "patient") {
    return { success: false, error: "Unauthorized. Please log in as a patient." };
  }

  const { branchId, subject, message, priority = "Normal" } = data;

  if (!branchId || !subject?.trim() || !message?.trim()) {
    return { success: false, error: "Please provide a branch, subject, and detailed message." };
  }

  try {
    await db.query(
      `INSERT INTO branch_complaint (branch_id, patient_id, subject, message, priority, status)
       VALUES ($1, $2, $3, $4, $5, 'Pending')`,
      [branchId, user.userId, subject.trim(), message.trim(), priority]
    );

    revalidatePath("/admin/branches");
    revalidatePath(`/admin/branches/${branchId}`);
    revalidatePath("/patient/complaints");

    return { success: true, message: "Your complaint has been submitted to clinic administration." };
  } 
  catch (error: any) {
    console.error("Failed to submit complaint:", error);
    return { success: false, error: error.message || "Failed to submit complaint." };
  }
}

export async function getMyComplaints(): Promise<PatientComplaintItem[]> {
  const user = await getCurrentUser();
  if (!user || user.role !== "patient") {
    return [];
  }

  try {
    const { rows } = await db.query<PatientComplaintItem>(
      `SELECT c.complaint_id AS "complaintId", b.branch_name AS "branchName", c.subject, c.message, c.priority, c.status,
        TO_CHAR(c.created_at, 'YYYY-MM-DD HH24:MI') AS "createdAt"
       FROM branch_complaint c
       JOIN branch b ON b.branch_id = c.branch_id
       WHERE c.patient_id = $1
       ORDER BY c.created_at DESC`,
      [user.userId]
    );

    return rows;
  } 
  catch (error) {
    console.error("Failed to fetch patient complaints:", error);
    return [];
  }
}