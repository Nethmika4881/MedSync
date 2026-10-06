"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Error boundary for every /doctor page: a failed query shows this instead of a blank screen.
export default function DoctorError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[doctor portal] page failed:", error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto mt-24 text-center space-y-4">
      <AlertCircle className="w-10 h-10 mx-auto text-red-500" />
      <h2 className="text-xl font-bold text-slate-900">Something went wrong</h2>
      <p className="text-sm text-slate-500">
        We couldn&apos;t load this page. Check your connection and try again.
      </p>
      <Button onClick={reset} className="rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)]">
        Try again
      </Button>
    </div>
  );
}
