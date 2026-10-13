import React from "react";
import { Sidebar } from "@/components/catms/Sidebar";
import { Header } from "@/components/catms/Header";
import { SidebarInset } from "@/components/catms/SidebarInset";
import type { Metadata } from "next";

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.ico?v=2",
    shortcut: "/favicon.ico?v=2",
    apple: "/favicon.ico?v=2",
  },
};

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex">
      <Sidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 p-4 sm:p-8 overflow-x-hidden">{children}</main>
      </SidebarInset>
    </div>
  );
}
