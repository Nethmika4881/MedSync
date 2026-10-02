"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HeartPulse,
  LayoutDashboard,
  Search,
  FileText,
  Pill,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logOut } from "@/lib/actions/auth";

const navLinks = [
  { label: "Dashboard",       href: "/patient/dashboard",     icon: LayoutDashboard },
  { label: "Find Doctors",    href: "/patient/find-doctors",  icon: Search },
  { label: "Medical Records", href: "/patient/records",       icon: FileText },
  { label: "Prescriptions",   href: "/patient/prescriptions", icon: Pill },
];

export function PatientNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Brand */}
          <Link
            href="/patient/dashboard"
            className="flex items-center gap-2 shrink-0 text-xl font-bold font-outfit text-slate-900 tracking-tight"
          >
            <HeartPulse className="w-7 h-7 text-[var(--brand-primary)]" />
            Med<span className="text-[var(--brand-primary)]">Sync</span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ label, href, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    isActive
                      ? "bg-[var(--brand-primary)] text-white shadow-md shadow-brand-500/20"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Sign Out */}
          <form action={logOut} className="hidden md:block shrink-0">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-200 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>

          {/* Mobile Hamburger */}
          <button
            id="patient-nav-toggle"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-30 transition-all duration-300",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          onClick={() => setMobileOpen(false)}
          className={cn(
            "absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Drawer panel */}
        <nav
          className={cn(
            "absolute top-16 left-0 right-0 bg-white border-b border-slate-200 shadow-xl px-4 py-4 flex flex-col gap-1 transition-all duration-300",
            mobileOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
          )}
        >
          {navLinks.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-[var(--brand-primary)] text-white"
                    : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            );
          })}

          {/* Mobile Sign Out */}
          <form action={logOut} className="mt-2 pt-2 border-t border-slate-100">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </form>
        </nav>
      </div>
    </>
  );
}
