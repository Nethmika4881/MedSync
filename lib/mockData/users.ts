export type UserRole =
  | "admin"
  | "doctor"
  | "patient"
  | "receptionist";

export interface MockUser {
  userId: string;
  role: UserRole;
  name: string;
  firstName: string;
  avatar: string;
  branchId: string;
  email: string;
  blurb: string;
}

export const mockUsers: MockUser[] = [
  {
    userId: "USR-001",
    role: "admin",
    name: "Alexander Chen",
    firstName: "Alexander",
    avatar: "AC",
    branchId: "BR-001",
    email: "admin@healthora.com",
    blurb: "System administrator — full access across all branches",
  },
  {
    userId: "USR-002",
    role: "doctor",
    name: "Dr. Sarah Mitchell",
    firstName: "Sarah",
    avatar: "SM",
    branchId: "BR-001",
    email: "sarah.mitchell@healthora.com",
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
    email: "jessica.turner@healthora.com",
    blurb: "Front desk — appointment booking and patient check-in",
  },

];

export const roleConfig: Record<
  UserRole,
  { label: string; color: string; icon: string; description: string }
> = {
  admin: {
    label: "Admin",
    color: "bg-purple-100 text-purple-700",
    icon: "Shield",
    description: "Full system access across all branches",
  },
  doctor: {
    label: "Doctor",
    color: "bg-blue-100 text-blue-700",
    icon: "Stethoscope",
    description: "Consultations, prescriptions, patient care",
  },
  patient: {
    label: "Patient",
    color: "bg-green-100 text-green-700",
    icon: "User",
    description: "Appointments, records, billing",
  },
  receptionist: {
    label: "Receptionist",
    color: "bg-orange-100 text-orange-700",
    icon: "Calendar",
    description: "Booking, check-in, patient registration",
  },

};
