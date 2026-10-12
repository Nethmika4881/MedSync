"use server";
import db from "@/lib/db";
import { clinicToday, requireDoctor } from "@/lib/server/doctorAuth";
import {
  fetchDoctorNotifications,
  markDoctorNotificationRead as markReadSql,
  markDoctorNotificationsRead as markAllReadSql,
} from "@/lib/server/sql/doctorNotifications";
import type { DoctorNotification } from "@/lib/doctorTypes";

// What needs the doctor's attention right now; read state is persisted per doctor.
export async function getDoctorNotifications(): Promise<DoctorNotification[]> {
  const doctor = await requireDoctor();
  return fetchDoctorNotifications(db, doctor.userId, clinicToday());
}

export async function markDoctorNotificationRead(notificationId: string): Promise<void> {
  const doctor = await requireDoctor();
  if (!notificationId || notificationId.length > 255) throw new Error("Invalid notification.");
  await markReadSql(db, doctor.userId, notificationId);
}

export async function markAllDoctorNotificationsRead(notificationIds: string[]): Promise<void> {
  const doctor = await requireDoctor();
  const ids = notificationIds
    .filter((id) => typeof id === "string" && id.length > 0 && id.length <= 255)
    .slice(0, 100);
  await markAllReadSql(db, doctor.userId, ids);
}
