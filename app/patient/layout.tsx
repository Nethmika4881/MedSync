import React from "react";
import { PatientSidebar } from "@/components/catms/PatientSidebar";
import { PatientHeader } from "@/components/catms/PatientHeader";
import { PatientSidebarInset } from "@/components/catms/PatientSidebarInset";
import type { Metadata } from "next";

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.ico?v=2",
    shortcut: "/favicon.ico?v=2",
    apple: "/favicon.ico?v=2",
  },
};

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
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </PatientSidebarInset>
    </div>
  );
}
