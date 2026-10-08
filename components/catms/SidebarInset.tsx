"use client";

import React, { useEffect } from "react";
import { useSidebarStore } from "@/lib/stores/sidebarStore";
import { cn } from "@/lib/utils";

// Page area next to the sidebar: leaves room for it on large screens unless it is collapsed.
export function SidebarInset({ children }: { children: React.ReactNode }) {
  const collapsed = useSidebarStore((s) => s.collapsed);

  useEffect(() => {
    try {
      useSidebarStore.persist.rehydrate();
    } catch {
      // localStorage unavailable: keep the default (sidebar visible)
    }
  }, []);

  return (
    <div
      className={cn(
        "flex-1 flex flex-col min-h-screen min-w-0 transition-[padding] duration-200",
        collapsed ? "lg:pl-0" : "lg:pl-64"
      )}
    >
      {children}
    </div>
  );
}
