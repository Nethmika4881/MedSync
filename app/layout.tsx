// Root layout — bare HTML shell only.
// Each role-based route group ((admin), (patient), (doctor), (front-desk))
// owns its own layout.tsx with the appropriate Sidebar or Header.
// Auth gating is handled per route group layout and will be enforced by
// middleware.ts when NextAuth.js is wired up (Phase 1, Task 03).

import "./globals.css";
import React from "react";

export const metadata = {
  title: "MedSync | MedSync Clinic Management",
  description:
    "Multi-branch clinic management system — patient booking, clinical workspace, front desk, and admin portals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
