import type { UserRole } from "@/lib/types";;

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  children?: NavItem[];
}

// Route paths match the new role-based route groups in app/.
// Route groups ((admin), (patient), (doctor), (front-desk)) are transparent to
// the URL — the URL is just /dashboard, /appointments, etc.
export const roleNavConfig: Record<UserRole, NavItem[]> = {
  admin: [
    { label: "Dashboard",  href: "/admin-dashboard",  icon: "LayoutDashboard" },
    {
      label: "Doctors", href: "/doctors", icon: "Stethoscope",
      children: [
        { label: "Doctor Directory", href: "/doctors",           icon: "Stethoscope" },
        { label: "Add Doctor",       href: "/doctors/new",       icon: "UserPlus" },
        { label: "Schedules",        href: "/doctors/schedules", icon: "Clock" },
      ],
    },
    { label: "Staff",      href: "/staff",      icon: "UserCog" },
    { label: "Branches",   href: "/branches",   icon: "MapPin" },
    { label: "Treatments", href: "/treatments", icon: "Activity" },
    {
      label: "Insurance", href: "/insurance", icon: "Shield",
      children: [
        { label: "Providers", href: "/insurance",          icon: "Building2" },
        { label: "Packages",  href: "/insurance/packages", icon: "Package" },
      ],
    },
    { label: "Reports",    href: "/reports",    icon: "BarChart3" },
    { label: "Settings",   href: "/settings",   icon: "Settings" },
  ],

  doctor: [
    { label: "Dashboard",     href: "/dashboard",     icon: "LayoutDashboard" },
    { label: "Consultations", href: "/consultations", icon: "FileText" },
    { label: "My Schedule",   href: "/schedule",      icon: "Clock" },
    { label: "Settings",      href: "/settings",      icon: "Settings" },
  ],

  // Patient uses top-nav layout — sidebar nav is not shown for patients.
  // Entries here are kept for completeness but the Sidebar returns null for patients.
  patient: [
    { label: "Dashboard",       href: "/dashboard",    icon: "LayoutDashboard" },
    { label: "Find Doctors",    href: "/find-doctors", icon: "Search" },
    { label: "Medical Records", href: "/records",      icon: "FileText" },
    { label: "Prescriptions",   href: "/prescriptions",icon: "Pill" },
  ],

  // Receptionist maps to the Front Desk portal routes.
  receptionist: [
    { label: "Dashboard",    href: "/front-desk-dashboard",        icon: "LayoutDashboard" },
    {
      label: "Appointments", href: "/appointments", icon: "Calendar",
      children: [
        { label: "All Appointments", href: "/appointments",     icon: "CalendarDays" },
        { label: "New Appointment",  href: "/appointments/new", icon: "CalendarPlus" },
      ],
    },
    {
      label: "Patients", href: "/patients", icon: "Users",
      children: [
        { label: "Patient List",     href: "/patients",     icon: "Users" },
        { label: "Register Patient", href: "/patients/new", icon: "UserPlus" },
      ],
    },
    {
      label: "Billing", href: "/billing", icon: "Receipt",
      children: [
        { label: "Invoices",  href: "/billing",          icon: "Receipt" },
        { label: "Payments",  href: "/billing/payments", icon: "CreditCard" },
        { label: "Claims",    href: "/billing/claims",   icon: "FileCheck" },
      ],
    },
    { label: "Settings", href: "/settings", icon: "Settings" },
  ],


};

