"use server";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireDoctor } from "@/lib/server/doctorAuth";
import { toActionError } from "@/lib/server/actionError";
import { appointmentIdSchema as idSchema, scheduleSlotSchema } from "@/lib/server/doctorSchemas";
import {
  addScheduleSlot as addScheduleSlotSql,
  fetchBranchOptions,
  fetchDoctorSchedule,
  removeScheduleSlot as removeScheduleSlotSql,
  updateScheduleSlot as updateScheduleSlotSql,
} from "@/lib/server/sql/doctorSchedule";
import type { ActionResult, BranchOption, ScheduleSlotInput } from "@/lib/doctorTypes";
import type { DoctorScheduleSlot } from "@/lib/types";

export async function getDoctorSchedule(): Promise<DoctorScheduleSlot[]> {
  const doctor = await requireDoctor();
  return fetchDoctorSchedule(db, doctor.userId);
}

export async function getBranchOptions(): Promise<BranchOption[]> {
  await requireDoctor();
  return fetchBranchOptions(db);
}

export async function addScheduleSlot(slot: ScheduleSlotInput): Promise<ActionResult> {
  try {
    const doctor = await requireDoctor();
    await addScheduleSlotSql(db, doctor.userId, scheduleSlotSchema.parse(slot) as ScheduleSlotInput);
    revalidatePath("/doctor/settings");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function updateScheduleSlot(
  scheduleId: string,
  slot: ScheduleSlotInput
): Promise<ActionResult> {
  try {
    const doctor = await requireDoctor();
    const found = await updateScheduleSlotSql(
      db,
      doctor.userId,
      idSchema.parse(scheduleId),
      scheduleSlotSchema.parse(slot) as ScheduleSlotInput
    );
    if (!found) return { ok: false, error: "That working-hours slot no longer exists." };
    revalidatePath("/doctor/settings");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function removeScheduleSlot(scheduleId: string): Promise<ActionResult> {
  try {
    const doctor = await requireDoctor();
    const found = await removeScheduleSlotSql(db, doctor.userId, idSchema.parse(scheduleId));
    if (!found) return { ok: false, error: "That working-hours slot no longer exists." };
    revalidatePath("/doctor/settings");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}
