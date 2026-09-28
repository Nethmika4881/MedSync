import type { TreatmentStatus } from "@/lib/types";

export type DbTreatmentStatus = "Ordered" | "InProgress" | "Completed" | "Cancelled";

const toUi: Record<DbTreatmentStatus, TreatmentStatus> = {
  Ordered: "Ordered",
  InProgress: "In-Progress",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

export const dbTreatmentStatusToUi = (s: DbTreatmentStatus) => toUi[s];

export const uiTreatmentStatusToDb = (s: TreatmentStatus): DbTreatmentStatus => {
  const hit = (Object.keys(toUi) as DbTreatmentStatus[]).find((k) => toUi[k] === s);
  if (!hit) throw new Error(`No DB treatment status for "${s}"`);
  return hit;
};