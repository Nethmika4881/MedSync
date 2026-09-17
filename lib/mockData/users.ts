// lib/mockData/users.ts
// Only role UI config and the UserRole type remain here.
// Actual user data is in the database (Neon PostgreSQL).
// Import UserRole from here or from @/lib/types — both are the same.

export type UserRole = "admin" | "doctor" | "patient" | "receptionist";

export interface RoleConfigEntry {
  label: string;
  color: string;
  description: string;
}

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
