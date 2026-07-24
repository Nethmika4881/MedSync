"use client";
import { create } from "zustand";
import { patients as initialPatients, type Patient } from "@/lib/mockData/patients";
import { patientAllergies as initialAllergies, type PatientAllergy } from "@/lib/mockData/patientAllergies";
import { patientConditions as initialConditions, type PatientCondition } from "@/lib/mockData/conditions";
import { nanoid } from "nanoid";

interface PatientStore {
  patients: Patient[];
  allergies: PatientAllergy[];
  conditions: PatientCondition[];

  addPatient: (p: Patient) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  addAllergy: (allergy: Omit<PatientAllergy, "allergyId">) => void;
  removeAllergy: (allergyId: string) => void;
  addCondition: (condition: Omit<PatientCondition, "pcId">) => void;
  updateCondition: (pcId: string, updates: Partial<PatientCondition>) => void;
}

export const usePatientStore = create<PatientStore>((set) => ({
  patients: initialPatients,
  allergies: initialAllergies,
  conditions: initialConditions,

  addPatient: (p) =>
    set((state) => ({ patients: [p, ...state.patients] })),

  updatePatient: (id, updates) =>
    set((state) => ({
      patients: state.patients.map((p) =>
        p.patientId === id ? { ...p, ...updates } : p
      ),
    })),

  addAllergy: (allergy) =>
    set((state) => ({
      allergies: [
        ...state.allergies,
        { ...allergy, allergyId: `ALG-${nanoid(4)}` },
      ],
    })),

  removeAllergy: (allergyId) =>
    set((state) => ({
      allergies: state.allergies.filter((a) => a.allergyId !== allergyId),
    })),

  addCondition: (condition) =>
    set((state) => ({
      conditions: [
        ...state.conditions,
        { ...condition, pcId: `PC-${nanoid(4)}` },
      ],
    })),

  updateCondition: (pcId, updates) =>
    set((state) => ({
      conditions: state.conditions.map((c) =>
        c.pcId === pcId ? { ...c, ...updates } : c
      ),
    })),
}));
