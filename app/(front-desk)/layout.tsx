// Front Desk branch-operations portal layout — branch-scoped sidebar.
// Wraps all routes under app/(front-desk)/ with the shared Sidebar and Header.
// Role guard: only users with role === "front_desk" should reach these routes.
// All SQL queries in this group must append AND branch_id = $n using the
// user's active branch from Zustand (use-branch-store.ts) — never global queries.
// Full route protection is implemented via middleware.ts (Phase 1, Task 03).

import React from "react";
import { Sidebar } from "@/components/catms/Sidebar";
import { Header } from "@/components/catms/Header";

export default function FrontDeskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex">
      <Sidebar />
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen transition-all">
        <Header />
        <main className="flex-1 p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
