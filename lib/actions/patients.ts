"use server";
// lib/actions/patients.ts

import { sql } from "@/lib/db";
import type { Patient, PatientAllergy, PatientCondition } from "@/lib/types";
import { revalidatePath } from "next/cache";

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getPatients(branchId?: string): Promise<Patient[]> {
  const rows = branchId
    ? await sql`
        SELECT
          patient_id          AS "patientId",
          full_name           AS "name",
          date_of_birth       AS "dateOfBirth",
          gender              AS "gender",
          blood_group         AS "bloodGroup",
          phone               AS "phone",
          email               AS "email",
          address             AS "address",
          branch_id           AS "branchId",
          registered_at       AS "registeredAt",
          is_active           AS "isActive",
          UPPER(LEFT(full_name, 2)) AS "avatar"
        FROM patient
        WHERE branch_id = ${branchId}
        ORDER BY full_name ASC
      `
    : await sql`
        SELECT
          patient_id          AS "patientId",
          full_name           AS "name",
          date_of_birth       AS "dateOfBirth",
          gender              AS "gender",
          blood_group         AS "bloodGroup",
          phone               AS "phone",
          email               AS "email",
          address             AS "address",
          branch_id           AS "branchId",
          registered_at       AS "registeredAt",
          is_active           AS "isActive",
          UPPER(LEFT(full_name, 2)) AS "avatar"
        FROM patient
        ORDER BY full_name ASC
      `;
  return rows as Patient[];
}

export async function getPatientById(patientId: string): Promise<Patient | null> {
  const rows = await sql`
    SELECT
      patient_id          AS "patientId",
      full_name           AS "name",
      date_of_birth       AS "dateOfBirth",
      gender              AS "gender",
      blood_group         AS "bloodGroup",
      phone               AS "phone",
      email               AS "email",
      address             AS "address",
      branch_id           AS "branchId",
      registered_at       AS "registeredAt",
      is_active           AS "isActive",
      UPPER(LEFT(full_name, 2)) AS "avatar"
    FROM patient
    WHERE patient_id = ${patientId}
  `;
  return (rows[0] as Patient) ?? null;
}

export async function getPatientAllergies(patientId: string): Promise<PatientAllergy[]> {
  const rows = await sql`
    SELECT
      allergy_id    AS "allergyId",
      patient_id    AS "patientId",
      allergen_name AS "allergenName",
      reaction      AS "reaction",
      severity      AS "severity"
    FROM patient_allergy
    WHERE patient_id = ${patientId}
  `;
  return rows as PatientAllergy[];
}

export async function getPatientConditions(patientId: string): Promise<PatientCondition[]> {
  const rows = await sql`
    SELECT
      condition_id    AS "conditionId",
      patient_id      AS "patientId",
      condition_name  AS "conditionName",
      diagnosed_date  AS "diagnosedDate",
      is_active       AS "isActive",
      notes           AS "notes"
    FROM patient_condition
    WHERE patient_id = ${patientId}
    ORDER BY diagnosed_date DESC
  `;
  return rows as PatientCondition[];
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createPatient(data: {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  phone: string;
  email: string;
  address: string;
  branchId: string;
}): Promise<{ patientId: string }> {
  const rows = await sql`
    INSERT INTO patient
      (full_name, date_of_birth, gender, blood_group, phone, email, address, branch_id)
    VALUES
      (${data.fullName}, ${data.dateOfBirth}, ${data.gender}, ${data.bloodGroup},
       ${data.phone}, ${data.email}, ${data.address}, ${data.branchId})
    RETURNING patient_id AS "patientId"
  `;
  revalidatePath("/patients");
  return rows[0] as { patientId: string };
}

export async function updatePatient(
  patientId: string,
  data: Partial<{
    fullName: string;
    phone: string;
    email: string;
    address: string;
  }>
): Promise<void> {
  await sql`
    UPDATE patient
    SET
      full_name  = COALESCE(${data.fullName ?? null}, full_name),
      phone      = COALESCE(${data.phone ?? null},    phone),
      email      = COALESCE(${data.email ?? null},    email),
      address    = COALESCE(${data.address ?? null},  address),
      updated_at = NOW()
    WHERE patient_id = ${patientId}
  `;
  revalidatePath("/patients");
}

export async function addPatientAllergy(data: Omit<PatientAllergy, "allergyId">): Promise<void> {
  await sql`
    INSERT INTO patient_allergy (patient_id, allergen_name, reaction, severity)
    VALUES (${data.patientId}, ${data.allergenName}, ${data.reaction}, ${data.severity})
  `;
}

export async function removePatientAllergy(allergyId: string): Promise<void> {
  await sql`DELETE FROM patient_allergy WHERE allergy_id = ${allergyId}`;
}
