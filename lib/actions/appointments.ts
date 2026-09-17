"use server";
// lib/actions/appointments.ts
// All appointment-related raw SQL server actions.
// Every query is parameterized — NO string interpolation.

import { sql, pool } from "@/lib/db";
import type { Appointment, AppointmentStatus, SessionType } from "@/lib/types";
import { SESSION_META } from "@/lib/types";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BookingResult =
  | { success: true; appointmentId: string; ticketNumber: number }
  | { success: false; error: "SLOT_FULL" | "INVALID_INPUT" | "UNKNOWN"; message: string };

export interface SlotAvailability {
  session: SessionType;
  maxTickets: number;
  currentCount: number;
  lastTicketNumber: number;
  isFull: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map a SessionType to its DB start_time string */
function sessionToStartTime(session: SessionType): string {
  return `${String(SESSION_META[session].startHour).padStart(2, "0")}:00`;
}

/** Map a SessionType to its DB end_time string (3-hour window) */
function sessionToEndTime(session: SessionType): string {
  return `${String(SESSION_META[session].startHour + 3).padStart(2, "0")}:00`;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getAppointments(branchId?: string): Promise<Appointment[]> {
  if (!process.env.DATABASE_URL) return [];
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
  if (!process.env.DATABASE_URL) return [];
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
  if (!process.env.DATABASE_URL) return [];
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

/**
 * Get live slot availability for a doctor on a specific date.
 * Returns availability for all 4 sessions, auto-filling defaults
 * for sessions that have no time_slot row yet (i.e. zero bookings).
 */
export async function getSlotAvailability(
  doctorId: string,
  date: string, // ISO date string e.g. "2026-09-20"
): Promise<SlotAvailability[]> {
  const ALL_SESSIONS: SessionType[] = ["Morning", "Midday", "Afternoon", "Evening"];

  if (!process.env.DATABASE_URL) {
    return ALL_SESSIONS.map((session) => ({
      session,
      maxTickets: 4,
      currentCount: 0,
      lastTicketNumber: 0,
      isFull: false,
    }));
  }

  const rows = await sql`
    SELECT
      slot_start_time       AS "slotStartTime",
      max_tickets           AS "maxTickets",
      current_ticket_count  AS "currentCount",
      last_ticket_number    AS "lastTicketNumber"
    FROM time_slot
    WHERE doctor_id     = ${doctorId}
      AND available_date = ${date}::DATE
    ORDER BY slot_start_time ASC
  `;

  // Build a lookup by start hour
  const slotMap = new Map<number, { maxTickets: number; currentCount: number; lastTicketNumber: number }>();
  for (const row of rows) {
    const r = row as { slotStartTime: string; maxTickets: number; currentCount: number; lastTicketNumber: number };
    const hour = parseInt(r.slotStartTime.split(":")[0], 10);
    slotMap.set(hour, {
      maxTickets: r.maxTickets,
      currentCount: r.currentCount,
      lastTicketNumber: r.lastTicketNumber,
    });
  }

  return ALL_SESSIONS.map((session) => {
    const startHour = SESSION_META[session].startHour;
    const data = slotMap.get(startHour);
    const maxTickets = data?.maxTickets ?? 4;
    const currentCount = data?.currentCount ?? 0;
    return {
      session,
      maxTickets,
      currentCount,
      lastTicketNumber: data?.lastTicketNumber ?? 0,
      isFull: currentCount >= maxTickets,
    };
  });
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

/**
 * Transactional booking with anti-collision guard.
 *
 * Uses an interactive transaction (WebSocket Pool) to:
 * 1. Upsert the time_slot row for this doctor/date/session
 * 2. SELECT ... FOR UPDATE to lock the row
 * 3. Check capacity (current_ticket_count < max_tickets)
 * 4. Atomically assign the next ticket number
 * 5. INSERT into appointment with ticket_number and session
 *
 * The DB trigger `trg_booking_guard` acts as a secondary safety net.
 */
export async function bookAppointment(data: {
  patientId: string;
  doctorId: string;
  branchId: string;
  date: string;        // ISO date, e.g. "2026-09-20"
  session: SessionType;
  visitType: string;
  fee: number;
  notes?: string;
}): Promise<BookingResult> {
  // ── Input validation ──────────────────────────────────────────────────────
  if (!data.patientId || !data.doctorId || !data.branchId || !data.date || !data.session) {
    return { success: false, error: "INVALID_INPUT", message: "Missing required booking fields." };
  }

  const validSessions: SessionType[] = ["Morning", "Midday", "Afternoon", "Evening"];
  if (!validSessions.includes(data.session)) {
    return { success: false, error: "INVALID_INPUT", message: `Invalid session: ${data.session}` };
  }

  const bookingDate = new Date(data.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (bookingDate < today) {
    return { success: false, error: "INVALID_INPUT", message: "Cannot book appointments in the past." };
  }

  const startTime = sessionToStartTime(data.session);
  const endTime = sessionToEndTime(data.session);
  const startHour = SESSION_META[data.session].startHour;

  // Build the appointment dateTime from date + session start hour
  const dt = new Date(data.date);
  dt.setHours(startHour, 0, 0, 0);
  const dateTimeISO = dt.toISOString();

  // If no DATABASE_URL is configured (e.g. running mock UI locally), fallback to mock booking response
  if (!process.env.DATABASE_URL) {
    const mockId = `APT-${Date.now()}`;
    revalidatePath("/find-doctors");
    revalidatePath("/dashboard");
    revalidatePath("/my-appointments");
    return { success: true, appointmentId: mockId, ticketNumber: 1 };
  }

  // ── Interactive transaction via WebSocket Pool ────────────────────────────
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // 1. Upsert time_slot — create row if first booking for this doctor/date/session
    const slotHash = `TS-${data.doctorId}-${data.date}-${startTime}`.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 10);

    await client.query(
      `INSERT INTO time_slot (
        time_slot_id, doctor_id, branch_id, available_date,
        slot_start_time, slot_end_time, max_tickets,
        current_ticket_count, last_ticket_number
      )
      VALUES ($1, $2, $3, $4::DATE, $5::TIME, $6::TIME, 4, 0, 0)
      ON CONFLICT (doctor_id, available_date, slot_start_time) DO NOTHING`,
      [slotHash, data.doctorId, data.branchId, data.date, startTime, endTime]
    );

    // 2. Lock the time_slot row and read current capacity
    const slotResult = await client.query(
      `SELECT max_tickets        AS "maxTickets",
              current_ticket_count AS "currentCount",
              last_ticket_number   AS "lastTicketNumber"
       FROM time_slot
       WHERE doctor_id      = $1
         AND available_date  = $2::DATE
         AND slot_start_time = $3::TIME
       FOR UPDATE`,
      [data.doctorId, data.date, startTime]
    );

    if (slotResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, error: "UNKNOWN", message: "Could not find or create the time slot." };
    }

    const slot = slotResult.rows[0];
    const maxTickets: number = slot.maxTickets;
    const currentCount: number = slot.currentCount;
    const lastTicket: number = slot.lastTicketNumber;

    // 3. Guard: reject if at capacity
    if (currentCount >= maxTickets) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: "SLOT_FULL",
        message: `This session is fully booked (${currentCount}/${maxTickets} slots taken). Please choose a different session or date.`,
      };
    }

    // 4. Assign next ticket
    const nextTicket = lastTicket + 1;

    // 5. Increment counters on the time_slot row
    await client.query(
      `UPDATE time_slot
       SET current_ticket_count = current_ticket_count + 1,
           last_ticket_number   = $1,
           updated_at           = NOW()
       WHERE doctor_id      = $2
         AND available_date  = $3::DATE
         AND slot_start_time = $4::TIME`,
      [nextTicket, data.doctorId, data.date, startTime]
    );

    // 6. INSERT the appointment
    const apptResult = await client.query(
      `INSERT INTO appointment
        (patient_id, doctor_id, branch_id, appointment_date_time,
         duration_minutes, visit_type, status, fee, notes,
         session, ticket_number, source, payment_status)
       VALUES
        ($1, $2, $3, $4, 30, $5, 'Pending', $6, $7, $8, $9, 'Booked', 'Unpaid')
       RETURNING appointment_id AS "appointmentId"`,
      [
        data.patientId,
        data.doctorId,
        data.branchId,
        dateTimeISO,
        data.visitType,
        data.fee,
        data.notes ?? null,
        data.session,
        nextTicket,
      ]
    );

    await client.query("COMMIT");

    const appointmentId = apptResult.rows[0]?.appointmentId as string;

    // Revalidate relevant paths
    revalidatePath("/find-doctors");
    revalidatePath("/dashboard");
    revalidatePath("/appointments");
    revalidatePath("/my-appointments");

    return { success: true, appointmentId, ticketNumber: nextTicket };
  } catch (err: unknown) {
    if (client) await client.query("ROLLBACK").catch(() => {});

    let message = "Could not connect to database. Please verify DATABASE_URL in .env.local.";
    if (err instanceof Error && err.message !== "ErrorEvent") {
      message = err.message;
    }

    if (message.includes("SLOT_FULL")) {
      return {
        success: false,
        error: "SLOT_FULL",
        message: "This session is fully booked. Please choose a different session or date.",
      };
    }

    console.error("[bookAppointment] Transaction failed:", err);
    return { success: false, error: "UNKNOWN", message };
  } finally {
    if (client) client.release();
  }
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

/**
 * Reschedule an appointment to a new date & session.
 * Enforces the 24-hour window restriction.
 */
export async function rescheduleAppointment(data: {
  appointmentId: string;
  date: string;
  session: SessionType;
}): Promise<BookingResult> {
  if (!data.appointmentId || !data.date || !data.session) {
    return { success: false, error: "INVALID_INPUT", message: "Missing required fields for rescheduling." };
  }

  const apptRows = await sql`
    SELECT appointment_id, doctor_id, branch_id, appointment_date_time, session, ticket_number, status
    FROM appointment
    WHERE appointment_id = ${data.appointmentId}
  `;

  if (apptRows.length === 0) {
    return { success: false, error: "INVALID_INPUT", message: "Appointment not found." };
  }

  const appt = apptRows[0] as {
    appointment_id: string;
    doctor_id: string;
    branch_id: string;
    appointment_date_time: string;
    session: SessionType;
    ticket_number: number;
    status: string;
  };

  if (appt.status === "Cancelled" || appt.status === "Completed") {
    return { success: false, error: "INVALID_INPUT", message: `Cannot reschedule a ${appt.status.toLowerCase()} appointment.` };
  }

  const currentApptTime = new Date(appt.appointment_date_time).getTime();
  const hoursRemaining = (currentApptTime - Date.now()) / (1000 * 60 * 60);

  if (hoursRemaining < 24) {
    return {
      success: false,
      error: "INVALID_INPUT",
      message: "Rescheduling is only allowed up to 24 hours prior to the scheduled appointment.",
    };
  }

  const startTime = sessionToStartTime(data.session);
  const endTime = sessionToEndTime(data.session);
  const startHour = SESSION_META[data.session].startHour;

  const dt = new Date(data.date);
  dt.setHours(startHour, 0, 0, 0);
  const dateTimeISO = dt.toISOString();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (appt.session && appt.appointment_date_time) {
      const oldDate = new Date(appt.appointment_date_time).toISOString().split("T")[0];
      const oldStartTime = sessionToStartTime(appt.session);
      await client.query(
        `UPDATE time_slot
         SET current_ticket_count = GREATEST(0, current_ticket_count - 1),
             updated_at           = NOW()
         WHERE doctor_id      = $1
           AND available_date  = $2::DATE
           AND slot_start_time = $3::TIME`,
        [appt.doctor_id, oldDate, oldStartTime]
      );
    }

    const slotHash = `TS-${appt.doctor_id}-${data.date}-${startTime}`.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 10);
    await client.query(
      `INSERT INTO time_slot (
        time_slot_id, doctor_id, branch_id, available_date,
        slot_start_time, slot_end_time, max_tickets,
        current_ticket_count, last_ticket_number
      )
      VALUES ($1, $2, $3, $4::DATE, $5::TIME, $6::TIME, 4, 0, 0)
      ON CONFLICT (doctor_id, available_date, slot_start_time) DO NOTHING`,
      [slotHash, appt.doctor_id, appt.branch_id, data.date, startTime, endTime]
    );

    const slotResult = await client.query(
      `SELECT max_tickets        AS "maxTickets",
              current_ticket_count AS "currentCount",
              last_ticket_number   AS "lastTicketNumber"
       FROM time_slot
       WHERE doctor_id      = $1
         AND available_date  = $2::DATE
         AND slot_start_time = $3::TIME
       FOR UPDATE`,
      [appt.doctor_id, data.date, startTime]
    );

    const slot = slotResult.rows[0];
    const maxTickets: number = slot?.maxTickets ?? 4;
    const currentCount: number = slot?.currentCount ?? 0;
    const lastTicket: number = slot?.lastTicketNumber ?? 0;

    if (currentCount >= maxTickets) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: "SLOT_FULL",
        message: "Target session is fully booked. Please select another date or session.",
      };
    }

    const nextTicket = lastTicket + 1;

    await client.query(
      `UPDATE time_slot
       SET current_ticket_count = current_ticket_count + 1,
           last_ticket_number   = $1,
           updated_at           = NOW()
       WHERE doctor_id      = $2
         AND available_date  = $3::DATE
         AND slot_start_time = $4::TIME`,
      [nextTicket, appt.doctor_id, data.date, startTime]
    );

    await client.query(
      `UPDATE appointment
       SET appointment_date_time = $1,
           session               = $2,
           ticket_number         = $3,
           status                = 'Rescheduled',
           updated_at            = NOW()
       WHERE appointment_id = $4`,
      [dateTimeISO, data.session, nextTicket, data.appointmentId]
    );

    await client.query("COMMIT");

    revalidatePath("/appointments");
    revalidatePath("/my-appointments");
    revalidatePath("/dashboard");

    return { success: true, appointmentId: data.appointmentId, ticketNumber: nextTicket };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[rescheduleAppointment] Error:", msg);
    return { success: false, error: "UNKNOWN", message: "Failed to reschedule appointment." };
  } finally {
    client.release();
  }
}

/**
 * Cancel an appointment with 24-hour window validation.
 */
export async function cancelAppointment(data: {
  appointmentId: string;
  cancelReason?: string;
}): Promise<{ success: boolean; message: string }> {
  if (!data.appointmentId) {
    return { success: false, message: "Missing appointment ID." };
  }

  const apptRows = await sql`
    SELECT appointment_id, doctor_id, appointment_date_time, session, status
    FROM appointment
    WHERE appointment_id = ${data.appointmentId}
  `;

  if (apptRows.length === 0) {
    return { success: false, message: "Appointment not found." };
  }

  const appt = apptRows[0] as {
    appointment_id: string;
    doctor_id: string;
    appointment_date_time: string;
    session: SessionType;
    status: string;
  };

  const currentApptTime = new Date(appt.appointment_date_time).getTime();
  const hoursRemaining = (currentApptTime - Date.now()) / (1000 * 60 * 60);

  if (hoursRemaining < 24) {
    return {
      success: false,
      message: "Cancellations are only allowed up to 24 hours prior to the scheduled appointment.",
    };
  }

  await sql`
    UPDATE appointment
    SET status        = 'Cancelled',
        cancel_reason = ${data.cancelReason ?? 'Cancelled by patient'},
        updated_at    = NOW()
    WHERE appointment_id = ${data.appointmentId}
  `;

  if (appt.session && appt.appointment_date_time) {
    const oldDate = new Date(appt.appointment_date_time).toISOString().split("T")[0];
    const oldStartTime = sessionToStartTime(appt.session);
    await sql`
      UPDATE time_slot
      SET current_ticket_count = GREATEST(0, current_ticket_count - 1),
          updated_at           = NOW()
      WHERE doctor_id      = ${appt.doctor_id}
        AND available_date  = ${oldDate}::DATE
        AND slot_start_time = ${oldStartTime}::TIME
    `;
  }

  revalidatePath("/appointments");
  revalidatePath("/my-appointments");
  revalidatePath("/dashboard");

  return { success: true, message: "Appointment cancelled successfully." };
}


