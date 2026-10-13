"use server";
// lib/actions/patient-records.ts
// Server action for retrieving patient consultation & medical records from PostgreSQL.
// Derives patientId strictly from the authenticated session.
// Only returns records belonging to the authenticated patient.

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";

export interface ConsultationRecordItem {
  consultationRecId: string;
  appointmentId: string;
  symptoms: string | null;
  diagnosis: string | null;
  followUpRequired: boolean;
  followUpDate: string | null;
  consultationNotes: string | null;
  consultationCreatedAt: string;

  // Appointment context
  reasonForVisit: string | null;
  appointmentNotes: string | null;
  appointmentStatus: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  checkedInAt: string | null;
  consultationStartedAt: string | null;

  // Doctor info
  doctorId: string;
  doctorName: string;
  specialization: string | null;
  specializations?: string[];

  // Branch info
  branchName: string;

  // Treatments performed during this appointment
  treatments: TreatmentItem[];
}

export interface TreatmentItem {
  appointmentTreatmentId: string;
  treatmentName: string;
  category: string;
  status: string;
  quantity: number;
  notes: string | null;
  resultFile: string | null;
  performedAt: string | null;
  performedBy: string | null;
}

type ConsultationRow = Omit<ConsultationRecordItem, "treatments">;
type TreatmentRow = TreatmentItem & { appointmentId: string };

/**
 * Loads all consultation records belonging to the authenticated patient.
 * Joins consultation_record → appointment → time_slot → doctor → app_user → branch.
 * Also loads associated treatments for each appointment.
 */
export async function getPatientRecords(): Promise<ConsultationRecordItem[]> {
  const user = await getCurrentUser();
  if (!user || user.role !== "patient") {
    return [];
  }

  const patientId = user.userId;

  try {
    // 1. Fetch consultation records with appointment + doctor + branch context
    const { rows: consultations } = await db.query<ConsultationRow>(
      `SELECT
         cr.consultation_rec_id                    AS "consultationRecId",
         cr.appointment_id                         AS "appointmentId",
         cr.symptoms                               AS "symptoms",
         cr.diagnosis                              AS "diagnosis",
         cr.follow_up_required                     AS "followUpRequired",
         TO_CHAR(cr.follow_up_date, 'YYYY-MM-DD')  AS "followUpDate",
         cr.notes                                  AS "consultationNotes",
         TO_CHAR(cr.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "consultationCreatedAt",

         a.reason_for_visit                        AS "reasonForVisit",
         a.notes                                   AS "appointmentNotes",
         a.status::TEXT                             AS "appointmentStatus",
         TO_CHAR(ts.available_date, 'YYYY-MM-DD')  AS "appointmentDate",
         TO_CHAR(ts.start_time, 'HH24:MI')         AS "startTime",
         TO_CHAR(ts.end_time, 'HH24:MI')           AS "endTime",
         TO_CHAR(a.checked_in_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "checkedInAt",
         TO_CHAR(a.consultation_started_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "consultationStartedAt",

         ts.doctor_id                              AS "doctorId",
         u.full_name                               AS "doctorName",
         COALESCE(
           (
             SELECT ARRAY_AGG(s.title ORDER BY s.title)
             FROM doctor_specialization ds
             JOIN specialization s ON s.specialization_id = ds.specialization_id
             WHERE ds.doctor_id = d.doctor_id
           ),
           ARRAY[]::text[]
         )                                         AS "specializations",

         b.branch_name                             AS "branchName"
       FROM consultation_record cr
       JOIN appointment a   ON a.appointment_id = cr.appointment_id
       JOIN time_slot ts    ON ts.time_slot_id  = a.time_slot_id
       JOIN doctor d        ON d.doctor_id      = ts.doctor_id
       JOIN employee e      ON e.employee_id    = d.doctor_id
       JOIN app_user u      ON u.user_id        = e.employee_id
       JOIN branch b        ON b.branch_id      = ts.branch_id
       WHERE a.patient_id = $1
       ORDER BY ts.available_date DESC, ts.start_time DESC`,
      [patientId]
    );

    if (consultations.length === 0) {
      return [];
    }

    // 2. Batch-load treatments for all matching appointments
    const appointmentIds = consultations.map((c) => c.appointmentId);
    const { rows: treatmentRows } = await db.query<TreatmentRow>(
      `SELECT
         at.appointment_treatment_id               AS "appointmentTreatmentId",
         at.appointment_id                         AS "appointmentId",
         tc.treatment_name                         AS "treatmentName",
         tc.category::TEXT                         AS "category",
         at.status::TEXT                            AS "status",
         at.quantity                                AS "quantity",
         at.notes                                  AS "notes",
         at.result_file                            AS "resultFile",
         TO_CHAR(at.performed_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "performedAt",
         perf.full_name                            AS "performedBy"
       FROM appointment_treatment at
       JOIN treatment_catalogue tc ON tc.treatment_service_code = at.treatment_service_code
       LEFT JOIN employee pe       ON pe.employee_id = at.performed_by
       LEFT JOIN app_user perf     ON perf.user_id   = pe.employee_id
       WHERE at.appointment_id = ANY($1::uuid[])
       ORDER BY at.ordered_at ASC`,
      [appointmentIds]
    );

    // 3. Group treatments by appointment_id
    const treatmentsByAppt: Record<string, TreatmentItem[]> = {};
    for (const t of treatmentRows) {
      const apptId = t.appointmentId;
      if (!treatmentsByAppt[apptId]) treatmentsByAppt[apptId] = [];
      treatmentsByAppt[apptId].push({
        appointmentTreatmentId: t.appointmentTreatmentId,
        treatmentName: t.treatmentName,
        category: t.category,
        status: t.status,
        quantity: t.quantity,
        notes: t.notes,
        resultFile: t.resultFile,
        performedAt: t.performedAt,
        performedBy: t.performedBy,
      });
    }

    // 4. Attach treatments to their consultation record
    return consultations.map((c) => {
      const specializations: string[] = Array.isArray(c.specializations)
        ? c.specializations
        : [];
      return {
        ...c,
        specialization:
          specializations.length > 0 ? specializations.join(", ") : null,
        specializations,
        treatments: treatmentsByAppt[c.appointmentId] || [],
      };
    });
  } catch (err) {
    console.error("[getPatientRecords] Failed to fetch records:", err);
    return [];
  }
}
