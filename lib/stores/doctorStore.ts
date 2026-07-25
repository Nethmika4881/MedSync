"use client";
import { create } from "zustand";
import { doctors as initialDoctors, type Doctor } from "@/lib/mockData/doctors";
import { nanoid } from "nanoid";

interface DoctorStore {
  doctors: Doctor[];
  addDoctor: (d: Omit<Doctor, "doctorId">) => void;
  updateDoctor: (id: string, updates: Partial<Doctor>) => void;
  deleteDoctor: (id: string) => void;
}

export const useDoctorStore = create<DoctorStore>((set) => ({
  doctors: initialDoctors,

  addDoctor: (d) =>
    set((state) => ({
      doctors: [
        { ...d, doctorId: `DOC-${nanoid(4)}` },
        ...state.doctors,
      ],
    })),

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
