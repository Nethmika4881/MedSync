"use server";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireDoctor } from "@/lib/server/doctorAuth";
import { toActionError } from "@/lib/server/actionError";
import { changePasswordSchema, updateProfileSchema } from "@/lib/server/doctorSchemas";
import {
  fetchDoctorProfile,
  fetchPasswordCredentials,
  storePassword,
  updateDoctorProfile as updateDoctorProfileSql,
} from "@/lib/server/sql/doctorProfile";
import { comparePassword, generateSalt, hashPassword } from "@/lib/actions/passwordHasher";
import type { ActionResult, ChangePasswordInput, DoctorProfile, UpdateProfileInput } from "@/lib/doctorTypes";

export async function getDoctorProfile(): Promise<DoctorProfile | null> {
  const doctor = await requireDoctor();
  return fetchDoctorProfile(db, doctor.userId);
}

export async function updateDoctorProfile(input: UpdateProfileInput): Promise<ActionResult> {
  try {
    const doctor = await requireDoctor();
    await updateDoctorProfileSql(db, doctor.userId, updateProfileSchema.parse(input));
    revalidatePath("/doctor", "layout");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function changeDoctorPassword(input: ChangePasswordInput): Promise<ActionResult> {
  try {
    const doctor = await requireDoctor();
    const valid = changePasswordSchema.parse(input);

    const current = await fetchPasswordCredentials(db, doctor.userId);
    if (!current) return { ok: false, error: "Your account has no password set." };

    let matches = false;
    try {
      matches = await comparePassword({
        hashedPassword: current.hash,
        password: valid.currentPassword,
        salt: current.salt,
      });
    } catch {
      matches = false; // malformed stored hash: treat as a mismatch
    }
    if (!matches) return { ok: false, error: "Current password is incorrect." };
    if (valid.currentPassword === valid.newPassword) {
      return { ok: false, error: "New password must be different from the current one." };
    }

    const salt = generateSalt();
    await storePassword(db, doctor.userId, await hashPassword(valid.newPassword, salt), salt);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}
