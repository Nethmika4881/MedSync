import type { UserRole } from "@/lib/mockData/users";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  children?: NavItem[];
}

export const roleNavConfig: Record<UserRole, NavItem[]> = {
  admin: [
    { label: "Dashboard", href: "/app/dashboard", icon: "LayoutDashboard" },
    {
      label: "Appointments", href: "/app/appointments", icon: "Calendar",
      children: [
        { label: "All Appointments", href: "/app/appointments", icon: "CalendarDays" },
        { label: "New Appointment", href: "/app/appointments/new", icon: "CalendarPlus" },
      ],
    },
    {
      label: "Patients", href: "/app/patients", icon: "Users",
      children: [
        { label: "Patient List", href: "/app/patients", icon: "Users" },
        { label: "Register Patient", href: "/app/patients/new", icon: "UserPlus" },
      ],
    },
    {
      label: "Doctors", href: "/app/doctors", icon: "Stethoscope",
      children: [
        { label: "Doctor Directory", href: "/app/doctors", icon: "Stethoscope" },
        { label: "Schedules", href: "/app/doctors/schedules", icon: "Clock" },
      ],
    },
    { label: "Staff", href: "/app/staff", icon: "UserCog" },
    {
      label: "Billing", href: "/app/billing", icon: "Receipt",
      children: [
        { label: "Invoices", href: "/app/billing", icon: "Receipt" },
        { label: "Payments", href: "/app/billing/payments", icon: "CreditCard" },
        { label: "Claims", href: "/app/billing/claims", icon: "FileCheck" },
      ],
    },
    { label: "Pharmacy", href: "/app/pharmacy", icon: "Pill" },
    { label: "Laboratory", href: "/app/laboratory", icon: "FlaskConical" },
    { label: "Inventory", href: "/app/inventory", icon: "Package" },
    {
      label: "Insurance", href: "/app/insurance", icon: "Shield",
      children: [
        { label: "Providers", href: "/app/insurance", icon: "Building2" },
        { label: "Packages", href: "/app/insurance/packages", icon: "Package" },
      ],
    },
    { label: "Branches", href: "/app/branches", icon: "MapPin" },
    { label: "Reports", href: "/app/reports", icon: "BarChart3" },
    { label: "Security", href: "/app/security", icon: "Lock" },
    { label: "Settings", href: "/app/settings", icon: "Settings" },
  ],

  doctor: [
    { label: "Dashboard", href: "/app/dashboard", icon: "LayoutDashboard" },
    { label: "Appointments", href: "/app/appointments", icon: "Calendar" },
    { label: "My Schedule", href: "/app/doctors/schedule", icon: "Clock" },
    { label: "Patients", href: "/app/patients", icon: "Users" },
    { label: "Consultations", href: "/app/consultations", icon: "FileText" },
    { label: "Messages", href: "/app/messages", icon: "MessageSquare" },
    { label: "Settings", href: "/app/settings", icon: "Settings" },
  ],

  patient: [
    { label: "Dashboard", href: "/app/dashboard", icon: "LayoutDashboard" },
    { label: "Appointments", href: "/app/appointments", icon: "Calendar" },
    { label: "Messages", href: "/app/messages", icon: "MessageSquare" },
    { label: "Medical Records", href: "/app/records", icon: "FileText" },
    { label: "Prescriptions", href: "/app/prescriptions", icon: "Pill" },
    { label: "Billing", href: "/app/billing", icon: "CreditCard" },
    { label: "Find Doctors", href: "/app/find-doctors", icon: "Search" },
    { label: "Settings", href: "/app/settings", icon: "Settings" },
  ],

  receptionist: [
    { label: "Dashboard", href: "/app/dashboard", icon: "LayoutDashboard" },
    { label: "Appointments", href: "/app/appointments", icon: "Calendar" },
    { label: "Patients", href: "/app/patients", icon: "Users" },
    { label: "Billing", href: "/app/billing", icon: "Receipt" },
    { label: "Doctors", href: "/app/doctors", icon: "Stethoscope" },
    { label: "Messages", href: "/app/messages", icon: "MessageSquare" },
    { label: "Settings", href: "/app/settings", icon: "Settings" },
  ],

  nurse: [
    { label: "Dashboard", href: "/app/dashboard", icon: "LayoutDashboard" },
    { label: "Appointments", href: "/app/appointments", icon: "Calendar" },
    { label: "Patients", href: "/app/patients", icon: "Users" },
    { label: "Treatments", href: "/app/treatments", icon: "Activity" },
    { label: "Settings", href: "/app/settings", icon: "Settings" },
  ],

  pharmacist: [
    { label: "Dashboard", href: "/app/dashboard", icon: "LayoutDashboard" },
    { label: "Prescription Queue", href: "/app/pharmacy", icon: "ClipboardList" },
    { label: "Medications", href: "/app/pharmacy/medications", icon: "Pill" },
    { label: "Inventory", href: "/app/inventory", icon: "Package" },
    { label: "Settings", href: "/app/settings", icon: "Settings" },
  ],

  lab_technician: [
    { label: "Dashboard", href: "/app/dashboard", icon: "LayoutDashboard" },
    { label: "Lab Orders", href: "/app/laboratory", icon: "FlaskConical" },
    { label: "Patients", href: "/app/patients", icon: "Users" },
    { label: "Settings", href: "/app/settings", icon: "Settings" },
  ],

  branch_manager: [
    { label: "Dashboard", href: "/app/dashboard", icon: "LayoutDashboard" },
    { label: "Appointments", href: "/app/appointments", icon: "Calendar" },
    { label: "Staff", href: "/app/staff", icon: "UserCog" },
    { label: "Doctors", href: "/app/doctors", icon: "Stethoscope" },
    {
      label: "Billing", href: "/app/billing", icon: "Receipt",
      children: [
        { label: "Invoices", href: "/app/billing", icon: "Receipt" },
        { label: "Payments", href: "/app/billing/payments", icon: "CreditCard" },
      ],
    },
    { label: "Reports", href: "/app/reports", icon: "BarChart3" },
    { label: "Branch Settings", href: "/app/branches", icon: "MapPin" },
    { label: "Settings", href: "/app/settings", icon: "Settings" },
  ],
};
