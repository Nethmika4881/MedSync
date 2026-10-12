// lib/actions/patients.ts
// Internal helper functions for patient operations (not exposed as public server actions)

import pool from "@/lib/db";
import type { Patient, PatientAllergy, PatientCondition } from "@/lib/types";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { revalidatePath } from "next/cache";

async function requireStaffUser() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "doctor" && user.role !== "receptionist")) {
    throw new Error("Unauthorized: Staff access required");
  }
  return user;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getPatients(branchId?: string): Promise<Patient[]> {
  const user = await requireStaffUser();
  const effectiveBranchId = user.role === "admin" ? branchId : user.branchId;

  const query = effectiveBranchId
    ? {
        text: `
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
          WHERE branch_id = $1
          ORDER BY full_name ASC
        `,
        values: [effectiveBranchId],
      }
    : {
        text: `
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
        `,
        values: [],
      };

  const { rows } = await pool.query(query);
  return rows as Patient[];
}

export async function getPatientById(patientId: string): Promise<Patient | null> {
  await requireStaffUser();

  const { rows } = await pool.query(
    `SELECT
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
     WHERE patient_id = $1`,
    [patientId]
  );
  return (rows[0] as Patient) ?? null;
}

export async function getPatientAllergies(patientId: string): Promise<PatientAllergy[]> {
  await requireStaffUser();

  const { rows } = await pool.query(
    `SELECT
       allergy_id    AS "allergyId",
       patient_id    AS "patientId",
       allergen_name AS "allergenName",
       reaction      AS "reaction",
       severity      AS "severity"
     FROM patient_allergy
     WHERE patient_id = $1`,
    [patientId]
  );
  return rows as PatientAllergy[];
}

export async function getPatientConditions(patientId: string): Promise<PatientCondition[]> {
  await requireStaffUser();

  const { rows } = await pool.query(
    `SELECT
       condition_id    AS "conditionId",
       patient_id      AS "patientId",
       condition_name  AS "conditionName",
       diagnosed_date  AS "diagnosedDate",
       is_active       AS "isActive",
       notes           AS "notes"
     FROM patient_condition
     WHERE patient_id = $1
     ORDER BY diagnosed_date DESC`,
    [patientId]
  );
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
  await requireStaffUser();

  const { rows } = await pool.query(
    `INSERT INTO patient
       (full_name, date_of_birth, gender, blood_group, phone, email, address, branch_id)
     VALUES
       ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING patient_id AS "patientId"`,
    [
      data.fullName,
      data.dateOfBirth,
      data.gender,
      data.bloodGroup,
      data.phone,
      data.email,
      data.address,
      data.branchId,
    ]
  );
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
  await requireStaffUser();

  await pool.query(
    `UPDATE patient
     SET
       full_name  = COALESCE($1, full_name),
       phone      = COALESCE($2, phone),
       email      = COALESCE($3, email),
       address    = COALESCE($4, address),
       updated_at = NOW()
     WHERE patient_id = $5`,
    [data.fullName ?? null, data.phone ?? null, data.email ?? null, data.address ?? null, patientId]
  );
  revalidatePath("/patients");
}

export async function addPatientAllergy(data: Omit<PatientAllergy, "allergyId">): Promise<void> {
  await requireStaffUser();

  await pool.query(
    `INSERT INTO patient_allergy (patient_id, allergen_name, reaction, severity)
     VALUES ($1, $2, $3, $4)`,
    [data.patientId, data.allergenName, data.reaction, data.severity]
  );
}

export async function removePatientAllergy(allergyId: string): Promise<void> {
  await requireStaffUser();

  await pool.query(`DELETE FROM patient_allergy WHERE allergy_id = $1`, [allergyId]);
}
