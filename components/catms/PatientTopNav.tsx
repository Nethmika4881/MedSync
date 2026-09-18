"use client";

// components/catms/PatientTopNav.tsx
// Mobile-responsive top navigation bar for the Patient portal ONLY.
// All other portals (admin, doctor, front-desk) use the Sidebar component.

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartPulse, Bell, Menu, X, LogOut } from "lucide-react";
import * as Icons from "lucide-react";
import { useAuthStore, useCurrentUser } from "@/lib/stores/authStore";
import { roleNavConfig } from "@/lib/roleNavConfig";
import { AvatarWithName } from "@/components/catms/AvatarWithName";
import { cn } from "@/lib/utils";

export function PatientTopNav() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const logout = useAuthStore((s) => s.logout);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = roleNavConfig["patient"] ?? [];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-slate-900 text-xl shrink-0">
            <HeartPulse className="w-7 h-7 text-[var(--brand-primary)]" />
            Med<span className="text-[var(--brand-primary)]">Sync</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = Icons[item.icon as keyof typeof Icons] as React.ElementType;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[var(--brand-primary)] text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side — bell + user + sign out */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            {user && (
              <div className="hidden md:flex items-center gap-3">
                <AvatarWithName name={user.name} avatarSrc={user.avatar} size="md" />
                <button
                  onClick={() => { logout(); window.location.href = "/"; }}
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">Sign out</span>
                </button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileOpen((o) => !o)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label={isMobileOpen ? "Close menu" : "Open menu"}
            >
              {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-slate-100",
            isMobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <nav className="px-4 py-3 space-y-1 bg-white">
            {navItems.map((item) => {
              const Icon = Icons[item.icon as keyof typeof Icons] as React.ElementType;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[var(--brand-primary)] text-white"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {item.label}
                </Link>
              );
            })}

            <div className="pt-2 border-t border-slate-100 mt-2">
              {user && (
                <div className="flex items-center justify-between px-4 py-2">
                  <AvatarWithName name={user.name} avatarSrc={user.avatar} size="sm" subtitle="Patient" />
                  <button
                    onClick={() => { logout(); window.location.href = "/"; }}
                    className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}
