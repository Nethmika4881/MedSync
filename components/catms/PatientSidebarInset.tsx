"use client";

import React, { useEffect, useState } from "react";
import { usePatientSidebarStore } from "@/lib/stores/patientSidebarStore";
import { cn } from "@/lib/utils";

export function PatientSidebarInset({ children }: { children: React.ReactNode }) {
  const collapsed = usePatientSidebarStore((s) => s.collapsed);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      usePatientSidebarStore.persist.rehydrate();
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  const isCollapsed = mounted && collapsed;

  return (
    <div
      className={cn(
        "flex-1 flex flex-col min-h-screen min-w-0 transition-[padding] duration-300 ease-in-out",
        isCollapsed ? "lg:pl-20" : "lg:pl-64"
      )}
    >
      {children}
    </div>
  );
}
