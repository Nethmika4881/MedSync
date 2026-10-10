import React from "react";
import { Sidebar } from "@/components/catms/Sidebar";
import { Header } from "@/components/catms/Header";
import { SidebarInset } from "@/components/catms/SidebarInset";

export default function AdminLayout({
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
