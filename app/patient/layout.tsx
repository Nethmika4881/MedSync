import React from "react";
import { PatientSidebar } from "@/components/catms/PatientSidebar";
import { PatientHeader } from "@/components/catms/PatientHeader";
import { PatientSidebarInset } from "@/components/catms/PatientSidebarInset";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex">
      <PatientSidebar />
      <PatientSidebarInset>
        <PatientHeader />
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
          {children}
        </main>
      </PatientSidebarInset>
    </div>
  );
}
