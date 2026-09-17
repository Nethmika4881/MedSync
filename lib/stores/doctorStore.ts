"use client";
// lib/stores/doctorStore.ts
// Temporary Zustand store — will be replaced by Server Action calls once DB is connected.

import { create } from "zustand";
import type { Doctor } from "@/lib/types";
import { doctors as initialDoctors } from "@/lib/constants";

interface DoctorStore {
  doctors: Doctor[];
  setDoctors: (doctors: Doctor[]) => void;
  addDoctor: (d: Doctor) => void;
  updateDoctor: (id: string, updates: Partial<Doctor>) => void;
  deleteDoctor: (id: string) => void;
}

export const useDoctorStore = create<DoctorStore>((set) => ({
  doctors: initialDoctors,

  setDoctors: (doctors) => set({ doctors }),

  addDoctor: (d) =>
    set((state) => ({ doctors: [d, ...state.doctors] })),

  updateDoctor: (id, updates) =>
    set((state) => ({
      doctors: state.doctors.map((d) =>
        d.doctorId === id ? { ...d, ...updates } : d
      ),
    })),

  deleteDoctor: (id) =>
    set((state) => ({
      doctors: state.doctors.filter((d) => d.doctorId !== id),
    })),
}));
