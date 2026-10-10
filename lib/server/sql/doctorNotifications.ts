import type { DoctorNotification, DoctorNotificationKind } from "@/lib/doctorTypes";
import type { Queryable } from "./queryable";

// Everything here is derived from existing tables, so there is no read/unread state.
//   checked_in      patient is waiting today
//   in_progress     a consultation was started and is not completed
//   follow_up       a follow-up is due today
//   treatment_done  a treatment order was completed in the last 24 hours
//   new_booking     an upcoming appointment was booked in the last 24 hours
//   cancelled       an upcoming appointment was cancelled / rescheduled / no-show in the last 24 hours
const NOTIFICATIONS_SQL = `
WITH mine AS (
  SELECT a.appointment_id,
         a.status,
         a.created_at,
         a.updated_at,
         a.checked_in_at,
         a.consultation_started_at,
         pu.full_name                                              AS patient_name,
         ts.available_date,
         TO_CHAR(ts.available_date, 'YYYY-MM-DD') || ' ' || TO_CHAR(ts.start_time, 'HH24:MI') AS slot
  FROM appointment a
  JOIN time_slot ts ON ts.time_slot_id = a.time_slot_id
  JOIN app_user  pu ON pu.user_id      = a.patient_id
  WHERE ts.doctor_id = $1::uuid
)
SELECT kind, appointment_id, patient, detail,
       TO_CHAR(at, 'YYYY-MM-DD"T"HH24:MI:SS') AS at, priority
FROM (
  SELECT 'checked_in'::text AS kind, appointment_id, patient_name AS patient,
         NULL::text AS detail, checked_in_at AS at, 1 AS priority
  FROM mine
  WHERE status = 'CheckedIn' AND available_date = $2::date

  UNION ALL
  SELECT 'in_progress', appointment_id, patient_name, NULL::text, consultation_started_at, 2
  FROM mine
  WHERE status = 'InProgress'

  UNION ALL
  SELECT 'follow_up', m.appointment_id, m.patient_name, NULL::text, cr.follow_up_date::timestamp, 3
  FROM consultation_record cr
  JOIN mine m ON m.appointment_id = cr.appointment_id
  WHERE cr.follow_up_required AND cr.follow_up_date = $2::date

  UNION ALL
  SELECT 'treatment_done', m.appointment_id, m.patient_name, tc.treatment_name::text, at.performed_at, 3
  FROM appointment_treatment at
  JOIN mine m ON m.appointment_id = at.appointment_id
  JOIN treatment_catalogue tc ON tc.treatment_service_code = at.treatment_service_code
  WHERE at.status = 'Completed' AND at.performed_at > NOW() - INTERVAL '24 hours'

  UNION ALL
  SELECT 'new_booking', appointment_id, patient_name, slot, created_at, 4
  FROM mine
  WHERE status = 'Scheduled' AND available_date >= $2::date
    AND created_at > NOW() - INTERVAL '24 hours'

  UNION ALL
  SELECT 'cancelled', appointment_id, patient_name, status::text || ' - ' || slot, updated_at, 5
  FROM mine
  WHERE status IN ('Cancelled', 'Rescheduled', 'NoShow') AND available_date >= $2::date
    AND updated_at > NOW() - INTERVAL '24 hours'
) n
ORDER BY priority, n.at DESC NULLS LAST
LIMIT 30
`;

const TITLE: Record<DoctorNotificationKind, (patient: string, detail: string) => string> = {
  checked_in: (p) => `${p} has checked in`,
  in_progress: (p) => `Consultation in progress: ${p}`,
  follow_up: (p) => `Follow-up due today: ${p}`,
  treatment_done: (p, d) => `${d} completed for ${p}`,
  new_booking: (p) => `New appointment: ${p}`,
  cancelled: (p) => `Appointment cancelled: ${p}`,
};

const DETAIL: Record<DoctorNotificationKind, (detail: string) => string> = {
  checked_in: () => "Waiting for consultation",
  in_progress: () => "Not completed yet, open it to continue",
  follow_up: () => "Review the previous consultation",
  treatment_done: () => "Result is ready to review",
  new_booking: (d) => d,
  cancelled: (d) => d,
};

export async function fetchDoctorNotifications(
  db: Queryable,
  doctorId: string,
  today: string
): Promise<DoctorNotification[]> {
  const { rows } = await db.query(NOTIFICATIONS_SQL, [doctorId, today]);

  return rows.map((r): DoctorNotification => {
    const kind = String(r.kind) as DoctorNotificationKind;
    const patient = String(r.patient);
    const detail = r.detail ? String(r.detail) : "";
    const at = r.at ? String(r.at) : null;
    return {
      id: `${kind}:${String(r.appointment_id)}`,
      kind,
      title: TITLE[kind](patient, detail),
      detail: DETAIL[kind](detail),
      at,
      href: `/doctor/consultations/${String(r.appointment_id)}`,
    };
  });
}
