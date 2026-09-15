// hooks/use-sidebar-store.ts
//
// Zustand store for the interactive sidebar collapse/mobile state.
//
// PURPOSE:
//   Decouples sidebar open/collapsed state from the components that consume it.
//   - isCollapsed  → desktop: sidebar shows icon-only rail (w-16) vs full (w-64)
//   - isMobileOpen → mobile: sidebar slides in as an overlay drawer
//
// This is purely UI state — no data or branch scoping lives here.
// The Sidebar component reads this store to animate its width.
// The Header reads it to wire up the hamburger toggle button.

"use client";

import { create } from "zustand";

// ─── State Shape ─────────────────────────────────────────────────────────────

interface SidebarState {
  /** Desktop: when true the sidebar collapses to a 64px icon-only rail. */
  isCollapsed: boolean;

  /** Mobile: when true the sidebar renders as a full-height overlay drawer. */
  isMobileOpen: boolean;

  /** Toggle desktop collapsed state. */
  toggleCollapsed: () => void;

  /** Toggle mobile drawer open/closed. */
  toggleMobile: () => void;

  /** Explicitly close the mobile drawer (used by backdrop click & nav links). */
  closeMobile: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: false,
  isMobileOpen: false,

  toggleCollapsed: () =>
    set((state) => ({ isCollapsed: !state.isCollapsed })),

  toggleMobile: () =>
    set((state) => ({ isMobileOpen: !state.isMobileOpen })),

  closeMobile: () => set({ isMobileOpen: false }),
}));

// ─── Selector Helpers ────────────────────────────────────────────────────────

export function useIsCollapsed(): boolean {
  return useSidebarStore((s) => s.isCollapsed);
}

export function useIsMobileOpen(): boolean {
  return useSidebarStore((s) => s.isMobileOpen);
}
