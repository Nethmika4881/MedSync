import { dbTreatmentStatusToUi, type DbTreatmentStatus } from "@/lib/db/treatmentStatus";
import type { TreatmentCategory } from "@/lib/types";
import type {
  ConsultationHistoryItem,
  ConsultationRecordStatus,
  ConsultationWorkspace,
  SaveConsultationInput,
  WorkspaceConsultation,
  WorkspacePrescription,
  WorkspaceTreatment,
} from "@/lib/doctorTypes";
import { fetchDoctorAppointment } from "./doctorAppointments";
import type { Queryable } from "./queryable";


export async function fetchConsultationWorkspace(
  db: Queryable,
  doctorId: string,
  appointmentId: string
): Promise<ConsultationWorkspace | null> {
  const appointment = await fetchDoctorAppointment(db, doctorId, appointmentId);
  if (!appointment) return null;

  const [consultation, treatments, prescriptions, invoice] = await Promise.all([
    db.query(
      `SELECT consultation_rec_id                       AS "consultationId",
              COALESCE(symptoms, '')                    AS "symptoms",
              COALESCE(diagnosis, '')                   AS "diagnosis",
              COALESCE(notes, '')                       AS "notes",
              follow_up_required                        AS "followUpRequired",
              COALESCE(TO_CHAR(follow_up_date, 'YYYY-MM-DD'), '') AS "followUpDate"
       FROM consultation_record
       WHERE appointment_id = $1`,
      [appointmentId]
    ),
    db.query(
      `SELECT at.appointment_treatment_id               AS "appointmentTreatmentId",
              at.treatment_service_code                 AS "treatmentServiceCode",
              tc.treatment_name                         AS "name",
              tc.category::TEXT                         AS "category",
              at.unit_price::float8                     AS "unitPrice",
              at.quantity                               AS "quantity",
              at.line_total::float8                     AS "total",
              at.status::TEXT                           AS "status",
              TO_CHAR(at.performed_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS "performedAt"
       FROM appointment_treatment at
       JOIN treatment_catalogue tc ON tc.treatment_service_code = at.treatment_service_code
       WHERE at.appointment_id = $1
       ORDER BY at.ordered_at, tc.treatment_name`,
      [appointmentId]
    ),
    db.query(
      `SELECT p.prescription_id                         AS "prescriptionId",
              p.medication_id                           AS "medicationId",
              m.generic_name                            AS "genericName",
              m.strength                                AS "strength",
              p.dosage                                  AS "dosage",
              COALESCE(p.frequency, '')                 AS "frequency",
              COALESCE(p.duration_days, 1)              AS "durationDays",
              COALESCE(p.notes, '')                     AS "notes",
              COALESCE(p.allergy_checked, FALSE)        AS "allergyChecked",
              COALESCE(m.contraindications, '')         AS "contraindications"
       FROM prescription p
       JOIN medication m ON m.medication_id = p.medication_id
       WHERE p.appointment_id = $1
       ORDER BY p.created_at, m.generic_name`,
      [appointmentId]
    ),
    db.query(`SELECT invoice_id AS "invoiceId" FROM invoice WHERE appointment_id = $1`, [appointmentId]),
  ]);

  const consultationRow = consultation.rows[0];
  return {
    appointment,
    consultation: consultationRow
      ? ({
          consultationId: String(consultationRow.consultationId),
          symptoms: String(consultationRow.symptoms),
          diagnosis: String(consultationRow.diagnosis),
          notes: String(consultationRow.notes),
          followUpRequired: Boolean(consultationRow.followUpRequired),
          followUpDate: String(consultationRow.followUpDate),
        } satisfies WorkspaceConsultation)
      : null,
    treatments: treatments.rows.map(
      (r): WorkspaceTreatment => ({
        appointmentTreatmentId: String(r.appointmentTreatmentId),
        treatmentServiceCode: String(r.treatmentServiceCode),
        name: String(r.name),
        category: String(r.category) as TreatmentCategory,
        unitPrice: Number(r.unitPrice),
        quantity: Number(r.quantity),
        total: Number(r.total),
        status: dbTreatmentStatusToUi(r.status as DbTreatmentStatus),
        performedAt: r.performedAt ? String(r.performedAt) : undefined,
      })
    ),
    prescriptions: prescriptions.rows.map(
      (r): WorkspacePrescription => ({
        prescriptionId: String(r.prescriptionId),
        medicationId: String(r.medicationId),
        medicationName: [r.genericName, r.strength].filter(Boolean).join(" "),
        dosage: String(r.dosage),
        frequency: String(r.frequency),
        durationDays: Number(r.durationDays),
        notes: String(r.notes),
        allergyChecked: Boolean(r.allergyChecked),
        contraindications: String(r.contraindications),
      })
    ),
    invoiceId: invoice.rows[0] ? String(invoice.rows[0].invoiceId) : null,
    isLocked: appointment.status === "Completed",
  };
}

function procedureArguments(doctorId: string, input: SaveConsultationInput) {
  return [
    input.appointmentId,
    doctorId,
    input.symptoms,
    input.diagnosis,
    input.notes,
    input.followUpRequired,
    input.followUpRequired ? input.followUpDate ?? null : null,
    JSON.stringify(
      input.treatments.map((t) => ({
        treatment_service_code: t.treatmentServiceCode,
        quantity: t.quantity,
      }))
    ),
    JSON.stringify(
      input.prescriptions.map((p) => ({
        medication_id: p.medicationId,
        dosage: p.dosage,
        frequency: p.frequency,
        duration_days: p.durationDays,
        notes: p.notes,
        allergy_checked: p.allergyChecked,
      }))
    ),
  ];
}

const PROCEDURE_PARAMS =
  "$1::uuid, $2::uuid, $3::text, $4::text, $5::text, $6::boolean, $7::date, $8::jsonb, $9::jsonb, NULL::uuid";

// saves the record, treatment orders and prescriptions. Returns the consultation id.
export async function saveConsultationDraft(
  db: Queryable,
  doctorId: string,
  input: SaveConsultationInput
): Promise<string> {
  const { rows } = await db.query(
    `CALL sp_save_consultation(${PROCEDURE_PARAMS})`,
    procedureArguments(doctorId, input)
  );
  return String(rows[0].p_consultation_id);
}

// Saves, locks the appointment and creates the invoice in one transaction.
// Returns the invoice id
export async function completeConsultation(
  db: Queryable,
  doctorId: string,
  input: SaveConsultationInput
): Promise<string> {
  const { rows } = await db.query(
    `CALL sp_complete_consultation(${PROCEDURE_PARAMS})`,
    procedureArguments(doctorId, input)
  );
  return String(rows[0].p_invoice_id);
}

// past records 
export async function fetchConsultationHistory(
  db: Queryable,
  doctorId: string,
  limit = 200
): Promise<ConsultationHistoryItem[]> {
  const { rows } = await db.query(
    `SELECT consultation_rec_id                              AS "consultationId",
            appointment_id                                   AS "appointmentId",
            patient_name                                     AS "patientName",
            TO_CHAR(consultation_date, 'YYYY-MM-DD')         AS "date",
            diagnosis                                        AS "diagnosis",
            follow_up_required                               AS "followUpRequired",
            TO_CHAR(follow_up_date, 'YYYY-MM-DD')            AS "followUpDate",
            record_status                                    AS "status",
            treatment_count::int                             AS "treatmentCount",
            prescription_count::int                          AS "prescriptionCount"
     FROM v_consultation_history
     WHERE doctor_id = $1
     ORDER BY consultation_date DESC, patient_name
     LIMIT $2`,
    [doctorId, limit]
  );

  return rows.map(
    (r): ConsultationHistoryItem => ({
      consultationId: String(r.consultationId),
      appointmentId: String(r.appointmentId),
      patientName: String(r.patientName),
      date: String(r.date),
      diagnosis: r.diagnosis ? String(r.diagnosis) : null,
      followUpRequired: Boolean(r.followUpRequired),
      followUpDate: r.followUpDate ? String(r.followUpDate) : null,
      status: String(r.status) as ConsultationRecordStatus,
      treatmentCount: Number(r.treatmentCount),
      prescriptionCount: Number(r.prescriptionCount),
    })
  );
}
