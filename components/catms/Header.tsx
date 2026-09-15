"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Search, Bell, Menu, Building2 } from "lucide-react";
import { AvatarWithName } from "@/components/catms/AvatarWithName";
import { useCurrentUser } from "@/lib/stores/authStore";
import { useActiveBranch } from "@/hooks/use-branch-store";
import { useSidebarStore } from "@/hooks/use-sidebar-store";

export function Header() {
  const pathname = usePathname();
  const user = useCurrentUser();
  // Reads the active branch — truthy only when the session user is a receptionist.
  const activeBranch = useActiveBranch();
  // Controls the mobile sidebar overlay drawer.
  const { toggleMobile } = useSidebarStore();

  const getPageTitle = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length <= 1) return "Dashboard";
    const last = segments[segments.length - 1];
    if (last === "new") return "Register New";
    return last.charAt(0).toUpperCase() + last.slice(1);
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-8 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Hamburger — opens the mobile overlay sidebar drawer */}
        <button
          onClick={toggleMobile}
          className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Open navigation"
        >
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

        {/* Branch Context Chip — shows the active branch scope for Front Desk users.
             Only renders when activeBranch is truthy (i.e. role === receptionist and
             branch store is seeded). Gives immediate visual confirmation of scope. */}
        {activeBranch && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--brand-primary)]/8 border border-[var(--brand-primary)]/20">
            <Building2 className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
            <span className="text-xs font-semibold text-[var(--brand-primary)] whitespace-nowrap">
              {activeBranch.name}
            </span>
          </div>
        )}

        {/* Notifications */}
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <div className="h-6 w-px bg-slate-200" />

        {/* User Profile */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            </div>
            <AvatarWithName name={user.name} avatarSrc={user.avatar} size="md" />
          </div>
        )}
      </div>
    </header>
  );
}
