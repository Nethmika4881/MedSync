"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { SESSION_META, SessionType } from "@/lib/constants";;

const SESSION_BADGE_CLS: Record<SessionType, string> = {
  Morning:   "bg-amber-50  border-amber-200  text-amber-700",
  Midday:    "bg-sky-50    border-sky-200    text-sky-700",
  Afternoon: "bg-teal-50   border-teal-200   text-teal-700",
  Evening:   "bg-indigo-50 border-indigo-200 text-indigo-700",
};

interface SessionBadgeProps {
  session: SessionType;
  ticketNumber?: number;
  /** "full" = emoji + label + time range + ticket; "compact" = emoji + label + ticket; "minimal" = emoji + label */
  variant?: "full" | "compact" | "minimal";
  className?: string;
}

/**
 * Reusable session + ticket badge.
 * Used across all role views (dashboard, doctor schedule, front-desk, patient portal).
 */
export function SessionBadge({
  session,
  ticketNumber,
  variant = "compact",
  className,
}: SessionBadgeProps) {
  const meta = SESSION_META[session];
  const badgeCls = SESSION_BADGE_CLS[session];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        badgeCls,
        className
      )}
    >
      <span>{meta.emoji}</span>
      <span>{meta.label}</span>
      {variant === "full" && (
        <span className="opacity-60 font-medium">{meta.timeRange}</span>
      )}
      {ticketNumber !== undefined && (
        <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-white/60 border border-current/20 font-bold text-[10px]">
          #{ticketNumber}
        </span>
      )}
    </span>
  );
}

/** Standalone ticket-number badge (no session colour) */
export function TicketBadge({
  session,
  ticketNumber,
  className,
}: {
  session: SessionType;
  ticketNumber: number;
  className?: string;
}) {
  const badgeCls = SESSION_BADGE_CLS[session];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border rounded-lg px-2 py-1 text-xs font-bold",
        badgeCls,
        className
      )}
    >
      🎫 #{ticketNumber}
    </span>
  );
}
