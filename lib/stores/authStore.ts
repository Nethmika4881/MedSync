"use client";
import { create } from "zustand";
import { mockUsers, type MockUser, type UserRole } from "@/lib/mockData/users";

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
  },
  logout: () => set({ user: null }),
}));

export function useRole(): UserRole | null {
  return useAuthStore((s) => s.user?.role ?? null);
}

export function useCurrentUser(): MockUser | null {
  return useAuthStore((s) => s.user);
}
