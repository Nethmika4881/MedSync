import type { DoctorPatientListItem, PatientDetail, PatientHistoryVisit } from "@/lib/doctorTypes";
import type { Queryable } from "./queryable";

export async function fetchDoctorPatients(db: Queryable, doctorId: string): Promise<DoctorPatientListItem[]> {
  const { rows } = await db.query(
    `SELECT patient_id                             AS "patientId",
            patient_name                           AS "patientName",
            age                                    AS "age",
            COALESCE(gender, '')                   AS "gender",
            COALESCE(blood_group, '')              AS "bloodGroup",
            visit_count::int                       AS "visitCount",
            TO_CHAR(last_visit_date, 'YYYY-MM-DD') AS "lastVisitDate"
     FROM v_doctor_patients
     WHERE doctor_id = $1
     ORDER BY last_visit_date DESC, patient_name`,
    [doctorId]
  );
  return rows.map((r) => ({
    patientId: String(r.patientId),
    patientName: String(r.patientName),
    age: r.age === null ? null : Number(r.age),
    gender: String(r.gender),
    bloodGroup: String(r.bloodGroup),
    visitCount: Number(r.visitCount),
    lastVisitDate: String(r.lastVisitDate),
  }));
}

export async function fetchPatientDetail(
  db: Queryable,
  doctorId: string,
  patientId: string
): Promise<PatientDetail | null> {
  const { rows } = await db.query(
    `SELECT p.patient_id                                   AS "patientId",
            u.full_name                                    AS "fullName",
            fn_age_years(u.dob)                            AS "age",
            COALESCE(u.gender::TEXT, '')                   AS "gender",
            COALESCE(p.blood_group, '')                    AS "bloodGroup",
            COALESCE((SELECT cn.number FROM contact_number cn
                       WHERE cn.contact_id = u.contact_id
                       ORDER BY cn.is_primary DESC NULLS LAST, cn.contact_number_id
                       LIMIT 1), '')                       AS "phone",
            COALESCE(p.emergency_contact_name, '')         AS "ecName",
            COALESCE(p.emergency_contact_phone, '')        AS "ecPhone",
            COALESCE(p.emergency_contact_relationship, '') AS "ecRelationship"
     FROM patient p
     JOIN app_user u ON u.user_id = p.patient_id
     WHERE p.patient_id = $2
       AND EXISTS (SELECT 1 FROM v_doctor_patients vp
                    WHERE vp.doctor_id = $1 AND vp.patient_id = p.patient_id)`,
    [doctorId, patientId]
  );
  const r = rows[0];
  if (!r) return null;

  const visits = await db.query(
    `SELECT a.appointment_id                         AS "appointmentId",
            TO_CHAR(ts.available_date, 'YYYY-MM-DD') AS "date",
            du.full_name                             AS "doctorName",
            (ts.doctor_id = $1)                      AS "isMine",
            COALESCE(cr.symptoms, '')                AS "symptoms",
            COALESCE(cr.diagnosis, '')               AS "diagnosis",
            COALESCE(cr.notes, '')                   AS "notes",
            COALESCE(cr.follow_up_required, FALSE)   AS "followUpRequired",
            TO_CHAR(cr.follow_up_date, 'YYYY-MM-DD') AS "followUpDate",
            COALESCE((SELECT JSON_AGG(JSON_BUILD_OBJECT('name', tc.treatment_name, 'quantity', at.quantity)
                                      ORDER BY at.performed_at)
                        FROM appointment_treatment at
                        JOIN treatment_catalogue tc ON tc.treatment_service_code = at.treatment_service_code
                       WHERE at.appointment_id = a.appointment_id), '[]'::JSON) AS "treatments",
            COALESCE((SELECT JSON_AGG(JSON_BUILD_OBJECT('medication', m.generic_name,
                                                        'dosage', pr.dosage,
                                                        'frequency', COALESCE(pr.frequency, ''),
                                                        'durationDays', pr.duration_days)
                                      ORDER BY pr.created_at)
                        FROM prescription pr
                        JOIN medication m ON m.medication_id = pr.medication_id
                       WHERE pr.appointment_id = a.appointment_id), '[]'::JSON) AS "prescriptions"
     FROM consultation_record cr
     JOIN appointment a  ON a.appointment_id = cr.appointment_id
     JOIN time_slot   ts ON ts.time_slot_id  = a.time_slot_id
     JOIN app_user    du ON du.user_id       = ts.doctor_id
     WHERE a.patient_id = $2
     ORDER BY ts.available_date DESC, cr.created_at DESC`,
    [doctorId, patientId]
  );

  const history = visits.rows.map(
    (v): PatientHistoryVisit => ({
      appointmentId: String(v.appointmentId),
      date: String(v.date),
      doctorName: String(v.doctorName),
      isMine: Boolean(v.isMine),
      symptoms: String(v.symptoms),
      diagnosis: String(v.diagnosis),
      notes: String(v.notes),
      followUpRequired: Boolean(v.followUpRequired),
      followUpDate: v.followUpDate ? String(v.followUpDate) : null,
      treatments: v.treatments as PatientHistoryVisit["treatments"],
      prescriptions: v.prescriptions as PatientHistoryVisit["prescriptions"],
    })
  );

  return {
    patientId: String(r.patientId),
    fullName: String(r.fullName),
    age: r.age === null ? null : Number(r.age),
    gender: String(r.gender),
    bloodGroup: String(r.bloodGroup),
    phone: String(r.phone),
    emergencyContactName: String(r.ecName),
    emergencyContactPhone: String(r.ecPhone),
    emergencyContactRelationship: String(r.ecRelationship),
    history,
  };
}
