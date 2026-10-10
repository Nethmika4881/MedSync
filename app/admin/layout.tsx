import React from "react";
import { Sidebar } from "@/components/catms/Sidebar";
import { Header } from "@/components/catms/Header";
import { SidebarInset } from "@/components/catms/SidebarInset";
import {getCurrentUser} from "@/lib/actions/getcurrentuser";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  if(user.role !== "admin") {
    redirect("unauthorized");
  }
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
