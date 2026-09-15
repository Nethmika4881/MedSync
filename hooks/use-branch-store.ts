// hooks/use-branch-store.ts
//
// Zustand store for the Front Desk portal's active branch context.
//
// PURPOSE:
//   Front Desk staff are scoped to a single branch per session. This store
//   holds the currently active branchId so that every page, component, and
//   (eventually) Server Action can read it and enforce:
//     WHERE branch_id = activeBranchId
//   without prop-drilling the value through every component tree.
//
// SEEDING:
//   authStore.login() auto-seeds this store from MockUser.branchId.
//   authStore.logout() calls clearBranch() to reset it.
//
// INVARIANT:
//   Never import this hook into Server Components or Server Actions.
//   It is client-only state (Zustand runs only in the browser).

"use client";

import { create } from "zustand";
import { branches, type Branch } from "@/lib/mockData/branches";

// ─── State Shape ────────────────────────────────────────────────────────────

interface BranchState {
  /** The branchId that is currently active for the Front Desk session.
   *  Null only before the user has logged in. */
  activeBranchId: string | null;

  /** Set the active branch (called by authStore on login). */
  setActiveBranch: (branchId: string) => void;

  /** Clear the active branch (called by authStore on logout). */
  clearBranch: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useBranchStore = create<BranchState>((set) => ({
  activeBranchId: null,

  setActiveBranch: (branchId: string) => set({ activeBranchId: branchId }),

  clearBranch: () => set({ activeBranchId: null }),
}));

// ─── Selector Helpers ────────────────────────────────────────────────────────
// Use these in components instead of accessing the store directly.
// They are stable: they only re-render the component when their value changes.

/** Returns the raw active branch ID string (e.g. "BR-001"), or null. */
export function useActiveBranchId(): string | null {
  return useBranchStore((s) => s.activeBranchId);
}

/** Returns the full Branch object for the active branch, or null. */
export function useActiveBranch(): Branch | null {
  const id = useBranchStore((s) => s.activeBranchId);
  if (!id) return null;
  return branches.find((b) => b.branchId === id) ?? null;
}
