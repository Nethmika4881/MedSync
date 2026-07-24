"use client";
import { create } from "zustand";
import { appointments as initialAppointments, type Appointment } from "@/lib/mockData/appointments";

interface AppointmentStore {
  appointments: Appointment[];
  addAppointment: (appt: Appointment) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  cancelAppointment: (id: string, reason: string) => void;
  rescheduleAppointment: (oldId: string, newAppt: Appointment) => void;
  checkInAppointment: (id: string) => void;
}

export const useAppointmentStore = create<AppointmentStore>((set) => ({
  appointments: initialAppointments,

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
          ? { ...a, status: "Cancelled" as const, cancelReason: reason }
          : a
      ),
    })),

  rescheduleAppointment: (oldId, newAppt) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.appointmentId === oldId ? { ...a, status: "Rescheduled" as const } : a
      ).concat([newAppt]),
    })),

  checkInAppointment: (id) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.appointmentId === id ? { ...a, status: "Checked-in" as const } : a
      ),
    })),
}));
