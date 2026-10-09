"use client";

import React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartPulse, LogOut, ChevronDown } from "lucide-react";
import { roleNavConfig } from "@/lib/roleNavConfig";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { logOut } from "@/lib/actions/auth";

/** Derive role from the URL prefix so we don't need a client auth store. */
function getRoleFromPath(pathname: string): UserRole | null {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/doctor")) return "doctor";
  if (pathname.startsWith("/patient")) return "patient";
  if (pathname.startsWith("/front-desk")) return "receptionist";
  return null;
}

export function Sidebar() {
  const pathname = usePathname();
  const role = getRoleFromPath(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const toggleSidebar = () => setMobileOpen((open) => !open);
    window.addEventListener("medsync:toggle-sidebar", toggleSidebar);
    return () => window.removeEventListener("medsync:toggle-sidebar", toggleSidebar);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Patients use a top-nav layout — no sidebar.
  if (!role || role === "patient") return null;

  const navItems = roleNavConfig[role] || [];

  return (
    <>
      <div
        aria-hidden="true"
        onClick={() => setMobileOpen(false)}
        className={cn(
          "fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />
      <aside className={cn(
        "fixed left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 transition-transform duration-200 lg:w-64 lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <Link
          href={role === "receptionist" ? "/front-desk/dashboard" : `/${role}/dashboard`}
          className="flex items-center gap-2 text-xl font-bold font-outfit text-slate-900 dark:text-white tracking-tight"
        >
          <HeartPulse className="w-7 h-7 text-[var(--brand-primary)]" />
          Med<span className="text-[var(--brand-primary)]">Sync</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = Icons[item.icon as keyof typeof Icons] as React.ElementType;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.href}>
              <Link
                href={hasChildren ? item.children![0].href : item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group",
                  isActive
                    ? "bg-[var(--brand-primary)] text-white shadow-md shadow-brand-500/20"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      "w-5 h-5",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-[var(--brand-primary)]"
                    )}
                  />
                )}
                {item.label}
                {hasChildren && (
                  <ChevronDown
                    className={cn("w-4 h-4 ml-auto", isActive ? "text-white/70" : "text-slate-400")}
                  />
                )}
              </Link>

              {/* Nested Children */}
              {hasChildren && isActive && (
                <div className="ml-9 mt-1 space-y-1 border-l border-slate-200 dark:border-slate-700 pl-2">
                  {item.children!.map((child) => {
                    const ChildIcon = Icons[child.icon as keyof typeof Icons] as React.ElementType;
                    const isChildActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
                          isChildActive
                            ? "text-[var(--brand-primary)] font-semibold bg-blue-50/50"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                      >
                        {ChildIcon && <ChildIcon className="w-4 h-4" />}
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
        <form action={logOut}>
          <button
            type="submit"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500" />
              Sign Out
            </div>
          </button>
        </form>
      </div>
      </aside>
    </>
  );
}
