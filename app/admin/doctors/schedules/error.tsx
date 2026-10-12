"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <Card className="mx-auto max-w-2xl border-red-100 p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
        <AlertCircle className="h-7 w-7 text-red-600" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-slate-900">Could not load doctor schedules</h2>
      <p className="mt-2 text-sm text-slate-500">
        Please try again. If the problem continues, check the database connection.
      </p>
      <Button
        type="button"
        onClick={reset}
        className="mt-5 min-h-11 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)]"
      >
        Try Again
      </Button>
    </Card>
  );
}
