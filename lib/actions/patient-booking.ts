"use server";
// lib/actions/patient-booking.ts
// Patient appointment booking server action using the PostgreSQL schema contract.
// Strictly transactional with row-level locking to prevent concurrent overbooking.

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { revalidatePath } from "next/cache";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

import { ALLOWED_VISIT_TYPES, type VisitType } from "@/lib/types";

export interface BookPatientAppointmentInput {
  doctorId: string;
  branchId: string;
  timeSlotId: string;
  date: string; // "YYYY-MM-DD"
  visitType: string;
  reasonForVisit?: string;
  notes?: string;
}

export type BookingErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "PATIENT_NOT_FOUND"
  | "INVALID_INPUT"
  | "INVALID_VISIT_TYPE"
  | "DOCTOR_NOT_FOUND"
  | "DOCTOR_UNAVAILABLE"
  | "BRANCH_INACTIVE"
  | "DOCTOR_BRANCH_MISMATCH"
  | "SLOT_NOT_FOUND"
  | "SLOT_MISMATCH"
  | "DATE_INVALID"
  | "DATE_IN_PAST"
  | "NO_CAPACITY"
  | "DUPLICATE_BOOKING"
  | "CONCURRENT_CONFLICT"
  | "DATABASE_ERROR";

export type BookAppointmentResult =
  | {
      success: true;
      appointment: {
        appointmentId: string;
        timeSlotId: string;
        patientId: string;
        doctorId: string;
        branchId: string;
        queueNumber: number;
        date: string;
        startTime: string;
        endTime: string;
        status: string;
        source: string;
        reasonForVisit: string | null;
        notes: string | null;
        createdAt: string;
      };
    }
  | {
      success: false;
      code: BookingErrorCode;
      error: string;
    };

export interface BookableSlot {
  timeSlotId: string;
  doctorId: string;
  branchId: string;
  branchName: string;
  date: string;
  startTime: string;
  endTime: string;
  maxTickets: number;
  bookedCount: number;
  remainingCapacity: number;
}

/**
 * Retrieves available time slots for a doctor, optionally filtered by date.
 */
export async function getDoctorBookableSlots(
  doctorId: string,
  date?: string
): Promise<BookableSlot[]> {
  try {
    if (!UUID_REGEX.test(doctorId)) return [];
    if (date && !DATE_REGEX.test(date)) return [];

    const values: unknown[] = [doctorId];
    let dateFilter = "AND s.available_date >= CURRENT_DATE";
    if (date) {
      values.push(date);
      dateFilter += ` AND s.available_date = $${values.length}`;
    }

    const { rows } = await db.query(
      `SELECT
         s.time_slot_id                     AS "timeSlotId",
         s.doctor_id                        AS "doctorId",
         s.branch_id                        AS "branchId",
         b.branch_name                      AS "branchName",
         TO_CHAR(s.available_date, 'YYYY-MM-DD') AS "date",
         s.start_time::text                 AS "startTime",
         s.end_time::text                   AS "endTime",
         s.max_tickets                      AS "maxTickets",
         COUNT(a.appointment_id) FILTER (WHERE a.status NOT IN ('Cancelled'))::int AS "bookedCount",
         GREATEST(0, s.max_tickets - COUNT(a.appointment_id) FILTER (WHERE a.status NOT IN ('Cancelled')))::int AS "remainingCapacity"
       FROM time_slot s
       JOIN branch b ON b.branch_id = s.branch_id
       LEFT JOIN appointment a ON a.time_slot_id = s.time_slot_id
       WHERE s.doctor_id = $1
         ${dateFilter}
       GROUP BY s.time_slot_id, b.branch_name
       ORDER BY s.available_date ASC, s.start_time ASC`,
      values
    );

    return rows as BookableSlot[];
  } catch (err) {
    console.error("[getDoctorBookableSlots] Failed to query slots:", err);
    throw new Error("Failed to load doctor slots from database.");
  }
}

/**
 * Transactional patient booking server action.
 * - Authenticates session server-side.
 * - Derives patientId from session (never trusts client payload).
 * - Locks the time_slot row with FOR UPDATE.
 * - Validates doctor, branch, slot, date, visit type, and capacity.
 * - Inserts appointment with created_by = NULL (patient self-booking).
 * - Rolls back transaction on any validation or concurrency failure.
 */
export async function bookPatientAppointment(
  input: BookPatientAppointmentInput
): Promise<BookAppointmentResult> {
  // ── 1. Authentication & Authorization ────────────────────────────────────────
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      code: "UNAUTHENTICATED",
      error: "You must be logged in to book an appointment.",
    };
  }

  if (user.role !== "patient") {
    return {
      success: false,
      code: "FORBIDDEN",
      error: "Only patients can book appointments through this portal.",
    };
  }

  const patientId = user.userId;

  // ── 2. Input Validation ──────────────────────────────────────────────────────
  if (
    !input.doctorId ||
    !input.branchId ||
    !input.timeSlotId ||
    !input.date ||
    !input.visitType
  ) {
    return {
      success: false,
      code: "INVALID_INPUT",
      error: "Missing required booking details.",
    };
  }

  if (
    !UUID_REGEX.test(input.doctorId) ||
    !UUID_REGEX.test(input.branchId) ||
    !UUID_REGEX.test(input.timeSlotId)
  ) {
    return {
      success: false,
      code: "INVALID_INPUT",
      error: "Invalid identifier format.",
    };
  }

  if (!DATE_REGEX.test(input.date)) {
    return {
      success: false,
      code: "DATE_INVALID",
      error: "Date must be formatted as YYYY-MM-DD.",
    };
  }

  const parsedDate = new Date(`${input.date}T00:00:00Z`);
  if (isNaN(parsedDate.getTime())) {
    return {
      success: false,
      code: "DATE_INVALID",
      error: "Invalid calendar date provided.",
    };
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  if (input.date < todayStr) {
    return {
      success: false,
      code: "DATE_IN_PAST",
      error: "Appointments cannot be booked for past dates.",
    };
  }

  if (!ALLOWED_VISIT_TYPES.includes(input.visitType as VisitType)) {
    return {
      success: false,
      code: "INVALID_VISIT_TYPE",
      error: `Invalid visit type. Allowed types: ${ALLOWED_VISIT_TYPES.join(", ")}.`,
    };
  }

  // ── 3. Transaction Execution with Concurrency Control ────────────────────────
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Verify patient record exists in database
    const patientRes = await client.query(
      `SELECT patient_id FROM patient WHERE patient_id = $1`,
      [patientId]
    );
    if ((patientRes.rowCount ?? 0) === 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        code: "PATIENT_NOT_FOUND",
        error: "Patient profile not found in system.",
      };
    }

    // Lock time_slot row with FOR UPDATE to prevent race conditions & overbooking
    const slotRes = await client.query(
      `SELECT
         s.time_slot_id,
         s.doctor_id,
         s.branch_id,
         TO_CHAR(s.available_date, 'YYYY-MM-DD') AS available_date,
         s.start_time::text AS start_time,
         s.end_time::text AS end_time,
         s.max_tickets,
         s.current_serving_number
       FROM time_slot s
       WHERE s.time_slot_id = $1
       FOR UPDATE`,
      [input.timeSlotId]
    );

    if ((slotRes.rowCount ?? 0) === 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        code: "SLOT_NOT_FOUND",
        error: "The requested time slot was not found.",
      };
    }

    const slot = slotRes.rows[0];

    // Verify slot matches doctor, branch, and date
    if (
      slot.doctor_id !== input.doctorId ||
      slot.branch_id !== input.branchId ||
      slot.available_date !== input.date
    ) {
      await client.query("ROLLBACK");
      return {
        success: false,
        code: "SLOT_MISMATCH",
        error: "Selected slot does not match the chosen doctor, branch, or date.",
      };
    }

    // Verify doctor exists, is active, and bookable
    const doctorRes = await client.query(
      `SELECT
         d.doctor_id,
         d.is_available,
         e.is_active AS employee_active,
         e.branch_id AS employee_branch_id
       FROM doctor d
       JOIN employee e ON e.employee_id = d.doctor_id
       WHERE d.doctor_id = $1`,
      [input.doctorId]
    );

    if ((doctorRes.rowCount ?? 0) === 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        code: "DOCTOR_NOT_FOUND",
        error: "Selected doctor does not exist.",
      };
    }

    const doctor = doctorRes.rows[0];
    if (!doctor.is_available || !doctor.employee_active) {
      await client.query("ROLLBACK");
      return {
        success: false,
        code: "DOCTOR_UNAVAILABLE",
        error: "Doctor is currently not available for bookings.",
      };
    }

    // Verify branch exists and is active
    const branchRes = await client.query(
      `SELECT branch_id, is_active FROM branch WHERE branch_id = $1`,
      [input.branchId]
    );

    if ((branchRes.rowCount ?? 0) === 0 || !branchRes.rows[0].is_active) {
      await client.query("ROLLBACK");
      return {
        success: false,
        code: "BRANCH_INACTIVE",
        error: "Selected clinic branch is invalid or inactive.",
      };
    }

    // Check doctor-branch affiliation (primary branch or scheduled branch)
    if (doctor.employee_branch_id !== input.branchId) {
      const scheduleRes = await client.query(
        `SELECT 1 FROM doctor_schedule WHERE doctor_id = $1 AND branch_id = $2 LIMIT 1`,
        [input.doctorId, input.branchId]
      );
      if ((scheduleRes.rowCount ?? 0) === 0) {
        await client.query("ROLLBACK");
        return {
          success: false,
          code: "DOCTOR_BRANCH_MISMATCH",
          error: "Doctor is not associated with this clinic branch.",
        };
      }
    }

    // Check if patient already has an active appointment in this slot
    const existingApptRes = await client.query(
      `SELECT appointment_id
       FROM appointment
       WHERE time_slot_id = $1
         AND patient_id = $2
         AND status NOT IN ('Cancelled')`,
      [input.timeSlotId, patientId]
    );

    if ((existingApptRes.rowCount ?? 0) > 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        code: "DUPLICATE_BOOKING",
        error: "You already have an active appointment booked in this session.",
      };
    }

    // Check capacity: count non-cancelled appointments in this slot
    const countRes = await client.query(
      `SELECT COUNT(*)::int AS active_count
       FROM appointment
       WHERE time_slot_id = $1
         AND status NOT IN ('Cancelled')`,
      [input.timeSlotId]
    );

    const activeCount = countRes.rows[0].active_count;
    if (activeCount >= slot.max_tickets) {
      await client.query("ROLLBACK");
      return {
        success: false,
        code: "NO_CAPACITY",
        error: "This session has reached maximum capacity.",
      };
    }

    // Assign lowest available ticket number in 1..max_tickets that is not taken
    // (guarantees satisfaction of idx_unique_ticket_per_session constraint)
    const ticketRes = await client.query(
      `SELECT q
       FROM generate_series(1, $2::int) AS q
       WHERE q NOT IN (
         SELECT queue_number FROM appointment WHERE time_slot_id = $1
       )
       ORDER BY q ASC
       LIMIT 1`,
      [input.timeSlotId, slot.max_tickets]
    );

    if ((ticketRes.rowCount ?? 0) === 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        code: "NO_CAPACITY",
        error: "No available ticket numbers remain for this session.",
      };
    }

    const assignedTicket = ticketRes.rows[0].q;

    // Reason for visit composition
    const reasonText = input.reasonForVisit
      ? `${input.visitType}: ${input.reasonForVisit}`.slice(0, 255)
      : input.visitType;

    // Insert appointment with created_by = NULL (patient self-booking per V16)
    const insertRes = await client.query(
      `INSERT INTO appointment (
         time_slot_id,
         patient_id,
         queue_number,
         created_by,
         status,
         source,
         reason_for_visit,
         notes
       ) VALUES (
         $1, $2, $3, NULL, 'Scheduled', 'Booked', $4, $5
       )
       RETURNING
         appointment_id,
         time_slot_id,
         patient_id,
         queue_number,
         status,
         source,
         reason_for_visit,
         notes,
         TO_CHAR(created_at, 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') AS created_at`,
      [
        input.timeSlotId,
        patientId,
        assignedTicket,
        reasonText,
        input.notes ?? null,
      ]
    );

    await client.query("COMMIT");

    const created = insertRes.rows[0];

    revalidatePath("/patient/dashboard");
    revalidatePath("/patient/appointments");

    return {
      success: true,
      appointment: {
        appointmentId: created.appointment_id,
        timeSlotId: created.time_slot_id,
        patientId: created.patient_id,
        doctorId: slot.doctor_id,
        branchId: slot.branch_id,
        queueNumber: created.queue_number,
        date: slot.available_date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        status: created.status,
        source: created.source,
        reasonForVisit: created.reason_for_visit,
        notes: created.notes,
        createdAt: created.created_at,
      },
    };
  } catch (err: unknown) {
    await client.query("ROLLBACK");

    const pgError = err as { code?: string; message?: string };

    // Concurrency conflict / serialization error / duplicate key on race
    if (
      pgError.code === "40001" || // serialization_failure
      pgError.code === "40P01" || // deadlock_detected
      pgError.code === "23505"    // unique_violation (e.g. ticket collision)
    ) {
      return {
        success: false,
        code: "CONCURRENT_CONFLICT",
        error: "A concurrent booking conflict occurred. Please try again.",
      };
    }

    console.error("[bookPatientAppointment] Internal transaction error:", err);
    return {
      success: false,
      code: "DATABASE_ERROR",
      error: "Unable to process booking due to a database error. Please try again.",
    };
  } finally {
    client.release();
  }
}
