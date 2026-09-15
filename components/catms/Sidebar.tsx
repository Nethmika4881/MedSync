"use client";

// Sidebar — interactive, collapsible flex-child sidebar used by all staff portals.
//
// LAYOUT MODEL:
//   This component is a FLEX CHILD (not fixed-positioned).
//   It sits as the first child of the `flex` outer shell in each layout.tsx.
//   Its width drives the content area width via normal flexbox — no hardcoded
//   pl-64 offsets needed anywhere.
//
// COLLAPSE MODEL:
//   Desktop: the sidebar transitions between w-64 (expanded) and w-16 (icon rail)
//   controlled by useSidebarStore.isCollapsed.
//   Mobile:  the sidebar is hidden off-screen and slides in as a fixed overlay
//   when useSidebarStore.isMobileOpen is true.

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HeartPulse,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  X,
} from "lucide-react";
import { useAuthStore, useRole, useCurrentUser } from "@/lib/stores/authStore";
import { useActiveBranch } from "@/hooks/use-branch-store";
import { useSidebarStore } from "@/hooks/use-sidebar-store";
import { roleNavConfig } from "@/lib/roleNavConfig";
import { roleConfig, UserRole } from "@/lib/mockData/users";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";

// ─── Sidebar Shell ────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const role = useRole() as UserRole | null;
  const user = useCurrentUser();
  const logout = useAuthStore((s) => s.logout);
  const activeBranch = useActiveBranch();

  const { isCollapsed, isMobileOpen, toggleCollapsed, closeMobile } =
    useSidebarStore();

  if (!role || !user) return null;

  const navItems = roleNavConfig[role] || [];
  const rConfig = roleConfig[role];

  // ─── Shared inner content (rendered in both desktop and mobile) ────────────
  const sidebarContent = (
    <div className="flex flex-col h-full">

      {/* Brand + Mobile close button */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
        <Link
          href="/dashboard"
          onClick={closeMobile}
          className={cn(
            "flex items-center gap-2 font-bold text-slate-900 tracking-tight transition-all duration-200 overflow-hidden",
            isCollapsed ? "justify-center w-full" : "text-xl"
          )}
        >
          <HeartPulse className="w-7 h-7 text-[var(--brand-primary)] shrink-0" />
          {/* Text label hidden when collapsed */}
          <span
            className={cn(
              "transition-all duration-200 whitespace-nowrap overflow-hidden",
              isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}
          >
            Health<span className="text-[var(--brand-primary)]">ora</span>
          </span>
        </Link>

        {/* Mobile close button — only visible in the overlay */}
        <button
          onClick={closeMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Role Badge — hidden when collapsed */}
      <div
        className={cn(
          "px-4 pt-4 pb-2 shrink-0 overflow-hidden transition-all duration-200",
          isCollapsed ? "opacity-0 h-0 py-0" : "opacity-100"
        )}
      >
        <div
          className={cn(
            "px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2",
            rConfig.color
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
          {rConfig.label} Portal
        </div>
      </div>

      {/* Branch Pill — only for receptionists, hidden when collapsed.
           In production this comes from the JWT session claim. */}
      {role === "receptionist" && activeBranch && (
        <div
          className={cn(
            "px-4 pb-3 shrink-0 overflow-hidden transition-all duration-200",
            isCollapsed ? "opacity-0 h-0 pb-0" : "opacity-100"
          )}
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--brand-primary)]/8 border border-[var(--brand-primary)]/20">
            <MapPin className="w-3.5 h-3.5 text-[var(--brand-primary)] shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--brand-primary)] truncate">
                {activeBranch.name}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] truncate">
                {activeBranch.city} Branch
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = Icons[item.icon as keyof typeof Icons] as React.ElementType;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.href}>
              <Link
                href={hasChildren ? item.children![0].href : item.href}
                onClick={closeMobile}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  isActive
                    ? "bg-[var(--brand-primary)] text-white shadow-md shadow-brand-500/20"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  // When collapsed, center the icon
                  isCollapsed && "justify-center px-2"
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      "w-5 h-5 shrink-0",
                      isActive
                        ? "text-white"
                        : "text-slate-400 group-hover:text-[var(--brand-primary)]"
                    )}
                  />
                )}
                {/* Label + chevron hidden when collapsed */}
                <span
                  className={cn(
                    "transition-all duration-200 whitespace-nowrap overflow-hidden flex-1 flex items-center",
                    isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                  )}
                >
                  {item.label}
                  {hasChildren && (
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 ml-auto",
                        isActive ? "text-white/70" : "text-slate-400"
                      )}
                    />
                  )}
                </span>
              </Link>

              {/* Nested children — only shown when expanded */}
              {hasChildren && isActive && !isCollapsed && (
                <div className="ml-9 mt-1 space-y-1 border-l border-slate-200 pl-2">
                  {item.children!.map((child) => {
                    const ChildIcon = Icons[
                      child.icon as keyof typeof Icons
                    ] as React.ElementType;
                    const isChildActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={closeMobile}
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

      {/* Collapse toggle button — desktop only */}
      <div className="hidden lg:block px-3 py-2 border-t border-slate-100 shrink-0">
        <button
          onClick={toggleCollapsed}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "w-full flex items-center px-3 py-2 rounded-xl text-xs font-medium text-slate-500",
            "hover:bg-slate-50 hover:text-slate-800 transition-colors group",
            isCollapsed && "justify-center"
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 shrink-0 mr-2" />
              <span className="whitespace-nowrap overflow-hidden">
                Collapse
              </span>
            </>
          )}
        </button>
      </div>

      {/* Sign Out footer */}
      <div className={cn("p-3 border-t border-slate-100 shrink-0", isCollapsed && "flex justify-center")}>
        <button
          onClick={() => {
            logout();
            window.location.href = "/";
          }}
          title={isCollapsed ? "Sign Out" : undefined}
          className={cn(
            "flex items-center px-3 py-2 rounded-xl text-sm font-medium text-slate-600",
            "hover:bg-red-50 hover:text-red-600 transition-colors group",
            isCollapsed ? "justify-center w-auto" : "w-full gap-3"
          )}
        >
          <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500 shrink-0" />
          <span
            className={cn(
              "transition-all duration-200 whitespace-nowrap overflow-hidden",
              isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}
          >
            Sign Out
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP SIDEBAR ──────────────────────────────────────────────────
           This is a TRUE FLEX CHILD — not fixed. Its dynamic width pushes the
           content area without needing any pl-* offset on the sibling div.
           transition-[width] animates the collapse/expand smoothly. */}
      <aside
        className={cn(
          "hidden lg:flex flex-col shrink-0",
          "bg-white border-r border-slate-200",
          "shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
          "transition-[width] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
          "overflow-hidden",
          // Sticky: sidebar stays in view while content scrolls
          "sticky top-0 h-screen",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* ── MOBILE OVERLAY DRAWER ─────────────────────────────────────────────
           Fixed overlay on small screens. Slides in from left.
           The backdrop click calls closeMobile(). */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-50 transition-all duration-250",
          isMobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          onClick={closeMobile}
          className={cn(
            "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-250",
            isMobileOpen ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Drawer panel */}
        <aside
          className={cn(
            "absolute left-0 top-0 bottom-0 w-72 bg-white",
            "shadow-[8px_0_32px_rgba(0,0,0,0.12)]",
            "transition-transform duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebarContent}
        </aside>
      </div>
    </>
  );
}
