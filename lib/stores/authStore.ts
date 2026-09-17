"use client";
// lib/stores/authStore.ts
// Demo auth store — replaced by NextAuth.js when the DB is connected.
// The 4 demo users below are hardcoded ONLY for local development.
// They are NOT imported from mock data files.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserRole, AuthUser } from "@/lib/types";
import { mockUsers } from "@/lib/mockData/users";
import { useBranchStore } from "@/hooks/use-branch-store";

export type { AuthUser };

const DEMO_USERS: AuthUser[] = mockUsers;

interface AuthState {
  user: AuthUser | null;
  login: (userId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: DEMO_USERS.find((u) => u.userId === "USR-004") ?? DEMO_USERS[0],
      login: (userId: string) => {
        const user = DEMO_USERS.find((u) => u.userId === userId) ?? null;
        set({ user });
        if (user?.branchId) {
          useBranchStore.getState().setActiveBranch(user.branchId);
        }
      },
      logout: () => {
        set({ user: null });
        useBranchStore.getState().clearBranch();
      },
    }),
    {
      name: "medsync-auth",
    }
  )
);

export function useRole(): UserRole | null {
  return useAuthStore((s) => s.user?.role ?? null);
}

export function useCurrentUser(): AuthUser | null {
  return useAuthStore((s) => s.user);
}

// Export demo users so the landing page login buttons still work
export { DEMO_USERS };
