"use server";
import db from "@/lib/db";
import { requireDoctor } from "@/lib/server/doctorAuth";
import { appointmentIdSchema as idSchema } from "@/lib/server/doctorSchemas";
import { fetchDoctorPatients, fetchPatientDetail } from "@/lib/server/sql/doctorPatients";
import type { DoctorPatientListItem, PatientDetail } from "@/lib/doctorTypes";

// Patients who have had a (non-cancelled) appointment with this doctor.
export async function getDoctorPatients(): Promise<DoctorPatientListItem[]> {
  const doctor = await requireDoctor();
  return fetchDoctorPatients(db, doctor.userId);
}

// Null when the id is invalid or the patient has never booked with this doctor.
export async function getPatientDetail(patientId: string): Promise<PatientDetail | null> {
  const doctor = await requireDoctor();
  const parsed = idSchema.safeParse(patientId);
  if (!parsed.success) return null;
  return fetchPatientDetail(db, doctor.userId, parsed.data);
}
