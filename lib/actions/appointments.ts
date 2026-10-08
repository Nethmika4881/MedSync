"use server";
// lib/actions/appointments.ts
// All appointment-related raw SQL server actions.
// Every query is parameterized — NO string interpolation.

import pool from "@/lib/db";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getAppointments(branchId?: string): Promise<Appointment[]> {
  const query = branchId
    ? {
        text: `
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
          WHERE a.branch_id = $1
          ORDER BY a.appointment_date_time DESC
        `,
        values: [branchId],
      }
    : {
        text: `
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
        `,
        values: [],
      };

  const { rows } = await pool.query(query);
  return rows as Appointment[];
}

export async function getAppointmentsByDoctor(doctorId: string): Promise<Appointment[]> {
  const { rows } = await pool.query(
    `SELECT
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
     WHERE a.doctor_id = $1
     ORDER BY a.appointment_date_time DESC`,
    [doctorId]
  );
  return rows as Appointment[];
}

export async function getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
  const { rows } = await pool.query(
    `SELECT
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
     WHERE a.patient_id = $1
     ORDER BY a.appointment_date_time DESC`,
    [patientId]
  );
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
  const { rows } = await pool.query(
    `INSERT INTO appointment
       (patient_id, doctor_id, branch_id, appointment_date_time,
        duration_minutes, visit_type, status, fee, notes)
     VALUES
       ($1, $2, $3, $4, $5, $6, 'Pending', $7, $8)
     RETURNING appointment_id AS "appointmentId"`,
    [
      data.patientId,
      data.doctorId,
      data.branchId,
      data.dateTime,
      data.duration,
      data.visitType,
      data.fee,
      data.notes ?? null,
    ]
  );
  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  return rows[0] as { appointmentId: string };
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
  cancelReason?: string
): Promise<void> {
  await pool.query(
    `UPDATE appointment
     SET status        = $1,
         cancel_reason = $2,
         updated_at    = NOW()
     WHERE appointment_id = $3`,
    [status, cancelReason ?? null, appointmentId]
  );
  revalidatePath("/appointments");
  revalidatePath("/dashboard");
}

export async function checkInAppointment(appointmentId: string): Promise<void> {
  await pool.query(
    `UPDATE appointment
     SET status     = 'Checked-in',
         updated_at = NOW()
     WHERE appointment_id = $1`,
    [appointmentId]
  );
  revalidatePath("/appointments");
}

export async function bookAppointment(data: {
  time_slot_id: string;
  patient_id: string;
  created_by: string;
  source?: string;
  reason_for_visit?: string;
}) {
  try {
    const {
      time_slot_id,
      patient_id,
      created_by,
      source = "Booked",
      reason_for_visit = "",
    } = data;

    if (!time_slot_id || !patient_id || !created_by) {
      return { success: false, error: "Missing required fields" };
    }

    const query = `
      SELECT * FROM book_appointment(
        $1::UUID, 
        $2::UUID, 
        $3::UUID, 
        $4::appointment_source_enum, 
        $5::VARCHAR
      );
    `;

    const values = [time_slot_id, patient_id, created_by, source, reason_for_visit];
    const { rows } = await pool.query(query, values);

    revalidatePath("/appointments");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Appointment successfully booked",
      data: {
        appointmentId: rows[0].new_appointment_id,
        queueNumber: rows[0].assigned_queue_number,
      },
    };
  } catch (error: any) {
    console.error("Booking procedure error:", error);

    if (error.message?.includes("Time Slot not found")) {
      return { success: false, error: "Selected time slot does not exist." };
    }
    if (error.message?.includes("Time Slot is full")) {
      return { success: false, error: "Sorry, this time slot is fully booked." };
    }

    return { success: false, error: error.message || "An unexpected booking error occurred." };
  }
}