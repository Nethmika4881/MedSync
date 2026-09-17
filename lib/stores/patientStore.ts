"use client";
// lib/stores/patientStore.ts
// Temporary Zustand store — will be replaced by Server Action calls once DB is connected.

import { create } from "zustand";
import type { Patient, PatientAllergy, PatientCondition } from "@/lib/types";

interface PatientStore {
  patients: Patient[];
  allergies: PatientAllergy[];
  conditions: PatientCondition[];

  setPatients: (patients: Patient[]) => void;
  setAllergies: (allergies: PatientAllergy[]) => void;
  setConditions: (conditions: PatientCondition[]) => void;

  addPatient: (p: Patient) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  addAllergy: (allergy: PatientAllergy) => void;
  removeAllergy: (allergyId: string) => void;
  addCondition: (condition: PatientCondition) => void;
  updateCondition: (conditionId: string, updates: Partial<PatientCondition>) => void;
}

export const usePatientStore = create<PatientStore>((set) => ({
  patients: [],
  allergies: [],
  conditions: [],

  setPatients: (patients) => set({ patients }),
  setAllergies: (allergies) => set({ allergies }),
  setConditions: (conditions) => set({ conditions }),

  addPatient: (p) =>
    set((state) => ({ patients: [p, ...state.patients] })),

  updatePatient: (id, updates) =>
    set((state) => ({
      patients: state.patients.map((p) =>
        p.patientId === id ? { ...p, ...updates } : p
      ),
    })),

  addAllergy: (allergy) =>
    set((state) => ({ allergies: [...state.allergies, allergy] })),

  removeAllergy: (allergyId) =>
    set((state) => ({
      allergies: state.allergies.filter((a) => a.allergyId !== allergyId),
    })),

  addCondition: (condition) =>
    set((state) => ({ conditions: [...state.conditions, condition] })),

  updateCondition: (conditionId, updates) =>
    set((state) => ({
      conditions: state.conditions.map((c) =>
        c.conditionId === conditionId ? { ...c, ...updates } : c
      ),
    })),
}));
