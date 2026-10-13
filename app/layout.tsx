// Root layout — bare HTML shell only.
// Each role-based route group ((admin), (patient), (doctor), (front-desk))
// owns its own layout.tsx with the appropriate Sidebar or Header.
// Auth gating is handled per route group layout and will be enforced by
// middleware.ts when NextAuth.js is wired up (Phase 1, Task 03).

import "./globals.css";
import React from "react";

export const metadata = {
  title: "MedSync | Clinic Management",
  description:
    "Multi-branch clinic management system — patient booking, clinical workspace, front desk, and admin portals.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
 return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('medsync_theme') || 'light';
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (theme === 'system' && prefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 min-h-screen transition-colors duration-150">
        {children}
      </body>
    </html>
  );
}
