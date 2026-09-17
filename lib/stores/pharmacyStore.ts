"use client";
// lib/stores/pharmacyStore.ts
// Temporary Zustand store — will be replaced by Server Action calls once DB is connected.

import { create } from "zustand";
import type { PrescriptionItem, Medication, MedicationStock } from "@/lib/types";

interface PharmacyStore {
  prescriptions: PrescriptionItem[];
  medications: Medication[];
  stock: MedicationStock[];

  setPrescriptions: (prescriptions: PrescriptionItem[]) => void;
  setMedications: (medications: Medication[]) => void;
  setStock: (stock: MedicationStock[]) => void;

  dispensePrescription: (prescriptionId: string, dispensedBy: string) => void;
  restockMedication: (stockId: string, qty: number) => void;
  addMedication: (med: Medication) => void;
  updateMedication: (id: string, updates: Partial<Medication>) => void;
  deleteMedication: (id: string) => void;
  addPrescription: (prescription: PrescriptionItem) => void;
  updatePrescription: (prescriptionId: string, updates: Partial<PrescriptionItem>) => void;
  removePrescription: (prescriptionId: string) => void;
}

export const usePharmacyStore = create<PharmacyStore>((set) => ({
  prescriptions: [],
  medications: [],
  stock: [],

  setPrescriptions: (prescriptions) => set({ prescriptions }),
  setMedications: (medications) => set({ medications }),
  setStock: (stock) => set({ stock }),

  dispensePrescription: (prescriptionId, dispensedBy) =>
    set((state) => ({
      prescriptions: state.prescriptions.map((p) =>
        p.prescriptionId === prescriptionId
          ? { ...p, dispensed: true, dispensedAt: new Date().toISOString(), dispensedBy }
          : p
      ),
    })),

  restockMedication: (stockId, qty) =>
    set((state) => ({
      stock: state.stock.map((s) =>
        s.stockId === stockId
          ? { ...s, quantityOnHand: s.quantityOnHand + qty, lastRestocked: new Date().toISOString().split("T")[0] }
          : s
      ),
    })),

  addMedication: (med) =>
    set((state) => ({ medications: [...state.medications, med] })),

  updateMedication: (id, updates) =>
    set((state) => ({
      medications: state.medications.map((m) =>
        m.medicationId === id ? { ...m, ...updates } : m
      ),
    })),

  deleteMedication: (id) =>
    set((state) => ({
      medications: state.medications.filter((m) => m.medicationId !== id),
    })),

  addPrescription: (prescription) =>
    set((state) => ({ prescriptions: [...state.prescriptions, prescription] })),

  updatePrescription: (prescriptionId, updates) =>
    set((state) => ({
      prescriptions: state.prescriptions.map((p) =>
        p.prescriptionId === prescriptionId ? { ...p, ...updates } : p
      ),
    })),

  removePrescription: (prescriptionId) =>
    set((state) => ({
      prescriptions: state.prescriptions.filter((p) => p.prescriptionId !== prescriptionId),
    })),
}));
