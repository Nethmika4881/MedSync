export type UserRole =
  | "admin"
  | "doctor"
  | "patient"
  | "receptionist"
  | "nurse"
  | "pharmacist"
  | "lab_technician"
  | "branch_manager";

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
  {
    userId: "USR-005",
    role: "nurse",
    name: "Michael Okafor",
    firstName: "Michael",
    avatar: "MO",
    branchId: "BR-002",
    email: "michael.okafor@healthora.com",
    blurb: "Nurse — treatment administration and patient vitals",
  },
  {
    userId: "USR-006",
    role: "pharmacist",
    name: "Lisa Nguyen",
    firstName: "Lisa",
    avatar: "LN",
    branchId: "BR-001",
    email: "lisa.nguyen@healthora.com",
    blurb: "Pharmacist — prescription dispensing and medication safety",
  },
  {
    userId: "USR-007",
    role: "lab_technician",
    name: "David Kim",
    firstName: "David",
    avatar: "DK",
    branchId: "BR-002",
    email: "david.kim@healthora.com",
    blurb: "Lab Tech — specimen processing and result reporting",
  },
  {
    userId: "USR-008",
    role: "branch_manager",
    name: "Sandra Reyes",
    firstName: "Sandra",
    avatar: "SR",
    branchId: "BR-002",
    email: "sandra.reyes@healthora.com",
    blurb: "Branch Manager — staff oversight and branch reporting",
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
  nurse: {
    label: "Nurse",
    color: "bg-pink-100 text-pink-700",
    icon: "Heart",
    description: "Vitals, treatments, patient care",
  },
  pharmacist: {
    label: "Pharmacist",
    color: "bg-teal-100 text-teal-700",
    icon: "Pill",
    description: "Prescription dispensing, medication safety",
  },
  lab_technician: {
    label: "Lab Technician",
    color: "bg-yellow-100 text-yellow-700",
    icon: "FlaskConical",
    description: "Lab orders, results, specimen processing",
  },
  branch_manager: {
    label: "Branch Manager",
    color: "bg-indigo-100 text-indigo-700",
    icon: "Building2",
    description: "Staff management, branch reporting",
  },
};
