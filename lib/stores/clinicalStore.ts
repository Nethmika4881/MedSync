"use client";
// lib/stores/clinicalStore.ts
// Temporary Zustand store — will be replaced by Server Action calls once DB is connected.

import { create } from "zustand";
import type { Treatment, TreatmentStatus, ConsultationRecord } from "@/lib/types";

interface ClinicalStore {
  treatments: Treatment[];
  consultations: ConsultationRecord[];

  setTreatments: (treatments: Treatment[]) => void;
  setConsultations: (consultations: ConsultationRecord[]) => void;

  markTreatmentPerformed: (treatmentId: string, performedBy: string, resultFile?: string) => void;
  addConsultation: (consultation: ConsultationRecord) => void;
  updateConsultation: (id: string, updates: Partial<ConsultationRecord>) => void;
  addTreatment: (treatment: Treatment) => void;
  removeTreatment: (treatmentId: string) => void;
  updateTreatmentQuantity: (treatmentId: string, quantity: number) => void;
}

export const useClinicalStore = create<ClinicalStore>((set) => ({
  treatments: [],
  consultations: [],

  setTreatments: (treatments) => set({ treatments }),
  setConsultations: (consultations) => set({ consultations }),

  markTreatmentPerformed: (treatmentId, performedBy, resultFile) =>
    set((state) => ({
      treatments: state.treatments.map((t) =>
        t.treatmentId === treatmentId
          ? {
              ...t,
              status: "Completed" as TreatmentStatus,
              performedAt: new Date().toISOString(),
              performedBy,
              ...(resultFile ? { resultFile } : {}),
            }
          : t
      ),
    })),

  addConsultation: (consultation) =>
    set((state) => ({
      consultations: [consultation, ...state.consultations],
    })),

  updateConsultation: (id, updates) =>
    set((state) => ({
      consultations: state.consultations.map((c) =>
        c.consultationId === id ? { ...c, ...updates } : c
      ),
    })),

  addTreatment: (treatment) =>
    set((state) => ({ treatments: [...state.treatments, treatment] })),

  removeTreatment: (treatmentId) =>
    set((state) => ({
      treatments: state.treatments.filter((t) => t.treatmentId !== treatmentId),
    })),

  updateTreatmentQuantity: (treatmentId, quantity) =>
    set((state) => ({
      treatments: state.treatments.map((t) =>
        t.treatmentId === treatmentId
          ? { ...t, quantity, total: t.unitPrice * quantity }
          : t
      ),
    })),
}));
