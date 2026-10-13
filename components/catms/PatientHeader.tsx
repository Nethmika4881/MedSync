"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, CalendarPlus } from "lucide-react";
import { usePatientSidebarStore } from "@/lib/stores/patientSidebarStore";
import { Button } from "@/components/ui/button";

const pageTitles: Record<string, string> = {
  "/patient/dashboard": "Dashboard",
  "/patient/appointments": "My Appointments",
  "/patient/find-doctors": "Find Doctors & Specialists",
  "/patient/records": "Medical Consultation Records",
  "/patient/prescriptions": "Prescriptions & Medications",
  "/patient/billing": "Billing & Invoices",
  "/patient/claims": "Insurance Claims & Policies",
  "/patient/complaints": "Feedback & Support",
};

export function PatientHeader() {
  const pathname = usePathname();
  const toggleMobile = usePatientSidebarStore((s) => s.toggleMobile);

  const getTitle = () => {
    if (pageTitles[pathname]) return pageTitles[pathname];
    for (const [route, title] of Object.entries(pageTitles)) {
      if (pathname.startsWith(route)) return title;
    }
    return "Patient Portal";
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shadow-xs transition-colors">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          onClick={toggleMobile}
          id="patient-nav-toggle"
          aria-label="Open navigation menu"
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page Title */}
        <h1 className="text-lg sm:text-xl font-bold font-outfit text-slate-900 tracking-tight">
          {getTitle()}
        </h1>
      </div>

      {/* Right Header Controls / Quick Actions */}
      <div className="flex items-center gap-3">
        {pathname !== "/patient/find-doctors" && (
          <Link href="/patient/find-doctors">
            <Button
              size="sm"
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white rounded-xl shadow-xs gap-1.5 hidden sm:flex text-xs font-semibold px-3.5 h-9"
            >
              <CalendarPlus className="w-4 h-4" />
              Book Appointment
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
