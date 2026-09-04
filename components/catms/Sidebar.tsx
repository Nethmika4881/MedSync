"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartPulse, LogOut, ChevronDown } from "lucide-react";
import { useAuthStore, useRole, useCurrentUser } from "@/lib/stores/authStore";
import { roleNavConfig } from "@/lib/roleNavConfig";
import { roleConfig, UserRole } from "@/lib/mockData/users";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const role = useRole() as UserRole | null;
  const user = useCurrentUser();
  const logout = useAuthStore((s) => s.logout);

  if (!role || !user) return null;

  const navItems = roleNavConfig[role] || [];
  const rConfig = roleConfig[role];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-40 transition-transform">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold font-outfit text-slate-900 tracking-tight">
          <HeartPulse className="w-7 h-7 text-[var(--brand-primary)]" />
          Health<span className="text-[var(--brand-primary)]">ora</span>
        </Link>
      </div>

      {/* Role Badge */}
      <div className="px-6 py-4 shrink-0">
        <div className={cn("px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2", rConfig.color)}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {rConfig.label} Portal
        </div>
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
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group",
                  isActive
                    ? "bg-[var(--brand-primary)] text-white shadow-md shadow-brand-500/20"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {Icon && <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400 group-hover:text-[var(--brand-primary)]")} />}
                {item.label}
                {hasChildren && (
                  <ChevronDown className={cn("w-4 h-4 ml-auto", isActive ? "text-white/70" : "text-slate-400")} />
                )}
              </Link>
              
              {/* Nested Children */}
              {hasChildren && isActive && (
                <div className="ml-9 mt-1 space-y-1 border-l border-slate-200 pl-2">
                  {item.children!.map((child) => {
                    const ChildIcon = Icons[child.icon as keyof typeof Icons] as React.ElementType;
                    const isChildActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
                          isChildActive
                            ? "text-[var(--brand-primary)] font-semibold bg-blue-50/50"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
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

      {/* User Footer */}
      <div className="p-4 border-t border-slate-100 shrink-0">
        <button
          onClick={() => {
            logout();
            window.location.href = "/";
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500" />
            Sign Out
          </div>
        </button>
      </div>
    </aside>
  );
}
