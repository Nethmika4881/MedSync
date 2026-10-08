"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startConsultation } from "@/lib/actions/doctor-appointments";
import type { AppointmentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StartConsultationButtonProps {
  appointmentId: string;
  status: AppointmentStatus;
  startLabel?: string;
  resumeLabel?: string;
  size?: "sm" | "default";
  className?: string;
}

export function StartConsultationButton({
  appointmentId,
  status,
  startLabel = "Start",
  resumeLabel = "Resume",
  size = "sm",
  className,
}: StartConsultationButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resuming = status === "In-Progress";

  async function handleClick() {
    setBusy(true);
    setError(null);

    if (!resuming) {
      const result = await startConsultation(appointmentId);
      if (!result.ok) {
        setError(result.error);
        setBusy(false);
        return;
      }
    }

    router.push(`/doctor/consultations/${appointmentId}`);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size={size}
        disabled={busy}
        onClick={handleClick}
        className={cn(
          "rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white",
          size === "sm" && "h-8",
          className
        )}
      >
        <ClipboardPlus className="w-4 h-4 mr-1.5" />
        {busy ? "Opening..." : resuming ? resumeLabel : startLabel}
      </Button>
      {error && <p className="text-xs text-red-600 max-w-[220px] text-right">{error}</p>}
    </div>
  );
}
