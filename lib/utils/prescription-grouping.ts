// lib/utils/prescription-grouping.ts
// Utility to group flat prescription records by appointment ID.

import type { PatientPrescriptionItem } from "@/lib/actions/patient-prescriptions";

export interface AppointmentPrescriptionGroup {
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  branchName: string;
  issuedDate: string;
  createdAt: string;
  medicines: PatientPrescriptionItem[];
}

/**
 * Groups a list of prescription items by their appointment ID.
 * Ensures that medicines belonging to the same appointment ID are grouped together
 * and appointments with different IDs (even with same date or doctor) remain separate.
 */
export function groupPrescriptionsByAppointment(
  items: PatientPrescriptionItem[]
): AppointmentPrescriptionGroup[] {
  const groupsMap = new Map<string, AppointmentPrescriptionGroup>();

  for (const item of items) {
    let group = groupsMap.get(item.appointmentId);
    if (!group) {
      group = {
        appointmentId: item.appointmentId,
        doctorId: item.doctorId,
        doctorName: item.doctorName,
        branchName: item.branchName,
        issuedDate: item.issuedDate,
        createdAt: item.createdAt,
        medicines: [],
      };
      groupsMap.set(item.appointmentId, group);
    }
    group.medicines.push(item);
  }

  return Array.from(groupsMap.values());
}
