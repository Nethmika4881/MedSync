"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarStore {
  open: boolean;       // mobile drawer
  collapsed: boolean;  // desktop: sidebar hidden
  toggle: () => void;
  close: () => void;
  toggleCollapsed: () => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      open: false,
      collapsed: false,
      toggle: () => set((s) => ({ open: !s.open })),
      close: () => set({ open: false }),
      toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
    }),
    {
      name: "medsync-sidebar",
      partialize: (s) => ({ collapsed: s.collapsed }),
      skipHydration: true,
    }
  )
);
