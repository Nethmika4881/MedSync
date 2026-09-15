// Front Desk branch-operations portal layout — branch-scoped sidebar.
// AuthGuard handles redirect for unauthenticated users (mock Zustand auth).
// Will be replaced by middleware.ts role guard in Phase 1, Task 03.
//
// BRANCH SCOPING (LIVE):
//   hooks/use-branch-store.ts holds the active branchId for this session.
//   It is auto-seeded from MockUser.branchId by authStore.login().
//   ALL SQL queries in this route group MUST append AND branch_id = $n
//   using useBranchStore.getState().activeBranchId as the parameter.
//   Never run unscoped global queries from Front Desk routes.


import React from "react";
import { AuthGuard } from "@/components/catms/AuthGuard";
import { Sidebar } from "@/components/catms/Sidebar";
import { Header } from "@/components/catms/Header";

export default function FrontDeskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--bg-app)] flex">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 p-8 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
