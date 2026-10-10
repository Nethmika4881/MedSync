"use server";
import db from "@/lib/db";
import { clinicToday, requireDoctor } from "@/lib/server/doctorAuth";
import { fetchDoctorNotifications } from "@/lib/server/sql/doctorNotifications";
import type { DoctorNotification } from "@/lib/doctorTypes";

// What needs the doctor's attention right now. Derived on demand, so there is no read/unread state.
export async function getDoctorNotifications(): Promise<DoctorNotification[]> {
  const doctor = await requireDoctor();
  return fetchDoctorNotifications(db, doctor.userId, clinicToday());
}
