import type { AppointmentStatus } from "@/lib/types";

export type DbAppointmentStatus =
  | "Scheduled" 
  | "CheckedIn" 
  | "InProgress"
  | "Completed" 
  | "Cancelled" 
  | "NoShow" 
  | "Rescheduled";

const toUi: Record<DbAppointmentStatus, AppointmentStatus> = {
  Scheduled: "Confirmed",
  CheckedIn: "Checked-in",
  InProgress: "In-Progress",
  Completed: "Completed",
  Cancelled: "Cancelled",
  NoShow: "No-Show",
  Rescheduled: "Rescheduled",
};

export const dbStatusToUi = (s: DbAppointmentStatus) => toUi[s];

export const uiStatusToDb = (s: AppointmentStatus): DbAppointmentStatus => {
  const hit = (Object.keys(toUi) as DbAppointmentStatus[]).find((k) => toUi[k] === s);
  if (!hit) throw new Error(`No DB status for "${s}"`);
  return hit;
};
