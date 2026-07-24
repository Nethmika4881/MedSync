"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Search, Bell, Menu } from "lucide-react";
import { AvatarWithName } from "@/components/catms/AvatarWithName";
import { useCurrentUser } from "@/lib/stores/authStore";

export function Header() {
  const pathname = usePathname();
  const user = useCurrentUser();

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
