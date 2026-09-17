"use server";
// lib/actions/appointments.ts
// All appointment-related raw SQL server actions.
// Every query is parameterized — NO string interpolation.

import { sql } from "@/lib/db";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getAppointments(branchId?: string): Promise<Appointment[]> {
  const rows = branchId
    ? await sql`
        SELECT
          a.appointment_id        AS "appointmentId",
          a.patient_id            AS "patientId",
          p.full_name             AS "patientName",
          a.doctor_id             AS "doctorId",
          CONCAT(e.first_name, ' ', e.last_name) AS "doctorName",
          a.branch_id             AS "branchId",
          a.appointment_date_time AS "dateTime",
          a.duration_minutes      AS "duration",
          a.visit_type            AS "visitType",
          a.status                AS "status",
          a.notes                 AS "notes",
          a.cancel_reason         AS "cancelReason",
          a.payment_status        AS "paymentStatus",
          a.fee                   AS "fee"
        FROM appointment a
        JOIN patient p  ON p.patient_id  = a.patient_id
        JOIN doctor  d  ON d.doctor_id   = a.doctor_id
        JOIN employee e ON e.employee_id = a.doctor_id
        WHERE a.branch_id = ${branchId}
        ORDER BY a.appointment_date_time DESC
      `
    : await sql`
        SELECT
          a.appointment_id        AS "appointmentId",
          a.patient_id            AS "patientId",
          p.full_name             AS "patientName",
          a.doctor_id             AS "doctorId",
          CONCAT(e.first_name, ' ', e.last_name) AS "doctorName",
          a.branch_id             AS "branchId",
          a.appointment_date_time AS "dateTime",
          a.duration_minutes      AS "duration",
          a.visit_type            AS "visitType",
          a.status                AS "status",
          a.notes                 AS "notes",
          a.cancel_reason         AS "cancelReason",
          a.payment_status        AS "paymentStatus",
          a.fee                   AS "fee"
        FROM appointment a
        JOIN patient p  ON p.patient_id  = a.patient_id
        JOIN doctor  d  ON d.doctor_id   = a.doctor_id
        JOIN employee e ON e.employee_id = a.doctor_id
        ORDER BY a.appointment_date_time DESC
      `;
  return rows as Appointment[];
}

export async function getAppointmentsByDoctor(doctorId: string): Promise<Appointment[]> {
  const rows = await sql`
    SELECT
      a.appointment_id        AS "appointmentId",
      a.patient_id            AS "patientId",
      p.full_name             AS "patientName",
      a.doctor_id             AS "doctorId",
      CONCAT(e.first_name, ' ', e.last_name) AS "doctorName",
      a.branch_id             AS "branchId",
      a.appointment_date_time AS "dateTime",
      a.duration_minutes      AS "duration",
      a.visit_type            AS "visitType",
      a.status                AS "status",
      a.notes                 AS "notes",
      a.fee                   AS "fee"
    FROM appointment a
    JOIN patient  p ON p.patient_id  = a.patient_id
    JOIN employee e ON e.employee_id = a.doctor_id
    WHERE a.doctor_id = ${doctorId}
    ORDER BY a.appointment_date_time DESC
  `;
  return rows as Appointment[];
}

export async function getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
  const rows = await sql`
    SELECT
      a.appointment_id        AS "appointmentId",
      a.patient_id            AS "patientId",
      p.full_name             AS "patientName",
      a.doctor_id             AS "doctorId",
      CONCAT(e.first_name, ' ', e.last_name) AS "doctorName",
      a.branch_id             AS "branchId",
      a.appointment_date_time AS "dateTime",
      a.duration_minutes      AS "duration",
      a.visit_type            AS "visitType",
      a.status                AS "status",
      a.notes                 AS "notes",
      a.payment_status        AS "paymentStatus",
      a.fee                   AS "fee"
    FROM appointment a
    JOIN patient  p ON p.patient_id  = a.patient_id
    JOIN employee e ON e.employee_id = a.doctor_id
    WHERE a.patient_id = ${patientId}
    ORDER BY a.appointment_date_time DESC
  `;
  return rows as Appointment[];
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createAppointment(data: {
  patientId: string;
  doctorId: string;
  branchId: string;
  dateTime: string;
  duration: number;
  visitType: string;
  fee: number;
  notes?: string;
}): Promise<{ appointmentId: string }> {
  const rows = await sql`
    INSERT INTO appointment
      (patient_id, doctor_id, branch_id, appointment_date_time,
       duration_minutes, visit_type, status, fee, notes)
    VALUES
      (${data.patientId}, ${data.doctorId}, ${data.branchId},
       ${data.dateTime}, ${data.duration}, ${data.visitType},
       'Pending', ${data.fee}, ${data.notes ?? null})
    RETURNING appointment_id AS "appointmentId"
  `;
  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  return rows[0] as { appointmentId: string };
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
  cancelReason?: string
): Promise<void> {
  await sql`
    UPDATE appointment
    SET status        = ${status},
        cancel_reason = ${cancelReason ?? null},
        updated_at    = NOW()
    WHERE appointment_id = ${appointmentId}
  `;
  revalidatePath("/appointments");
  revalidatePath("/dashboard");
}

export async function checkInAppointment(appointmentId: string): Promise<void> {
  await sql`
    UPDATE appointment
    SET status     = 'Checked-in',
        updated_at = NOW()
    WHERE appointment_id = ${appointmentId}
  `;
  revalidatePath("/appointments");
}
