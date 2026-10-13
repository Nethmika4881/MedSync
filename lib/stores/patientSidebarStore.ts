"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PatientSidebarStore {
  mobileOpen: boolean;
  collapsed: boolean;
  toggleMobile: () => void;
  closeMobile: () => void;
  openMobile: () => void;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const usePatientSidebarStore = create<PatientSidebarStore>()(
  persist(
    (set) => ({
      mobileOpen: false,
      collapsed: false,
      toggleMobile: () => set((s) => ({ mobileOpen: !s.mobileOpen })),
      closeMobile: () => set({ mobileOpen: false }),
      openMobile: () => set({ mobileOpen: true }),
      toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
      setCollapsed: (val: boolean) => set({ collapsed: val }),
    }),
    {
      name: "medsync-patient-sidebar",
      partialize: (s) => ({ collapsed: s.collapsed }),
      skipHydration: true,
    }
  )
);
