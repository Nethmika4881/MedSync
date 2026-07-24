"use client";
import { create } from "zustand";
import { treatments as initialTreatments, type Treatment } from "@/lib/mockData/treatments";
import { consultationRecords as initialConsultations, type ConsultationRecord } from "@/lib/mockData/consultations";

interface ClinicalStore {
  treatments: Treatment[];
  consultations: ConsultationRecord[];

  markTreatmentPerformed: (treatmentId: string, performedBy: string, resultFile?: string) => void;
  uploadResult: (treatmentId: string, filename: string) => void;
  addConsultation: (consultation: ConsultationRecord) => void;
  updateConsultation: (id: string, updates: Partial<ConsultationRecord>) => void;
}

export const useClinicalStore = create<ClinicalStore>((set) => ({
  treatments: initialTreatments,
  consultations: initialConsultations,

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
}));
