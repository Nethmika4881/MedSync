"use client";
import { create } from "zustand";
import { mockUsers, type MockUser, type UserRole } from "@/lib/mockData/users";
import { useBranchStore } from "@/hooks/use-branch-store";

interface AuthState {
  user: MockUser | null;
  login: (userId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: (userId: string) => {
    const user = mockUsers.find((u) => u.userId === userId) ?? null;
    set({ user });
    // Auto-seed the branch store from the user's assigned branch so that
    // every Front Desk page is immediately branch-scoped without extra setup.
    if (user?.branchId) {
      useBranchStore.getState().setActiveBranch(user.branchId);
    }
  },
  logout: () => {
    set({ user: null });
    // Clear branch scope on logout so the next user starts fresh.
    useBranchStore.getState().clearBranch();
  },
}));

export function useRole(): UserRole | null {
  return useAuthStore((s) => s.user?.role ?? null);
}

export function useCurrentUser(): MockUser | null {
  return useAuthStore((s) => s.user);
}
