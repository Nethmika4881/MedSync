"use server";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/getcurrentuser"; 
import { revalidatePath } from "next/cache";

export interface FrontDeskAppointment {
  appointmentId: string;
  queueNumber: number;
  patientId: string;
  patientName: string;
  doctorName: string;
  doctorId: string;
  availableDate: string;
  startTime: string;
  endTime: string;
  status: string;
  source: string;
  reasonForVisit: string | null;
}

export interface FrontDeskPatientSummary {
  patientId: string;
  fullName: string;
  nic?: string;
  phone?: string;
}

export interface DoctorDirectoryItem {
  doctorId: string;
  name: string;
  specialization: string;
  consultationFee: number;
}

export interface BookableSlot {
  timeSlotId: string;
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  remainingCapacity: number;
}

export async function getBranchAppointments(
  branchId?: string,
  dateFilter?: string
): Promise<FrontDeskAppointment[]> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "receptionist" && user.role !== "admin" && user.role !== "doctor")) return [];
  const effectiveBranchId = user.role === "admin" ? (branchId || user.branchId) : user.branchId;

  const query = `
    SELECT
      a.appointment_id AS "appointmentId",
      a.queue_number AS "queueNumber",
      p.patient_id AS "patientId",
      u.full_name AS "patientName",
      CONCAT('Dr. ', doc_user.full_name) AS "doctorName",
      ts.doctor_id AS "doctorId",
      ts.available_date::text AS "availableDate",
      TO_CHAR(ts.start_time, 'HH12:MI AM') AS "startTime",
      TO_CHAR(ts.end_time, 'HH12:MI AM') AS "endTime",
      a.status::text AS "status",
      a.source::text AS "source",
      a.reason_for_visit AS "reasonForVisit"
    FROM appointment a
    JOIN time_slot ts ON ts.time_slot_id = a.time_slot_id
    JOIN patient p ON p.patient_id = a.patient_id
    JOIN app_user u ON u.user_id = p.patient_id
    JOIN employee doc_emp ON doc_emp.employee_id = ts.doctor_id
    JOIN app_user doc_user ON doc_user.user_id = doc_emp.employee_id
    WHERE ($1::uuid IS NULL OR ts.branch_id = $1::uuid)
      AND ($2::date IS NULL OR ts.available_date = $2::date)
    ORDER BY ts.available_date DESC, a.queue_number ASC
  `;

  const { rows } = await db.query(query, [effectiveBranchId || null, dateFilter || null]);
  return rows as FrontDeskAppointment[];
}

export async function checkInPatientAppointment(appointmentId: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "receptionist" && user.role !== "admin")) {
    return { success: false, error: "Unauthorized" };
  }

  const res = await db.query(
    `UPDATE appointment
     SET status = 'CheckedIn', updated_at = NOW()
     WHERE appointment_id = $1::uuid
     RETURNING appointment_id, queue_number`,
    [appointmentId]
  );

  if (res.rowCount === 0) return { success: false, error: "Appointment not found." };

  revalidatePath("/front-desk/appointments");
  return { success: true, queueNumber: res.rows[0].queue_number, message: `Checked in! Token #${res.rows[0].queue_number}` };
}

export async function cancelAppointmentByReception(appointmentId: string, reason: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "receptionist" && user.role !== "admin")) {
    return { success: false, error: "Unauthorized" };
  }

  const res = await db.query(
    `UPDATE appointment
     SET status = 'Cancelled', cancelled_reason = $1, updated_at = NOW()
     WHERE appointment_id = $2::uuid`,
    [reason, appointmentId]
  );

  if (res.rowCount === 0) return { success: false, error: "Appointment not found." };
  revalidatePath("/front-desk/appointments");
  return { success: true, message: "Appointment cancelled." };
}

export async function getBranchPatients(branchId?: string): Promise<FrontDeskPatientSummary[]> {
  const query = `
    SELECT p.patient_id AS "patientId", u.full_name AS "fullName", p.emergency_contact_phone AS "phone"
    FROM patient p
    JOIN app_user u ON p.patient_id = u.user_id
    WHERE ($1::uuid IS NULL OR p.registered_branch_id = $1::uuid)
  `;
  const { rows } = await db.query(query, [branchId || null]);
  return rows;
}

export async function getDoctorDirectory(): Promise<DoctorDirectoryItem[]> {
  const query = `
    SELECT 
      d.doctor_id AS "doctorId",
      CONCAT(u.full_name) AS "name",
      d.consultation_fee AS "consultationFee",
      COALESCE(STRING_AGG(s.title, ', '), 'General') AS "specialization"
    FROM doctor d
    JOIN employee e ON d.doctor_id = e.employee_id
    JOIN app_user u ON e.employee_id = u.user_id
    LEFT JOIN doctor_specialization ds ON d.doctor_id = ds.doctor_id
    LEFT JOIN specialization s ON ds.specialization_id = s.specialization_id
    WHERE d.is_available = TRUE
    GROUP BY d.doctor_id, u.full_name, d.consultation_fee
  `;
  const { rows } = await db.query(query);
  return rows;
}

export async function getDoctorBookableSlots(doctorId: string): Promise<BookableSlot[]> {
  const query = `
    SELECT 
      ts.time_slot_id AS "timeSlotId",
      ts.available_date::text AS "date",
      TO_CHAR(ts.start_time, 'HH12:MI AM') AS "startTime",
      TO_CHAR(ts.end_time, 'HH12:MI AM') AS "endTime",
      ts.max_tickets AS "maxCapacity",
      (ts.max_tickets - (SELECT COUNT(*) FROM appointment WHERE time_slot_id = ts.time_slot_id AND status != 'Cancelled'))::int AS "remainingCapacity"
    FROM time_slot ts
    WHERE ts.doctor_id = $1::uuid AND ts.available_date >= CURRENT_DATE
    ORDER BY ts.available_date ASC, ts.start_time ASC
  `;
  const { rows } = await db.query(query, [doctorId]);
  return rows.filter((r) => r.remainingCapacity > 0);
}

export async function bookAppointment(data: {
  time_slot_id: string;
  patient_id: string;
  created_by: string;
  source: string;
  reason_for_visit: string;
}) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const qRes = await client.query(
      `SELECT COALESCE(MAX(queue_number), 0) + 1 AS next_q FROM appointment WHERE time_slot_id = $1::uuid`,
      [data.time_slot_id]
    );
    const nextQueue = qRes.rows[0].next_q;

    const insertRes = await client.query(
      `INSERT INTO appointment (time_slot_id, patient_id, queue_number, created_by, status, source, reason_for_visit)
       VALUES ($1, $2, $3, $4, 'Scheduled', $5, $6)
       RETURNING appointment_id, queue_number`,
      [data.time_slot_id, data.patient_id, nextQueue, data.created_by, data.source, data.reason_for_visit]
    );

    await client.query("COMMIT");
    revalidatePath("/front-desk/appointments");
    return { success: true, data: { appointmentId: insertRes.rows[0].appointment_id, queueNumber: insertRes.rows[0].queue_number } };
  } catch (err: any) {
    await client.query("ROLLBACK");
    return { success: false, error: err.message };
  } finally {
    client.release();
  }
}