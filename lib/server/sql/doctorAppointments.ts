import { dbStatusToUi, type DbAppointmentStatus } from "@/lib/db/appointmentStatus";
import type { Appointment, VisitType } from "@/lib/types";
import type { Queryable } from "./queryable";

const QUEUE_COLUMNS = `
  appointment_id                                          AS "appointmentId",
  patient_id                                              AS "patientId",
  patient_name                                            AS "patientName",
  doctor_id                                               AS "doctorId",
  doctor_name                                             AS "doctorName",
  branch_id                                               AS "branchId",
  branch_name                                             AS "branchName",
  TO_CHAR(estimated_time, 'YYYY-MM-DD"T"HH24:MI:SS')      AS "dateTime",
  ticket_minutes                                          AS "duration",
  status::TEXT                                            AS "status",
  source::TEXT                                            AS "source",
  queue_number                                            AS "ticketNumber",
  reason                                                  AS "notes",
  consultation_fee::float8                                AS "fee"
`;

const VISIT_TYPE_BY_SOURCE: Record<string, VisitType> = {
  Booked: "Consultation",
  Walkin: "Walk-in",
  Emergency: "Emergency",
};

export function mapAppointmentRow(row: Record<string, unknown>): Appointment {
  const source = String(row.source);
  return {
    appointmentId: String(row.appointmentId),
    patientId: String(row.patientId),
    patientName: String(row.patientName),
    doctorId: String(row.doctorId),
    doctorName: String(row.doctorName),
    branchId: String(row.branchId),
    branchName: String(row.branchName),
    dateTime: String(row.dateTime),
    duration: Number(row.duration),
    visitType: VISIT_TYPE_BY_SOURCE[source] ?? "Consultation",
    status: dbStatusToUi(row.status as DbAppointmentStatus),
    source,
    ticketNumber: Number(row.ticketNumber),
    notes: row.notes ? String(row.notes) : undefined,
    fee: Number(row.fee),
  };
}

export async function fetchDoctorAppointments(
  db: Queryable,
  doctorId: string,
  fromDate: string,
  toDate: string
): Promise<Appointment[]> {
  const { rows } = await db.query(
    `SELECT ${QUEUE_COLUMNS}
     FROM v_doctor_queue
     WHERE doctor_id = $1
       AND available_date BETWEEN $2::date AND $3::date
       AND status NOT IN ('Cancelled', 'Rescheduled')
     ORDER BY estimated_time, queue_number`,
    [doctorId, fromDate, toDate]
  );
  return rows.map(mapAppointmentRow);
}

// Consultations that were started on an earlier day and never completed.
// They still need the doctor's attention, so the dashboard and the bell both show them.
export async function fetchUnfinishedConsultations(
  db: Queryable,
  doctorId: string,
  beforeDate: string
): Promise<Appointment[]> {
  const { rows } = await db.query(
    `SELECT ${QUEUE_COLUMNS}
     FROM v_doctor_queue
     WHERE doctor_id = $1
       AND status = 'InProgress'
       AND available_date < $2::date
     ORDER BY estimated_time DESC, queue_number`,
    [doctorId, beforeDate]
  );
  return rows.map(mapAppointmentRow);
}

// One appointment, only if it belongs to this doctor.
export async function fetchDoctorAppointment(
  db: Queryable,
  doctorId: string,
  appointmentId: string
): Promise<Appointment | null> {
  const { rows } = await db.query(
    `SELECT ${QUEUE_COLUMNS}
     FROM v_doctor_queue
     WHERE doctor_id = $1 AND appointment_id = $2`,
    [doctorId, appointmentId]
  );
  return rows[0] ? mapAppointmentRow(rows[0]) : null;
}

export async function startConsultation(
  db: Queryable,
  doctorId: string,
  appointmentId: string
): Promise<void> {
  await db.query("CALL sp_start_consultation($1::uuid, $2::uuid)", [appointmentId, doctorId]);
}