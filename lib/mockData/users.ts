// lib/mockData/users.ts
import type { AuthUser } from "@/lib/types";

export type UserRole = "admin" | "doctor" | "patient" | "receptionist";

export type MockUser = AuthUser;

export interface RoleConfigEntry {
  label: string;
  color: string;
  description: string;
  icon?: string;
}

export const mockUsers: MockUser[] = [
  {
    userId: "USR-001",
    role: "admin",
    name: "Alexander Chen",
    firstName: "Alexander",
    avatar: "AC",
    branchId: "BR-001",
    email: "admin@medsync.lk",
    blurb: "System administrator — full access across all branches",
  },
  {
    userId: "USR-002",
    role: "doctor",
    name: "Dr. Sarah Mitchell",
    firstName: "Sarah",
    avatar: "SM",
    branchId: "BR-001",
    email: "sarah.mitchell@medsync.lk",
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
    name: "Jessica Turner",
    firstName: "Jessica",
    avatar: "JT",
    branchId: "BR-001",
    email: "jessica.turner@medsync.lk",
    blurb: "Front desk — appointment booking and patient check-in",
  },
];

export const roleConfig: Record<UserRole, RoleConfigEntry> = {
  admin: {
    label: "Administrator",
    color: "bg-purple-100 text-purple-700",
    description: "Full system access across all branches",
  },
  doctor: {
    label: "Doctor",
    color: "bg-blue-100 text-blue-700",
    description: "Clinical consultation and patient care",
  },
  patient: {
    label: "Patient",
    color: "bg-green-100 text-green-700",
    description: "Patient self-service portal",
  },
  receptionist: {
    label: "Front Reception",
    color: "bg-amber-100 text-amber-700",
    description: "Branch front desk operations",
  },
};
