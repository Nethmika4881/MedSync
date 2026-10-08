"use server";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { clinicToday, requireDoctor } from "@/lib/server/doctorAuth";
import { toActionError } from "@/lib/server/actionError";
import { appointmentIdSchema, dateSchema } from "@/lib/server/doctorSchemas";
import {
  fetchDoctorAppointments,
  startConsultation as startConsultationSql,
} from "@/lib/server/sql/doctorAppointments";
import type { ActionResult } from "@/lib/doctorTypes";
import type { Appointment } from "@/lib/types";

export async function getDoctorAppointments(
  fromDate?: string,
  toDate?: string
): Promise<Appointment[]> {
  const doctor = await requireDoctor();
  const from = dateSchema.parse(fromDate ?? clinicToday());
  const to = dateSchema.parse(toDate ?? from);
  return fetchDoctorAppointments(db, doctor.userId, from, to);
}

export async function startConsultation(appointmentId: string): Promise<ActionResult> {
  try {
    const doctor = await requireDoctor();
    await startConsultationSql(db, doctor.userId, appointmentIdSchema.parse(appointmentId));
    revalidatePath("/doctor", "layout");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}
