"use client";
// lib/stores/appointmentStore.ts
// Temporary Zustand store — will be replaced by Server Action calls once DB is connected.

import { create } from "zustand";
import type { Appointment, AppointmentStatus } from "@/lib/types";

interface AppointmentStore {
  appointments: Appointment[];
  setAppointments: (appointments: Appointment[]) => void;
  addAppointment: (appt: Appointment) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  cancelAppointment: (id: string, reason: string) => void;
  checkInAppointment: (id: string) => void;
}

export const useAppointmentStore = create<AppointmentStore>((set) => ({
  appointments: [],

  setAppointments: (appointments) => set({ appointments }),

  addAppointment: (appt) =>
    set((state) => ({ appointments: [appt, ...state.appointments] })),

  updateAppointment: (id, updates) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.appointmentId === id ? { ...a, ...updates } : a
      ),
    })),

  cancelAppointment: (id, reason) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.appointmentId === id
          ? { ...a, status: "Cancelled" as AppointmentStatus, cancelReason: reason }
          : a
      ),
    })),

  checkInAppointment: (id) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.appointmentId === id ? { ...a, status: "Checked-in" as AppointmentStatus } : a
      ),
    })),
}));
