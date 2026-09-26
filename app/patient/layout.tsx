import React from "react";
import { Header } from "@/components/catms/Header";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {children}
      </main>
    </div>
  );
}
