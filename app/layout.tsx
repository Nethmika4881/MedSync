"use client";

// Next.js processes this global stylesheet at build time.
// @ts-expect-error CSS modules are handled by Next.js, not TypeScript.
import './globals.css';
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { Sidebar } from "@/components/catms/Sidebar";
import { Header } from "@/components/catms/Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) {
      router.replace("/");
    }
  }, [user, router]);

  return (
    <html lang="en">
      <body>
        {user ? (
          <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />
            <div className="flex-1 lg:pl-64 flex flex-col min-h-screen transition-all">
              <Header />
              <main className="flex-1 p-8 overflow-x-hidden">
                {children}
              </main>
            </div>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
