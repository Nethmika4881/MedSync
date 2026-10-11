"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { getDoctorDirectory, type DoctorDirectoryItem } from "@/lib/actions/doctors";
import db from "@/lib/db";
import type { ActionResult, BranchOption, ScheduleSlotInput } from "@/lib/doctorTypes";
import { appointmentIdSchema as idSchema, scheduleSlotSchema } from "@/lib/server/doctorSchemas";
import {
  addScheduleSlot,
  fetchAdminDoctorSchedules,
  fetchBranchOptions,
  removeScheduleSlot,
  updateScheduleSlot,
} from "@/lib/server/sql/doctorSchedule";
import type { Queryable } from "@/lib/server/sql/queryable";
import type { DoctorScheduleSlot } from "@/lib/types";

export interface AdminDoctorScheduleData {
  doctors: DoctorDirectoryItem[];
  branches: BranchOption[];
  schedules: DoctorScheduleSlot[];
}

async function requireAdminForPage(): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?clear=1");
  }

  if (user.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "admin";
}

async function checkDoctorAndBranch(
  client: Queryable,
  doctorId: string,
  branchId: string,
): Promise<void> {
  const { rows } = await client.query(
    `SELECT
       EXISTS (
         SELECT 1
         FROM doctor
         INNER JOIN employee ON employee.employee_id = doctor.doctor_id
         WHERE doctor.doctor_id = $1
           AND employee.is_active = TRUE
       ) AS "doctorIsActive",
       EXISTS (
         SELECT 1
         FROM branch
         WHERE branch_id = $2
           AND is_active = TRUE
       ) AS "branchIsActive"`,
    [doctorId, branchId],
  );

  if (!rows[0]?.doctorIsActive) {
    throw new Error("The selected doctor was not found or is inactive.");
  }

  if (!rows[0]?.branchIsActive) {
    throw new Error("Please select an active branch.");
  }
}

async function checkActiveDoctor(client: Queryable, doctorId: string): Promise<void> {
  const { rows } = await client.query(
    `SELECT EXISTS (
       SELECT 1
       FROM doctor
       INNER JOIN employee ON employee.employee_id = doctor.doctor_id
       WHERE doctor.doctor_id = $1
         AND employee.is_active = TRUE
     ) AS "doctorIsActive"`,
    [doctorId],
  );

  if (!rows[0]?.doctorIsActive) {
    throw new Error("The selected doctor was not found or is inactive.");
  }
}

async function syncNextTwoWeeks(
  client: Queryable,
  doctorId: string,
): Promise<void> {
  await client.query(
    `SELECT fn_sync_time_slots(
       $1::uuid,
       CURRENT_DATE,
       CURRENT_DATE + 14
     )`,
    [doctorId],
  );
}

function scheduleActionError(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Invalid schedule details.";
  }

  if (error instanceof Error) {
    const code = (error as Error & { code?: string }).code;

    if (code === "P0001") {
      return error.message;
    }

    if (
      error.message === "The selected doctor was not found or is inactive." ||
      error.message === "Please select an active branch."
    ) {
      return error.message;
    }
  }

  console.error("[admin doctor schedules] action failed:", error);
  return "Unable to save the doctor's working hours. Please try again.";
}

function revalidateSchedulePages(doctorId: string): void {
  revalidatePath("/admin/doctors/schedules");
  revalidatePath("/doctor/settings");
  revalidatePath("/patient/find-doctors");
  revalidatePath(`/admin/doctors/${doctorId}`);
}

export async function getAdminDoctorScheduleData(): Promise<AdminDoctorScheduleData> {
  await requireAdminForPage();

  const [doctors, branches, schedules] = await Promise.all([
    getDoctorDirectory(),
    fetchBranchOptions(db),
    fetchAdminDoctorSchedules(db),
  ]);

  return { doctors, branches, schedules };
}

export async function addAdminDoctorSchedule(
  unsafeDoctorId: unknown,
  unsafeSlot: unknown,
): Promise<ActionResult> {
  if (!(await isAdmin())) {
    return { ok: false, error: "Only administrators can manage doctor schedules." };
  }

  const client = await db.connect();

  try {
    const doctorId = idSchema.parse(unsafeDoctorId);
    const slot = scheduleSlotSchema.parse(unsafeSlot) as ScheduleSlotInput;

    await client.query("BEGIN");
    await checkDoctorAndBranch(client, doctorId, slot.branchId);
    await addScheduleSlot(client, doctorId, slot);
    await syncNextTwoWeeks(client, doctorId);
    await client.query("COMMIT");

    revalidateSchedulePages(doctorId);
    return { ok: true, data: undefined };
  } catch (error) {
    await client.query("ROLLBACK");
    return { ok: false, error: scheduleActionError(error) };
  } finally {
    client.release();
  }
}

export async function updateAdminDoctorSchedule(
  unsafeDoctorId: unknown,
  unsafeScheduleId: unknown,
  unsafeSlot: unknown,
): Promise<ActionResult> {
  if (!(await isAdmin())) {
    return { ok: false, error: "Only administrators can manage doctor schedules." };
  }

  const client = await db.connect();

  try {
    const doctorId = idSchema.parse(unsafeDoctorId);
    const scheduleId = idSchema.parse(unsafeScheduleId);
    const slot = scheduleSlotSchema.parse(unsafeSlot) as ScheduleSlotInput;

    await client.query("BEGIN");
    await checkDoctorAndBranch(client, doctorId, slot.branchId);

    const found = await updateScheduleSlot(client, doctorId, scheduleId, slot);

    if (!found) {
      await client.query("ROLLBACK");
      return { ok: false, error: "That working hours period no longer exists." };
    }

    await syncNextTwoWeeks(client, doctorId);
    await client.query("COMMIT");

    revalidateSchedulePages(doctorId);
    return { ok: true, data: undefined };
  } catch (error) {
    await client.query("ROLLBACK");
    return { ok: false, error: scheduleActionError(error) };
  } finally {
    client.release();
  }
}

export async function removeAdminDoctorSchedule(
  unsafeDoctorId: unknown,
  unsafeScheduleId: unknown,
): Promise<ActionResult> {
  if (!(await isAdmin())) {
    return { ok: false, error: "Only administrators can manage doctor schedules." };
  }

  const client = await db.connect();

  try {
    const doctorId = idSchema.parse(unsafeDoctorId);
    const scheduleId = idSchema.parse(unsafeScheduleId);

    await client.query("BEGIN");
    await checkActiveDoctor(client, doctorId);
    const found = await removeScheduleSlot(client, doctorId, scheduleId);

    if (!found) {
      await client.query("ROLLBACK");
      return { ok: false, error: "That working hours period no longer exists." };
    }

    await client.query("COMMIT");

    revalidateSchedulePages(doctorId);
    return { ok: true, data: undefined };
  } catch (error) {
    await client.query("ROLLBACK");
    return { ok: false, error: scheduleActionError(error) };
  } finally {
    client.release();
  }
}
