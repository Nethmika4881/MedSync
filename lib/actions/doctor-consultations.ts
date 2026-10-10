"use server";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { clinicToday, requireDoctor } from "@/lib/server/doctorAuth";
import { toActionError } from "@/lib/server/actionError";
import { appointmentIdSchema, saveConsultationSchema } from "@/lib/server/doctorSchemas";
import {
  completeConsultation as completeConsultationSql,
  fetchConsultationHistory,
  fetchConsultationWorkspace,
  saveConsultationDraft as saveConsultationDraftSql,
} from "@/lib/server/sql/doctorConsultations";
import type {
  ActionResult,
  ConsultationHistoryItem,
  ConsultationWorkspace,
  SaveConsultationInput,
} from "@/lib/doctorTypes";

// Everything the workspace page shows for one appointment, or null when the appointment doesn't exist or belongs to another doctor.
export async function getConsultationWorkspace(
  appointmentId: string
): Promise<ConsultationWorkspace | null> {
  const doctor = await requireDoctor();
  const id = appointmentIdSchema.parse(appointmentId);
  const workspace = await fetchConsultationWorkspace(db, doctor.userId, id);
  if (workspace && workspace.appointment.dateTime.slice(0, 10) > clinicToday()) return null;
  return workspace;
}

async function rejectFutureConsultation(doctorId: string, appointmentId: string) {
  const workspace = await fetchConsultationWorkspace(db, doctorId, appointmentId);
  if (!workspace) throw new Error("Appointment not found for this doctor.");
  if (workspace.appointment.dateTime.slice(0, 10) > clinicToday()) {
    throw new Error("Future-day consultations cannot be edited or completed yet.");
  }
}

// The doctor's saved consultations, newest first.
export async function getDoctorConsultations(): Promise<ConsultationHistoryItem[]> {
  const doctor = await requireDoctor();
  return fetchConsultationHistory(db, doctor.userId);
}

// Save as a draft. The appointment stays open and can be edited again.
export async function saveConsultationDraft(
  input: SaveConsultationInput
): Promise<ActionResult<{ consultationId: string }>> {
  try {
    const doctor = await requireDoctor();
    const valid = saveConsultationSchema.parse(input);
    await rejectFutureConsultation(doctor.userId, valid.appointmentId);
    const consultationId = await saveConsultationDraftSql(db, doctor.userId, valid);
    revalidatePath("/doctor", "layout");
    return { ok: true, data: { consultationId } };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

// Save, lock the appointment and create the invoice, all in one database transaction.
export async function completeConsultation(
  input: SaveConsultationInput
): Promise<ActionResult<{ invoiceId: string }>> {
  try {
    const doctor = await requireDoctor();
    const valid = saveConsultationSchema.parse(input);
    await rejectFutureConsultation(doctor.userId, valid.appointmentId);
    const invoiceId = await completeConsultationSql(db, doctor.userId, valid);
    revalidatePath("/doctor", "layout");
    return { ok: true, data: { invoiceId } };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}
