"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Search, Bell, Menu } from "lucide-react";

export function Header() {
  const pathname = usePathname();

  const getPageTitle = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length <= 1 || (segments.length === 1 && segments[0] === "dashboard")) {
      return "Dashboard";
    }
    
    const last = segments[segments.length - 1];
    
    // Check if the last segment is a database UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(last);
    
    if (isUUID) {
      // Look at the folder name before the ID to determine the title
      const parent = segments[segments.length - 2];
      if (parent === "branches") return "Branch Details";
      if (parent === "treatments") return "Treatment Details";
      if (parent === "staff") return "Staff Details";
      if (parent === "doctors") return "Doctor Details";
      if (parent === "patients") return "Patient Details";
      return "Details";
    }

    if (last === "new") return "Register New";
    
    // Default fallback: Capitalize the segment
    return last.charAt(0).toUpperCase() + last.slice(1);
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-8 shadow-sm">
      <div className="flex items-center gap-4">
        <button className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg">
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold font-outfit text-slate-900">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-6">
        {/* Global Search */}
        <div className="hidden md:flex relative group">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-[var(--brand-primary)] transition-colors" />
          <input
            type="text"
            placeholder="Search patients, doctors..."
            className="w-64 h-9 pl-9 pr-4 rounded-full bg-slate-100 border-transparent text-sm focus:bg-white focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all outline-none"
          />
        </div>
        <Bell className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-700 transition-colors" />
      </div>
    </header>
  );
}