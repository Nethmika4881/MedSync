import type { UserRole } from "@/lib/types";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  children?: NavItem[];
}

// Route paths match the new role-based route groups in app/.
// Route groups ((admin), (patient), (doctor), (front-desk)) have been renamed to normal folders.
// The URL will have a prefix like /admin/dashboard, /doctor/appointments, etc.
export const roleNavConfig: Record<UserRole, NavItem[]> = {
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: "LayoutDashboard" },
    {
      label: "Doctors",
      href: "/admin/doctors",
      icon: "Stethoscope",
      children: [
        {
          label: "Doctor Directory",
          href: "/admin/doctors",
          icon: "Stethoscope",
        },
        { label: "Add Doctor", href: "/admin/doctors/new", icon: "UserPlus" },
        { label: "Schedules", href: "/admin/doctors/schedules", icon: "Clock" },
        {
          label: "Fee Configuration",
          href: "/admin/doctors/fees",
          icon: "DollarSign",
        },
      ],
    },
    { label: "Patients", href: "/admin/patients", icon: "Users" },
    { label: "Staff", href: "/admin/staff", icon: "UserCog" },
    { label: "Branches", href: "/admin/branches", icon: "MapPin" },
    { label: "Treatments", href: "/admin/treatments", icon: "Activity" },
    {
      label: "Insurance",
      href: "/admin/insurance",
      icon: "Shield",
      children: [
        { label: "Providers", href: "/admin/insurance", icon: "Building2" },
        {
          label: "Packages",
          href: "/admin/insurance/packages",
          icon: "Package",
        },
      ],
    },
    { label: "Reports", href: "/admin/reports", icon: "BarChart3" },
    { label: "Settings", href: "/admin/settings", icon: "Settings" },
  ],

  doctor: [
    { label: "Dashboard", href: "/doctor/dashboard", icon: "LayoutDashboard" },
    { label: "Consultations", href: "/doctor/consultations", icon: "FileText" },
    { label: "My Patients", href: "/doctor/patients", icon: "Users" },
    { label: "My Schedule", href: "/doctor/schedule", icon: "Clock" },
    { label: "Settings", href: "/doctor/settings", icon: "Settings" },
  ],

  // Patient uses top-nav layout — sidebar nav is not shown for patients.
  // Entries here are kept for completeness but the Sidebar returns null for patients.
  patient: [
    { label: "Dashboard", href: "/patient/dashboard", icon: "LayoutDashboard" },
    { label: "Find Doctors", href: "/patient/find-doctors", icon: "Search" },
    { label: "Medical Records", href: "/patient/records", icon: "FileText" },
    { label: "Prescriptions", href: "/patient/prescriptions", icon: "Pill" },
  ],

  // Receptionist maps to the Front Desk portal routes.
  receptionist: [
    {
      label: "Dashboard",
      href: "/front-desk/dashboard",
      icon: "LayoutDashboard",
    },
    {
      label: "Appointments",
      href: "/front-desk/appointments",
      icon: "Calendar",
      children: [
        {
          label: "All Appointments",
          href: "/front-desk/appointments",
          icon: "CalendarDays",
        },
        {
          label: "New Appointment",
          href: "/front-desk/appointments/new",
          icon: "CalendarPlus",
        },
      ],
    },
    {
      label: "Patients",
      href: "/front-desk/patients",
      icon: "Users",
      children: [
        { label: "Patient List", href: "/front-desk/patients", icon: "Users" },
        {
          label: "Register Patient",
          href: "/front-desk/patients/new",
          icon: "UserPlus",
        },
      ],
    },
    {
      label: "Billing",
      href: "/front-desk/billing",
      icon: "Receipt",
      children: [
        { label: "Invoices", href: "/front-desk/billing", icon: "Receipt" },
        {
          label: "Payments",
          href: "/front-desk/billing/payments",
          icon: "CreditCard",
        },
        {
          label: "Claims",
          href: "/front-desk/billing/claims",
          icon: "FileCheck",
        },
      ],
    },
    { label: "Settings", href: "/front-desk/settings", icon: "Settings" },
  ],
};
