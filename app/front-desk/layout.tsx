import React from "react";
import { Sidebar } from "@/components/catms/Sidebar";
import { Header } from "@/components/catms/Header";
import { Building2 } from "lucide-react";
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

        {/* Active Branch Indicator for Front Desk */}
        <div className="bg-emerald-50/90 border-b border-emerald-100 px-8 py-2 flex items-center justify-between text-xs text-emerald-800 backdrop-blur-sm">
          <div className="flex items-center gap-2 font-medium">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Active Branch: <strong className="font-semibold text-emerald-950">Colombo Central Branch</strong></span>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100/80 text-emerald-700 border border-emerald-200">
            Front Desk Portal
          </span>
        </div>
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">{children}</main>
      </SidebarInset>
    </div>
  );
}
