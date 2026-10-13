"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Search,
  FileText,
  Pill,
  Receipt,
  ShieldCheck,
  MessageSquarePlus,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logOut } from "@/lib/actions/auth";
import { usePatientSidebarStore } from "@/lib/stores/patientSidebarStore";

export const patientNavLinks = [
  { label: "Dashboard",       href: "/patient/dashboard",     icon: LayoutDashboard, description: "Overview & metrics" },
  { label: "Appointments",    href: "/patient/appointments",  icon: Calendar,        description: "Upcoming & bookings" },
  { label: "Find Doctors",    href: "/patient/find-doctors",  icon: Search,          description: "Directory & slots" },
  { label: "Medical Records", href: "/patient/records",       icon: FileText,        description: "Consultations & history" },
  { label: "Prescriptions",   href: "/patient/prescriptions", icon: Pill,            description: "Medications & dosage" },
  { label: "Billing",         href: "/patient/billing",       icon: Receipt,         description: "Invoices & payments" },
  { label: "Claims",          href: "/patient/claims",        icon: ShieldCheck,     description: "Insurance & policies" },
  { label: "Complaints",      href: "/patient/complaints",    icon: MessageSquarePlus, description: "Support & feedback" },
];

export function PatientSidebar() {
  const pathname = usePathname();
  const { mobileOpen, closeMobile, collapsed, toggleCollapsed } = usePatientSidebarStore();
  const [mounted, setMounted] = useState(false);

  // Rehydrate persisted state on mount to prevent SSR hydration mismatch
  useEffect(() => {
    try {
      usePatientSidebarStore.persist.rehydrate();
    } catch {
      // localStorage fallback
    }
    setMounted(true);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  const isCollapsed = mounted && collapsed;

  return (
    <>
      {/* ── Mobile Backdrop Overlay ── */}
      {mobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar Container ── */}
      <aside
        id="patient-sidebar"
        className={cn(
          "fixed top-0 bottom-0 left-0 bg-white border-r border-slate-200/90 z-50 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.03)] transition-all duration-300 ease-in-out",
          // Mobile responsive positioning
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          // Desktop responsive width
          isCollapsed ? "lg:w-20" : "w-72 lg:w-64"
        )}
      >
        {/* ── Brand Header ── */}
        <div
          className={cn(
            "h-16 flex items-center border-b border-slate-100 shrink-0 px-4 transition-all duration-300",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {/* Logo & Brand Name */}
          <Link
            href="/patient/dashboard"
            className={cn(
              "flex items-center gap-2.5 font-bold font-outfit text-slate-900 tracking-tight transition-opacity duration-200",
              isCollapsed && "justify-center"
            )}
            title="MedSync Patient Portal"
          >
            <Image
              src="/favicon.ico?v=2"
              width={40}
              height={40}
              alt=""
              aria-hidden="true"
              className="size-10 shrink-0 rounded-xl object-cover shadow-md shadow-[var(--brand-primary)]/20"
            />
            {!isCollapsed && (
              <div className="flex flex-col leading-none">
                <span className="text-lg font-bold">
                  Med<span className="text-[var(--brand-primary)]">Sync</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
                  Patient Portal
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse / Expand Toggle Button */}
          {!isCollapsed && (
            <button
              onClick={toggleCollapsed}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={closeMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Quick Expand Button when Collapsed (Desktop) ── */}
        {isCollapsed && (
          <div className="hidden lg:flex justify-center py-2 border-b border-slate-100">
            <button
              onClick={toggleCollapsed}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-[var(--brand-primary)] hover:bg-slate-100 flex items-center justify-center transition-colors"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Navigation Links ── */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Navigation
            </div>
          )}

          {patientNavLinks.map(({ label, href, icon: Icon, description }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");

            return (
              <div key={href} className="relative group">
                <Link
                  href={href}
                  className={cn(
                    "flex items-center rounded-xl text-sm font-medium transition-all duration-200 outline-none",
                    isCollapsed
                      ? "justify-center p-3"
                      : "gap-3 px-3.5 py-2.5",
                    isActive
                      ? "bg-[var(--brand-primary)] text-white shadow-md shadow-[var(--brand-primary)]/25 font-semibold"
                      : "text-slate-600 hover:bg-slate-100/90 hover:text-slate-900"
                  )}
                >
                  <Icon
                    className={cn(
                      "shrink-0 transition-transform duration-200",
                      isCollapsed ? "w-5 h-5" : "w-5 h-5",
                      isActive ? "text-white" : "text-slate-500 group-hover:text-[var(--brand-primary)] group-hover:scale-105"
                    )}
                  />

                  {!isCollapsed && (
                    <span className="truncate flex-1 tracking-tight">
                      {label}
                    </span>
                  )}
                </Link>

                {/* Floating Tooltip in Collapsed Mode */}
                {isCollapsed && (
                  <div className="hidden lg:block absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <div className="bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap flex flex-col gap-0.5">
                      <span>{label}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{description}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Footer / User & Sign Out ── */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <form action={logOut}>
            <button
              type="submit"
              className={cn(
                "w-full flex items-center rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group border border-transparent hover:border-red-100",
                isCollapsed
                  ? "justify-center p-3"
                  : "gap-3 px-3.5 py-2.5"
              )}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-red-500 transition-colors" />
              {!isCollapsed && (
                <span className="truncate tracking-tight font-medium">Sign Out</span>
              )}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
