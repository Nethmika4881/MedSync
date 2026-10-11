"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Search, Bell, Menu } from "lucide-react";
import { useSidebarStore } from "@/lib/stores/sidebarStore";
import { DoctorNotificationBell } from "@/components/doctor/DoctorNotificationBell";

export function Header() {
  const pathname = usePathname();
  const toggle = useSidebarStore((s) => s.toggle);
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);

  const getPageTitle = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length <= 1 || (segments.length === 1 && segments[0] === "dashboard")) {
      return "Dashboard";
    }
    const last = segments[segments.length - 1];
    if (last === "new") return "Register New";
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(last)) {
      return "Branch Details";
    }
    return last.charAt(0).toUpperCase() + last.slice(1);
  };

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-30 flex items-center justify-between px-8 shadow-sm dark:shadow-none transition-colors duration-200">
  <div className="flex items-center gap-4">

    <button
      onClick={toggle}
      aria-label="Open navigation menu"
      className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-850 dark:hover:text-slate-200 rounded-lg transition-colors"
    >
      <Menu className="w-5 h-5" />
    </button>
  
    <button
      onClick={toggleCollapsed}
      aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
      title={collapsed ? "Show sidebar" : "Hide sidebar"}
      className="hidden lg:block p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 rounded-lg transition-colors"
    >
      <Menu className="w-5 h-5" />
    </button>
    <h1 className="text-xl font-bold font-outfit text-slate-900 dark:text-slate-100 tracking-tight transition-colors">
      {getPageTitle()}
    </h1>
  </div>

  <div className="flex items-center gap-6">
    {/* Global Search */}
    <div className="hidden md:flex relative group">
      <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-[var(--brand-primary)] transition-colors" />
      <input
        type="text"
        placeholder="Search patients, doctors..."
        className="w-64 h-9 pl-9 pr-4 rounded-full bg-slate-100 dark:bg-slate-900/90 border border-transparent dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[var(--brand-primary)] dark:focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all outline-none"
      />
    </div>
    {pathname.startsWith("/doctor") ? (
      <DoctorNotificationBell />
    ) : (
      <button
        aria-label="Notifications"
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors"
      >
        <Bell className="w-5 h-5 cursor-pointer" />
      </button>
    )}
  </div>
</header>
  );
}
