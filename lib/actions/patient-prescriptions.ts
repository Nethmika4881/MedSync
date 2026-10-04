"use server";
// lib/actions/patient-prescriptions.ts
// Server action for retrieving patient prescription history from PostgreSQL.
// Derives patientId strictly from the authenticated session.
// Strictly enforces patient data ownership.

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";

export interface PatientPrescriptionItem {
  prescriptionId: string;
  appointmentId: string;
  medicationId: string;
  genericName: string;
  brandName: string | null;
  medicationName: string;
  strength: string | null;
  form: string | null;
  category: string | null;
  dosage: string;
  frequency: string | null;
  durationDays: number | null;
  notes: string | null;
  allergyChecked: boolean;
  createdAt: string;
  issuedDate: string;
  doctorId: string;
  doctorName: string;
  branchName: string;
  isActive: boolean;
  endDate: string | null;
}

/**
 * Loads all prescriptions belonging to the authenticated patient.
 * Joins prescription through appointment -> time_slot -> doctor -> employee -> app_user,
 * and prescription -> medication.
 */
export async function getPatientPrescriptions(): Promise<PatientPrescriptionItem[]> {
  const user = await getCurrentUser();
  if (!user || user.role !== "patient") {
    return [];
  }

  const patientId = user.userId;

  try {
    const { rows } = await db.query(
      `SELECT
         pr.prescription_id                       AS "prescriptionId",
         pr.appointment_id                        AS "appointmentId",
         pr.medication_id                         AS "medicationId",
         m.generic_name                           AS "genericName",
         m.brand_name                             AS "brandName",
         COALESCE(m.brand_name, m.generic_name)   AS "medicationName",
         m.strength                               AS "strength",
         m.form                                   AS "form",
         m.category                               AS "category",
         pr.dosage                                AS "dosage",
         pr.frequency                             AS "frequency",
         pr.duration_days                         AS "durationDays",
         pr.notes                                 AS "notes",
         pr.allergy_checked                       AS "allergyChecked",
         TO_CHAR(pr.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt",
         TO_CHAR(pr.created_at, 'YYYY-MM-DD')     AS "issuedDate",
         s.doctor_id                              AS "doctorId",
         u.full_name                              AS "doctorName",
         b.branch_name                            AS "branchName",
         -- Active vs Past classification:
         -- If duration_days is specified, prescription is active while (created_at::date + duration_days) >= CURRENT_DATE.
         -- If duration_days is unspecified, active if prescribed within the last 30 days.
         CASE
           WHEN pr.duration_days IS NOT NULL AND pr.duration_days > 0 THEN
             (pr.created_at::date + pr.duration_days) >= CURRENT_DATE
           ELSE
             pr.created_at >= (CURRENT_DATE - INTERVAL '30 days')
         END AS "isActive",
         CASE
           WHEN pr.duration_days IS NOT NULL AND pr.duration_days > 0 THEN
             TO_CHAR(pr.created_at::date + pr.duration_days, 'YYYY-MM-DD')
           ELSE
             NULL
         END AS "endDate"
       FROM prescription pr
       JOIN appointment a ON a.appointment_id = pr.appointment_id
       JOIN medication m ON m.medication_id = pr.medication_id
       JOIN time_slot s ON s.time_slot_id = a.time_slot_id
       JOIN doctor d ON d.doctor_id = s.doctor_id
       JOIN employee e ON e.employee_id = d.doctor_id
       JOIN app_user u ON u.user_id = e.employee_id
       JOIN branch b ON b.branch_id = s.branch_id
       WHERE a.patient_id = $1
       ORDER BY pr.created_at DESC`,
      [patientId]
    );

    return rows as PatientPrescriptionItem[];
  } catch (err) {
    console.error("[getPatientPrescriptions] Failed to fetch prescriptions:", err);
    return [];
  }
}
