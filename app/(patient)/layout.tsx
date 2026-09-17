// Patient self-service portal layout.
// Uses a top navigation bar (PatientTopNav) — NOT the sidebar used by staff portals.
// AuthGuard handles redirect for unauthenticated users (mock Zustand auth).
// Will be replaced by middleware.ts role guard in Phase 1, Task 03.

import React from "react";
import { AuthGuard } from "@/components/catms/AuthGuard";
import { PatientTopNav } from "@/components/catms/PatientTopNav";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
        <PatientTopNav />
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
