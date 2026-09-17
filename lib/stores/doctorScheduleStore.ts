"use client";
import { create } from "zustand";
import { doctorSchedules as initialSchedules, type DoctorScheduleSlot } from "@/lib/mockData/doctorSchedules";
import { nanoid } from "nanoid";

interface DoctorScheduleStore {
  schedules: DoctorScheduleSlot[];
  addSlot: (slot: Omit<DoctorScheduleSlot, "scheduleId">) => void;
  updateSlot: (scheduleId: string, updates: Partial<DoctorScheduleSlot>) => void;
  removeSlot: (scheduleId: string) => void;
}

export const useDoctorScheduleStore = create<DoctorScheduleStore>((set) => ({
  schedules: initialSchedules,

  addSlot: (slot) =>
    set((state) => ({
      schedules: [...state.schedules, { ...slot, scheduleId: `SCH-${nanoid(6)}` }],
    })),

  updateSlot: (scheduleId, updates) =>
    set((state) => ({
      schedules: state.schedules.map((s) =>
        s.scheduleId === scheduleId ? { ...s, ...updates } : s
      ),
    })),

  removeSlot: (scheduleId) =>
    set((state) => ({
      schedules: state.schedules.filter((s) => s.scheduleId !== scheduleId),
    })),
}));
