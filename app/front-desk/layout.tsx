// IMPORTANT: All SQL queries in this group must append AND branch_id = $n
// using the user's active branch. Never run unscoped global queries from Front Desk routes.

import React from "react";
import { Sidebar } from "@/components/catms/Sidebar";
import { Header } from "@/components/catms/Header";
import { SidebarInset } from "@/components/catms/SidebarInset";

export default function FrontDeskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex">
      <Sidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 p-8 overflow-x-hidden">{children}</main>
      </SidebarInset>
    </div>
  );
}
