"use server";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { z } from "zod";

export interface AdminBranchOption {
  branchId: string;
  branchName: string;
}

export interface AdminPatientSummary {
  patientId: string;
  fullName: string;
  dob: string;
  gender: string;
  bloodGroup: string | null;
  phone: string | null;
  email: string;
  nic: string;
  city: string | null;
  branchId: string;
  branchName: string;
  isActive: boolean;
  registeredAt: string;
}

export interface AdminPatientDetails extends AdminPatientSummary {
  addressLine1: string | null;
  addressLine2: string | null;
  province: string | null;
  postalCode: string | null;
  country: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
}

export interface AdminAppointmentSummary {
  appointmentId: string;
  appointmentDate: string;
  startTime: string;
  status: string;
  doctorName: string;
  branchName: string;
}

export interface AdminBillingSummary {
  invoiceCount: number;
  totalBilled: number;
  totalPaid: number;
  totalDue: number;
}

export interface AdminInvoiceSummary {
  invoiceId: string;
  invoiceDate: string;
  status: string;
  netAmount: number;
  paidAmount: number;
  dueAmount: number;
}

export interface AdminPatientOverview {
  patient: AdminPatientDetails;
  appointments: AdminAppointmentSummary[];
  billing: AdminBillingSummary;
  invoices: AdminInvoiceSummary[];
}

export interface AdminPatientFilters {
  branchId?: string;
  search?: string;
}

const filtersSchema = z.object({
  branchId: z.string().uuid().optional(),
  search: z.string().trim().max(100).optional(),
});

const patientIdSchema = z.string().uuid();

async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function getAdminBranchOptions(): Promise<AdminBranchOption[]> {
  await requireAdmin();

  const { rows } = await db.query(
    `SELECT
       branch_id AS "branchId",
       branch_name AS "branchName"
     FROM branch
     WHERE is_active = TRUE
     ORDER BY branch_name ASC`,
  );

  return rows as AdminBranchOption[];
}

export async function getAdminPatients(
  filters: AdminPatientFilters = {},
): Promise<AdminPatientSummary[]> {
  await requireAdmin();

  const parsed = filtersSchema.safeParse(filters);

  if (!parsed.success) {
    throw new Error("Invalid patient filters");
  }

  const branchId = parsed.data.branchId ?? null;
  const search = parsed.data.search?.trim() || null;
  const searchPattern = search ? `%${search}%` : null;

  const { rows } = await db.query(
    `SELECT
       p.patient_id AS "patientId",
       u.full_name AS "fullName",
       u.dob::text AS "dob",
       u.gender::text AS "gender",
       p.blood_group AS "bloodGroup",
       phone.number AS "phone",
       u.email,
       u.nic,
       addr.city,
       p.registered_branch_id AS "branchId",
       b.branch_name AS "branchName",
       u.is_active AS "isActive",
       p.created_at::text AS "registeredAt"
     FROM patient p
     JOIN app_user u
       ON u.user_id = p.patient_id
     JOIN branch b
       ON b.branch_id = p.registered_branch_id
     LEFT JOIN address addr
       ON addr.address_id = u.address_id
     LEFT JOIN LATERAL (
       SELECT cn.number
       FROM contact_number cn
       WHERE cn.contact_id = u.contact_id
       ORDER BY cn.is_primary DESC, cn.contact_number_id ASC
       LIMIT 1
     ) phone ON TRUE
     WHERE ($1::uuid IS NULL OR p.registered_branch_id = $1::uuid)
       AND (
         $2::text IS NULL
         OR u.full_name ILIKE $2
         OR u.nic ILIKE $2
         OR COALESCE(phone.number, '') ILIKE $2
         OR p.patient_id::text ILIKE $2
       )
     ORDER BY u.full_name ASC
     LIMIT 100`,
    [branchId, searchPattern],
  );

  return rows as AdminPatientSummary[];
}

export async function getAdminPatientOverview(
  patientId: string,
): Promise<AdminPatientOverview | null> {
  const user = await requireAdmin();

  const parsedPatientId = patientIdSchema.safeParse(patientId);

  if (!parsedPatientId.success) {
    return null;
  }

  const validPatientId = parsedPatientId.data;
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const patientResult = await client.query(
      `SELECT
         p.patient_id AS "patientId",
         u.full_name AS "fullName",
         u.dob::text AS "dob",
         u.gender::text AS "gender",
         p.blood_group AS "bloodGroup",
         phone.number AS "phone",
         u.email,
         u.nic,
         addr.city,
         addr.address_line1 AS "addressLine1",
         addr.address_line2 AS "addressLine2",
         addr.province,
         addr.postal_code AS "postalCode",
         addr.country,
         p.registered_branch_id AS "branchId",
         b.branch_name AS "branchName",
         u.is_active AS "isActive",
         p.created_at::text AS "registeredAt",
         p.emergency_contact_name AS "emergencyContactName",
         p.emergency_contact_phone AS "emergencyContactPhone",
         p.emergency_contact_relationship AS "emergencyContactRelationship"
       FROM patient p
       JOIN app_user u
         ON u.user_id = p.patient_id
       JOIN branch b
         ON b.branch_id = p.registered_branch_id
       LEFT JOIN address addr
         ON addr.address_id = u.address_id
       LEFT JOIN LATERAL (
         SELECT cn.number
         FROM contact_number cn
         WHERE cn.contact_id = u.contact_id
         ORDER BY cn.is_primary DESC, cn.contact_number_id ASC
         LIMIT 1
       ) phone ON TRUE
       WHERE p.patient_id = $1::uuid`,
      [validPatientId],
    );

    if (patientResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    const appointmentsResult = await client.query(
      `SELECT
         a.appointment_id AS "appointmentId",
         ts.available_date::text AS "appointmentDate",
         TO_CHAR(ts.start_time, 'HH12:MI AM') AS "startTime",
         a.status::text AS "status",
         doctor_user.full_name AS "doctorName",
         b.branch_name AS "branchName"
       FROM appointment a
       JOIN time_slot ts
         ON ts.time_slot_id = a.time_slot_id
       JOIN doctor d
         ON d.doctor_id = ts.doctor_id
       JOIN app_user doctor_user
         ON doctor_user.user_id = d.doctor_id
       JOIN branch b
         ON b.branch_id = ts.branch_id
       WHERE a.patient_id = $1::uuid
       ORDER BY ts.available_date DESC, ts.start_time DESC
       LIMIT 10`,
      [validPatientId],
    );

    const billingResult = await client.query(
      `SELECT
         COUNT(*)::int AS "invoiceCount",
         COALESCE(SUM(net_amount), 0)::float AS "totalBilled",
         COALESCE(SUM(paid_amount), 0)::float AS "totalPaid",
         COALESCE(SUM(due_amount), 0)::float AS "totalDue"
       FROM invoice
       WHERE patient_id = $1::uuid`,
      [validPatientId],
    );

    const invoicesResult = await client.query(
      `SELECT
         invoice_id AS "invoiceId",
         TO_CHAR(invoice_date, 'YYYY-MM-DD HH12:MI AM') AS "invoiceDate",
         status::text AS "status",
         net_amount::float AS "netAmount",
         paid_amount::float AS "paidAmount",
         due_amount::float AS "dueAmount"
       FROM invoice
       WHERE patient_id = $1::uuid
       ORDER BY invoice_date DESC
       LIMIT 10`,
      [validPatientId],
    );

    /*
     * Record access before returning patient information.
     * Clinical notes, diagnoses and prescriptions are deliberately not queried.
     */
    await client.query(
      `INSERT INTO admin_patient_access_log (
         admin_id,
         patient_id,
         access_reason
       )
       VALUES ($1::uuid, $2::uuid, $3)`,
      [user.userId, validPatientId, "Viewed admin patient overview"],
    );

    await client.query("COMMIT");

    return {
      patient: patientResult.rows[0] as AdminPatientDetails,
      appointments: appointmentsResult.rows as AdminAppointmentSummary[],
      billing: billingResult.rows[0] as AdminBillingSummary,
      invoices: invoicesResult.rows as AdminInvoiceSummary[],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[getAdminPatientOverview] Failed to load patient:", error);

    throw new Error("Failed to load patient information");
  } finally {
    client.release();
  }
}
