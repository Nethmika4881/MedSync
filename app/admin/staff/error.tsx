"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StaffError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-96 w-full items-center justify-center">
      <div className="max-w-md space-y-4 rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <AlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Staff directory unavailable
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            We could not load the staff records. Check the database connection
            and try again.
          </p>
        </div>

        <Button type="button" onClick={reset}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
      </div>
    </div>
  );
}
