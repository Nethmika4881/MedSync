import React from "react";
import { Sidebar } from "@/components/catms/Sidebar";
import { Header } from "@/components/catms/Header";

export default function AdminLayout({
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
