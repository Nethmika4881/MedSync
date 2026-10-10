"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, CalendarClock, CalendarPlus, CalendarX, CheckCircle2, FlaskConical, Stethoscope, UserCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getDoctorNotifications } from "@/lib/actions/doctor-notifications";
import type { DoctorNotification, DoctorNotificationKind } from "@/lib/doctorTypes";
import { formatClockTime, formatDay } from "@/lib/doctorFormat";
import { cn } from "@/lib/utils";

const REFRESH_MS = 60_000;

const KIND_STYLE: Record<DoctorNotificationKind, { icon: React.ElementType; color: string; bg: string }> = {
  checked_in: { icon: UserCheck, color: "text-amber-600", bg: "bg-amber-100" },
  in_progress: { icon: Stethoscope, color: "text-purple-600", bg: "bg-purple-100" },
  follow_up: { icon: CalendarClock, color: "text-blue-600", bg: "bg-blue-100" },
  treatment_done: { icon: FlaskConical, color: "text-green-600", bg: "bg-green-100" },
  new_booking: { icon: CalendarPlus, color: "text-teal-600", bg: "bg-teal-100" },
  cancelled: { icon: CalendarX, color: "text-red-600", bg: "bg-red-100" },
};

function when(at: string | null): string {
  if (!at) return "";
  // A follow-up has a date but no time of day.
  if (at.endsWith("T00:00:00")) return formatDay(at.slice(0, 10));
  return `${formatDay(at.slice(0, 10))}, ${formatClockTime(at)}`;
}

// Bell in the header for doctors. Notifications are derived from today's appointments,
// consultation records and treatment orders, so the count means "needs your attention".
export function DoctorNotificationBell() {
  const pathname = usePathname();
  const [items, setItems] = useState<DoctorNotification[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await getDoctorNotifications());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  // On mount, on every page change, and once a minute.
  useEffect(() => {
    load();
  }, [load, pathname]);

  useEffect(() => {
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const count = items?.length ?? 0;

  return (
    <DropdownMenu onOpenChange={(open) => open && load()}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={count > 0 ? `Notifications, ${count} need attention` : "Notifications"}
          className="relative p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
        >
          <Bell className="w-5 h-5" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <DropdownMenuLabel className="px-4 py-3 text-sm font-semibold text-slate-900">
          Notifications
          {count > 0 && <span className="ml-2 text-xs font-medium text-slate-500">{count} need attention</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-0" />

        <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
          {items === null && !failed && <p className="px-4 py-8 text-center text-sm text-slate-500">Loading...</p>}
          {failed && items === null && (
            <p className="px-4 py-8 text-center text-sm text-red-600">Couldn&apos;t load notifications.</p>
          )}
          {items !== null && items.length === 0 && (
            <div className="px-4 py-10 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto text-green-500 mb-2" />
              <p className="text-sm font-semibold text-slate-900">You&apos;re all caught up</p>
              <p className="text-xs text-slate-500 mt-0.5">Nothing needs your attention right now.</p>
            </div>
          )}
          {items?.map((n) => {
            const { icon: Icon, color, bg } = KIND_STYLE[n.kind];
            return (
              <DropdownMenuItem key={n.id} asChild className="p-0 rounded-none focus:bg-slate-50 cursor-pointer">
                <Link href={n.href} className="flex items-start gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0">
                  <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", bg)}>
                    <Icon className={cn("w-4 h-4", color)} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900 truncate">{n.title}</span>
                    <span className="block text-xs text-slate-500 truncate">{n.detail}</span>
                    {n.at && <span className="block text-[11px] text-slate-400 mt-0.5">{when(n.at)}</span>}
                  </span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
