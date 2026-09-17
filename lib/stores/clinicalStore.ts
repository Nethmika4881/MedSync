"use client";
import { create } from "zustand";
import type { Treatment, ConsultationRecord } from "@/lib/types";

interface ClinicalStore {
  treatments: Treatment[];
  consultations: ConsultationRecord[];

  markTreatmentPerformed: (treatmentId: string, performedBy: string, resultFile?: string) => void;
  uploadResult: (treatmentId: string, filename: string) => void;
  addConsultation: (consultation: ConsultationRecord) => void;
  updateConsultation: (id: string, updates: Partial<ConsultationRecord>) => void;
  addTreatment: (treatment: Treatment) => void;
  removeTreatment: (treatmentId: string) => void;
  updateTreatmentQuantity: (treatmentId: string, quantity: number) => void;
}

export const useClinicalStore = create<ClinicalStore>((set) => ({
  treatments: [],
  consultations: [],

  markTreatmentPerformed: (treatmentId, performedBy, resultFile) =>
    set((state) => ({
      treatments: state.treatments.map((t) =>
        t.treatmentId === treatmentId
          ? {
              ...t,
              status: "Completed" as const,
              performedAt: new Date().toISOString(),
              performedBy,
              ...(resultFile ? { resultFile } : {}),
            }
          : t
      ),
    })),

  uploadResult: (treatmentId, filename) =>
    set((state) => ({
      treatments: state.treatments.map((t) =>
        t.treatmentId === treatmentId ? { ...t, resultFile: filename } : t
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
    set((state) => ({
      treatments: [...state.treatments, treatment],
    })),

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
