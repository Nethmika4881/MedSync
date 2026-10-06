import type { DoctorProfile, UpdateProfileInput } from "@/lib/doctorTypes";
import type { Queryable } from "./queryable";

export async function fetchDoctorProfile(db: Queryable, doctorId: string): Promise<DoctorProfile | null> {
  const { rows } = await db.query(
    `SELECT doctor_id                       AS "doctorId",
            full_name                       AS "fullName",
            email                           AS "email",
            medical_licence_no              AS "licenceNo",
            COALESCE(room_no, '')           AS "roomNo",
            COALESCE(qualification, '')     AS "qualification",
            years_experience                AS "yearsExperience",
            consultation_fee::float8        AS "consultationFee",
            COALESCE(is_available, TRUE)    AS "isAvailable",
            branch_name                     AS "branchName",
            COALESCE(phone, '')             AS "phone",
            COALESCE(specializations, '')   AS "specializations"
     FROM v_doctor_profile
     WHERE doctor_id = $1`,
    [doctorId]
  );
  const r = rows[0];
  if (!r) return null;
  return {
    doctorId: String(r.doctorId),
    fullName: String(r.fullName),
    email: String(r.email),
    licenceNo: String(r.licenceNo),
    roomNo: String(r.roomNo),
    qualification: String(r.qualification),
    yearsExperience: r.yearsExperience === null ? null : Number(r.yearsExperience),
    consultationFee: Number(r.consultationFee),
    isAvailable: Boolean(r.isAvailable),
    branchName: String(r.branchName),
    phone: String(r.phone),
    specializations: String(r.specializations),
  };
}

export async function updateDoctorProfile(
  db: Queryable,
  doctorId: string,
  input: UpdateProfileInput
): Promise<void> {
  await db.query("CALL sp_update_doctor_profile($1::uuid, $2, $3, $4::int, $5::boolean, $6)", [
    doctorId,
    input.roomNo,
    input.qualification,
    input.yearsExperience,
    input.isAvailable,
    input.phone,
  ]);
}

// The stored hash and salt, for checking the current password.
export async function fetchPasswordCredentials(
  db: Queryable,
  doctorId: string
): Promise<{ hash: string; salt: string } | null> {
  const { rows } = await db.query(`SELECT password_hash, salt FROM app_user WHERE user_id = $1`, [doctorId]);
  const r = rows[0];
  if (!r || !r.password_hash || !r.salt) return null;
  return { hash: String(r.password_hash), salt: String(r.salt) };
}

export async function storePassword(db: Queryable, doctorId: string, hash: string, salt: string): Promise<void> {
  await db.query(`UPDATE app_user SET password_hash = $2, salt = $3, updated_at = NOW() WHERE user_id = $1`, [
    doctorId,
    hash,
    salt,
  ]);
}
