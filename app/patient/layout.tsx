// Patient self-service portal layout — top navigation bar only (no sidebar).
// AuthGuard handles redirect for unauthenticated users (mock Zustand auth).
// Will be replaced by middleware.ts role guard in Phase 1, Task 03.

import React from "react";
import { AuthGuard } from "@/components/catms/AuthGuard";
import { Header } from "@/components/catms/Header";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
        <Header />
        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
