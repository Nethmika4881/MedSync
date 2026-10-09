"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Search, Bell, Menu } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const pathname = usePathname();

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
    <header className="h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("medsync:toggle-sidebar"))}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg sm:text-xl font-bold font-outfit text-slate-900 dark:text-white truncate">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Global Search */}
        <div className="hidden md:flex relative group">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-[var(--brand-primary)] transition-colors" />
          <input
            type="text"
            placeholder="Search patients, doctors..."
            className="w-64 h-9 pl-9 pr-4 rounded-full bg-slate-100 dark:bg-slate-800 border-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all outline-none"
          />
        </div>
        <ThemeToggle />
        <Bell className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors" aria-label="Notifications" />
      </div>
    </header>
  );
}
