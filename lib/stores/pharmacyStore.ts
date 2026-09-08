"use client";
import { create } from "zustand";
import { prescriptionItems as initialPrescriptions, type PrescriptionItem } from "@/lib/mockData/consultations";
import { medications as initialMedications, medicationStock as initialStock, type Medication, type MedicationStock } from "@/lib/mockData/medications";

interface PharmacyStore {
  prescriptions: PrescriptionItem[];
  medications: Medication[];
  stock: MedicationStock[];

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
  prescriptions: initialPrescriptions,
  medications: initialMedications,
  stock: initialStock,

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
