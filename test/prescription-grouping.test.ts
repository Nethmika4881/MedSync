import test from "node:test";
import assert from "node:assert/strict";
import { groupPrescriptionsByAppointment } from "../lib/utils/prescription-grouping.ts";
import type { PatientPrescriptionItem } from "../lib/actions/patient-prescriptions.ts";

function createMockItem(overrides: Partial<PatientPrescriptionItem>): PatientPrescriptionItem {
  return {
    prescriptionId: "pr-default",
    appointmentId: "ap-default",
    medicationId: "med-default",
    genericName: "Paracetamol",
    brandName: null,
    medicationName: "Paracetamol",
    strength: "500mg",
    form: "Tablet",
    category: "Analgesic",
    dosage: "500mg",
    frequency: "TDS",
    durationDays: 5,
    notes: "Take after meals",
    allergyChecked: true,
    createdAt: "2026-10-01T10:00:00Z",
    issuedDate: "2026-10-01",
    doctorId: "doc-1",
    doctorName: "Dr. Kasun Bandara",
    branchName: "Colombo",
    isActive: true,
    endDate: "2026-10-06",
    ...overrides,
  };
}

test("1. Groups multiple medicines from the same appointment into one group", () => {
  const items: PatientPrescriptionItem[] = [
    createMockItem({
      prescriptionId: "pr-1",
      appointmentId: "ap-100",
      medicationName: "Atorvastatin",
      isActive: true,
    }),
    createMockItem({
      prescriptionId: "pr-2",
      appointmentId: "ap-100",
      medicationName: "Paracetamol",
      isActive: false,
    }),
  ];

  const groups = groupPrescriptionsByAppointment(items);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].appointmentId, "ap-100");
  assert.equal(groups[0].doctorName, "Dr. Kasun Bandara");
  assert.equal(groups[0].medicines.length, 2);
  assert.equal(groups[0].medicines[0].prescriptionId, "pr-1");
  assert.equal(groups[0].medicines[0].isActive, true);
  assert.equal(groups[0].medicines[1].prescriptionId, "pr-2");
  assert.equal(groups[0].medicines[1].isActive, false);
});

test("2. Keeps medicines from different appointments in separate groups", () => {
  const items: PatientPrescriptionItem[] = [
    createMockItem({
      prescriptionId: "pr-1",
      appointmentId: "ap-101",
      medicationName: "Amoxicillin",
    }),
    createMockItem({
      prescriptionId: "pr-2",
      appointmentId: "ap-102",
      medicationName: "Omeprazole",
    }),
  ];

  const groups = groupPrescriptionsByAppointment(items);

  assert.equal(groups.length, 2);
  assert.equal(groups[0].appointmentId, "ap-101");
  assert.equal(groups[0].medicines.length, 1);
  assert.equal(groups[1].appointmentId, "ap-102");
  assert.equal(groups[1].medicines.length, 1);
});

test("3. Does not group medicines from different appointments even with identical date and doctor", () => {
  const items: PatientPrescriptionItem[] = [
    createMockItem({
      prescriptionId: "pr-1",
      appointmentId: "ap-201",
      doctorName: "Dr. Kasun Bandara",
      issuedDate: "2026-10-01",
    }),
    createMockItem({
      prescriptionId: "pr-2",
      appointmentId: "ap-202",
      doctorName: "Dr. Kasun Bandara",
      issuedDate: "2026-10-01",
    }),
  ];

  const groups = groupPrescriptionsByAppointment(items);

  assert.equal(groups.length, 2);
  assert.equal(groups[0].appointmentId, "ap-201");
  assert.equal(groups[1].appointmentId, "ap-202");
});

test("4. Every medicine appears exactly once without duplicates", () => {
  const items: PatientPrescriptionItem[] = [
    createMockItem({ prescriptionId: "pr-1", appointmentId: "ap-1" }),
    createMockItem({ prescriptionId: "pr-2", appointmentId: "ap-1" }),
    createMockItem({ prescriptionId: "pr-3", appointmentId: "ap-2" }),
    createMockItem({ prescriptionId: "pr-4", appointmentId: "ap-3" }),
  ];

  const groups = groupPrescriptionsByAppointment(items);
  const allPrescriptionIds = groups.flatMap((g) => g.medicines.map((m) => m.prescriptionId));

  assert.equal(allPrescriptionIds.length, 4);
  assert.deepEqual(allPrescriptionIds, ["pr-1", "pr-2", "pr-3", "pr-4"]);
});

test("5. Filter simulation: Active tab shows only active medicines and omits appointments with zero active", () => {
  const items: PatientPrescriptionItem[] = [
    // ap-1 has 1 active and 1 past
    createMockItem({ prescriptionId: "pr-1", appointmentId: "ap-1", isActive: true }),
    createMockItem({ prescriptionId: "pr-2", appointmentId: "ap-1", isActive: false }),
    // ap-2 has only past
    createMockItem({ prescriptionId: "pr-3", appointmentId: "ap-2", isActive: false }),
    // ap-3 has 2 active
    createMockItem({ prescriptionId: "pr-4", appointmentId: "ap-3", isActive: true }),
    createMockItem({ prescriptionId: "pr-5", appointmentId: "ap-3", isActive: true }),
  ];

  const activeFiltered = items.filter((p) => p.isActive);
  const activeGroups = groupPrescriptionsByAppointment(activeFiltered);

  // ap-1 (1 active) and ap-3 (2 active) should be present; ap-2 should be omitted completely
  assert.equal(activeGroups.length, 2);
  assert.equal(activeGroups[0].appointmentId, "ap-1");
  assert.equal(activeGroups[0].medicines.length, 1);
  assert.equal(activeGroups[0].medicines[0].prescriptionId, "pr-1");

  assert.equal(activeGroups[1].appointmentId, "ap-3");
  assert.equal(activeGroups[1].medicines.length, 2);

  // Past tab
  const pastFiltered = items.filter((p) => !p.isActive);
  const pastGroups = groupPrescriptionsByAppointment(pastFiltered);

  // ap-1 (1 past) and ap-2 (1 past) should be present; ap-3 should be omitted completely
  assert.equal(pastGroups.length, 2);
  assert.equal(pastGroups[0].appointmentId, "ap-1");
  assert.equal(pastGroups[0].medicines.length, 1);
  assert.equal(pastGroups[0].medicines[0].prescriptionId, "pr-2");

  assert.equal(pastGroups[1].appointmentId, "ap-2");
  assert.equal(pastGroups[1].medicines.length, 1);
  assert.equal(pastGroups[1].medicines[0].prescriptionId, "pr-3");
});

test("6. Returns empty array when input is empty", () => {
  const groups = groupPrescriptionsByAppointment([]);
  assert.equal(groups.length, 0);
});
