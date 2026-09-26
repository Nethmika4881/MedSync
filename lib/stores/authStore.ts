"use client";
// lib/stores/authStore.ts
// Demo auth store — replaced by NextAuth.js when the DB is connected.
// The 4 demo users below are hardcoded ONLY for local development.
// They are NOT imported from mock data files.

import { create } from "zustand";
import type { UserRole } from "@/lib/types";;

export interface AuthUser {
  userId: string;
  role: UserRole;
  name: string;
  firstName: string;
  email: string;
  branchId: string;
  avatar: string;
  blurb: string;
}

// ── Demo users (local dev only — DELETE when NextAuth is wired up) ─────────────
const DEMO_USERS: AuthUser[] = [
  {
    userId: "USR-001",
    role: "admin",
    name: "James Turner",
    firstName: "James",
    avatar: "JT",
    branchId: "BR-001",
    email: "james.turner@medsync.com",
    blurb: "System Administrator — all branches",
  },
  {
    userId: "USR-002",
    role: "doctor",
    name: "Dr. Sarah Mitchell",
    firstName: "Sarah",
    avatar: "SM",
    branchId: "BR-001",
    email: "sarah.mitchell@medsync.com",
    blurb: "Cardiologist — Senior Consultant, Branch 1",
  },
  {
    userId: "USR-003",
    role: "patient",
    name: "Abraham Brakering",
    firstName: "Abraham",
    avatar: "AB",
    branchId: "BR-001",
    email: "abraham@email.com",
    blurb: "Patient account — book appointments and view records",
  },
  {
    userId: "USR-004",
    role: "receptionist",
    name: "Emily Carter",
    firstName: "Emily",
    avatar: "EC",
    branchId: "BR-001",
    email: "emily.carter@medsync.com",
    blurb: "Front Reception — Branch 1",
  },
];

// ── Store ──────────────────────────────────────────────────────────────────────

interface AuthState {
  user: AuthUser | null;
  login: (userId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: (userId: string) => {
    const user = DEMO_USERS.find((u) => u.userId === userId) ?? null;
    set({ user });
  },
  logout: () => set({ user: null }),
}));

export function useRole(): UserRole | null {
  return useAuthStore((s) => s.user?.role ?? null);
}

export function useCurrentUser(): AuthUser | null {
  return useAuthStore((s) => s.user);
}

// Export demo users so the landing page login buttons still work
export { DEMO_USERS };
