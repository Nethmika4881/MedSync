"use server";
// lib/actions/patient-appointments.ts
// Patient appointment history and transactional rescheduling server actions.
// Derives patientId strictly from authenticated session.
// Enforces 24-hour rescheduling rule server-side using PostgreSQL time.

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { revalidatePath } from "next/cache";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface PatientAppointmentHistoryItem {
  appointmentId: string;
  timeSlotId: string;
  patientId: string;
  queueNumber: number;
  status: string;
  source: string;
  reasonForVisit: string | null;
  notes: string | null;
  cancelledReason: string | null;
  createdAt: string;
  updatedAt: string | null;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorSpecializations?: string[];
  consultationFee: number;
  branchId: string;
  branchName: string;
  date: string;
  startTime: string;
  endTime: string;
  isReschedulable: boolean;
  scheduledStartTimestamp: string;
}

export type RescheduleErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "INVALID_INPUT"
  | "APPOINTMENT_NOT_FOUND"
  | "NOT_ELIGIBLE"
  | "TOO_LATE"
  | "SAME_SLOT"
  | "SLOT_NOT_FOUND"
  | "SLOT_IN_PAST"
  | "DOCTOR_MISMATCH"
  | "NO_CAPACITY"
  | "CONCURRENT_CONFLICT"
  | "DATABASE_ERROR";

export type RescheduleAppointmentResult =
  | {
    success: true;
    data: {
      appointmentId: string;
      queueNumber: number;
      newTimeSlotId: string;
      date: string;
      startTime: string;
      endTime: string;
    };
  }
  | {
    success: false;
    code: RescheduleErrorCode;
    error: string;
  };

/**
 * Returns appointment history for the authenticated patient.
 * Derives patient ID server-side from session.
 */
export async function getPatientAppointments(): Promise<PatientAppointmentHistoryItem[]> {
  const user = await getCurrentUser();
  if (!user || user.role !== "patient") {
    return [];
  }

  const patientId = user.userId;

  try {
    const { rows } = await db.query(
      `SELECT
         a.appointment_id                         AS "appointmentId",
         a.time_slot_id                           AS "timeSlotId",
         a.patient_id                             AS "patientId",
         a.queue_number                           AS "queueNumber",
         a.status                                 AS "status",
         a.source                                 AS "source",
         a.reason_for_visit                       AS "reasonForVisit",
         a.notes                                  AS "notes",
         a.cancelled_reason                       AS "cancelledReason",
         TO_CHAR(a.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt",
         TO_CHAR(a.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "updatedAt",
         s.doctor_id                              AS "doctorId",
         u.full_name                              AS "doctorName",
         COALESCE(
           (
             SELECT ARRAY_AGG(s.title ORDER BY s.title)
             FROM doctor_specialization ds
             JOIN specialization s ON s.specialization_id = ds.specialization_id
             WHERE ds.doctor_id = d.doctor_id
           ),
           ARRAY[]::text[]
         )                                        AS "doctorSpecializations",
         d.consultation_fee                       AS "consultationFee",
         s.branch_id                              AS "branchId",
         b.branch_name                            AS "branchName",
         TO_CHAR(s.available_date, 'YYYY-MM-DD')  AS "date",
         s.start_time::text                       AS "startTime",
         s.end_time::text                         AS "endTime",
         -- 24-hour rescheduling eligibility computed authoritatively in PostgreSQL:
         -- Appointment must be 'Scheduled' and start time must be >= 24h from database NOW()
         CASE
           WHEN a.status = 'Scheduled'
            AND (s.available_date + s.start_time) >= (NOW() + INTERVAL '24 hours')
           THEN true
           ELSE false
         END AS "isReschedulable",
         TO_CHAR(s.available_date + s.start_time, 'YYYY-MM-DD"T"HH24:MI:SS') AS "scheduledStartTimestamp"
       FROM appointment a
       JOIN time_slot s ON s.time_slot_id = a.time_slot_id
       JOIN doctor d ON d.doctor_id = s.doctor_id
       JOIN employee e ON e.employee_id = d.doctor_id
       JOIN app_user u ON u.user_id = e.employee_id
       JOIN branch b ON b.branch_id = s.branch_id
       WHERE a.patient_id = $1
       ORDER BY s.available_date DESC, s.start_time DESC`,
      [patientId]
    );

    return rows.map((r) => {
      const doctorSpecializations: string[] = Array.isArray(r.doctorSpecializations)
        ? r.doctorSpecializations
        : [];
      const doctorSpecialization =
        doctorSpecializations.length > 0
          ? doctorSpecializations.join(", ")
          : "General Practice";

      return {
        ...r,
        doctorSpecialization,
        doctorSpecializations,
      };
    });
  } catch (err) {
    console.error("[getPatientAppointments] Failed to query patient appointments:", err);
    return [];
  }
}

/**
 * Reschedules a patient's appointment to a new time slot inside a transaction.
 * Enforces the 24-hour cutoff rule, capacity checks, and row-level locking.
 */
export async function reschedulePatientAppointment(input: {
  appointmentId: string;
  newTimeSlotId: string;
}): Promise<RescheduleAppointmentResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      code: "UNAUTHENTICATED",
      error: "Authentication required to reschedule appointments.",
    };
  }

  if (user.role !== "patient") {
    return {
      success: false,
      code: "FORBIDDEN",
      error: "Only patients can reschedule appointments.",
    };
  }

  const patientId = user.userId;

  if (!UUID_REGEX.test(input.appointmentId) || !UUID_REGEX.test(input.newTimeSlotId)) {
    return {
      success: false,
      code: "INVALID_INPUT",
      error: "Invalid appointment or time slot identifier format.",
    };
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // 1. Lock and verify existing appointment ownership and 24-hour eligibility
    const apptRes = await client.query(
      `SELECT
         a.appointment_id,
         a.time_slot_id,
         a.patient_id,
         a.status,
         s.doctor_id,
         s.branch_id,
         s.available_date,
         s.start_time,
         ((s.available_date + s.start_time) >= (NOW() + INTERVAL '24 hours')) AS "has24hRemaining"
       FROM appointment a
       JOIN time_slot s ON s.time_slot_id = a.time_slot_id
       WHERE a.appointment_id = $1 AND a.patient_id = $2
       FOR UPDATE OF a`,
      [input.appointmentId, patientId]
    );

    if ((apptRes.rowCount ?? 0) === 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        code: "APPOINTMENT_NOT_FOUND",
        error: "Appointment not found or does not belong to your account.",
      };
    }

    const currentAppt = apptRes.rows[0];

    // Only 'Scheduled' appointments can be moved
    if (currentAppt.status !== "Scheduled") {
      await client.query("ROLLBACK");
      return {
        success: false,
        code: "NOT_ELIGIBLE",
        error: `Cannot reschedule appointment with status "${currentAppt.status}".`,
      };
    }

    // Server-side enforcement of 24-hour rule
    if (!currentAppt.has24hRemaining) {
      await client.query("ROLLBACK");
      return {
        success: false,
        code: "TOO_LATE",
        error: "Appointments can only be rescheduled at least 24 hours in advance.",
      };
    }

    // Must be a different slot
    if (currentAppt.time_slot_id === input.newTimeSlotId) {
      await client.query("ROLLBACK");
      return {
        success: false,
        code: "SAME_SLOT",
        error: "Selected slot is the same as your current appointment slot.",
      };
    }

    // 2. Lock and verify the destination time slot
    const slotRes = await client.query(
      `SELECT
         s.time_slot_id,
         s.doctor_id,
         s.branch_id,
         TO_CHAR(s.available_date, 'YYYY-MM-DD') AS available_date,
         s.start_time::text AS start_time,
         s.end_time::text AS end_time,
         s.max_tickets,
         ((s.available_date + s.start_time) > NOW()) AS "isFuture"
       FROM time_slot s
       WHERE s.time_slot_id = $1
       FOR UPDATE`,
      [input.newTimeSlotId]
    );

    if ((slotRes.rowCount ?? 0) === 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        code: "SLOT_NOT_FOUND",
        error: "Selected time slot does not exist.",
      };
    }

    const targetSlot = slotRes.rows[0];

    if (!targetSlot.isFuture) {
      await client.query("ROLLBACK");
      return {
        success: false,
        code: "SLOT_IN_PAST",
        error: "Cannot reschedule to a past or expired session.",
      };
    }

    // Must be with the same doctor
    if (targetSlot.doctor_id !== currentAppt.doctor_id) {
      await client.query("ROLLBACK");
      return {
        success: false,
        code: "DOCTOR_MISMATCH",
        error: "Rescheduled appointment must be with the same doctor.",
      };
    }

    // 3. Check capacity on destination slot
    const countRes = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM appointment
       WHERE time_slot_id = $1
         AND status NOT IN ('Cancelled')`,
      [input.newTimeSlotId]
    );

    const targetActiveCount = countRes.rows[0].count;
    if (targetActiveCount >= targetSlot.max_tickets) {
      await client.query("ROLLBACK");
      return {
        success: false,
        code: "NO_CAPACITY",
        error: "The chosen time slot has reached full capacity. Please choose another slot.",
      };
    }

    // 4. Assign lowest available queue number on target slot
    const ticketRes = await client.query(
      `SELECT q
       FROM generate_series(1, $2::int) AS q
       WHERE q NOT IN (
         SELECT queue_number FROM appointment WHERE time_slot_id = $1
       )
       ORDER BY q ASC
       LIMIT 1`,
      [input.newTimeSlotId, targetSlot.max_tickets]
    );

    if ((ticketRes.rowCount ?? 0) === 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        code: "NO_CAPACITY",
        error: "No available queue numbers in the chosen session.",
      };
    }

    const newQueueNumber = ticketRes.rows[0].q;

    // 5. Atomically move appointment to new slot (releases old slot capacity and reserves new)
    const updateRes = await client.query(
      `UPDATE appointment
       SET time_slot_id = $1,
           queue_number = $2,
           updated_at = NOW()
       WHERE appointment_id = $3
       RETURNING appointment_id, queue_number`,
      [input.newTimeSlotId, newQueueNumber, input.appointmentId]
    );

    await client.query("COMMIT");

    revalidatePath("/patient/appointments");
    revalidatePath("/patient/dashboard");

    return {
      success: true,
      data: {
        appointmentId: updateRes.rows[0].appointment_id,
        queueNumber: updateRes.rows[0].queue_number,
        newTimeSlotId: targetSlot.time_slot_id,
        date: targetSlot.available_date,
        startTime: targetSlot.start_time,
        endTime: targetSlot.end_time,
      },
    };
  } catch (err: unknown) {
    await client.query("ROLLBACK");

    const pgErr = err as { code?: string };
    if (pgErr.code === "40001" || pgErr.code === "40P01" || pgErr.code === "23505") {
      return {
        success: false,
        code: "CONCURRENT_CONFLICT",
        error: "A concurrency conflict occurred while reserving the new slot. Please try again.",
      };
    }

    console.error("[reschedulePatientAppointment] Internal error:", err);
    return {
      success: false,
      code: "DATABASE_ERROR",
      error: "Unable to reschedule appointment due to a server error. Please try again.",
    };
  } finally {
    client.release();
  }
}
