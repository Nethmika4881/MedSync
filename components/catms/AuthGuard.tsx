"use client";

// AuthGuard — wraps any portal layout to redirect unauthenticated users to the
// landing page. Uses the mock Zustand authStore until NextAuth.js middleware is
// wired up in Phase 1, Task 03.
// Usage: wrap children inside each role-based route group layout.

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";

type Props = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: Props) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) {
      router.replace("/");
    }
  }, [user, router]);

  if (!user) return null;

  return <>{children}</>;
}
