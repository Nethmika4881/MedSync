"use client";

// app/(patient)/dashboard/page.tsx
// Patient dashboard — shows upcoming appointments, active prescriptions, and outstanding balance.
// Reads from Zustand mock stores. Will be replaced with Server Actions + raw SQL once DB is live.

import React, { useMemo } from "react";
import { useCurrentUser } from "@/lib/stores/authStore";
import { useAppointmentStore } from "@/lib/stores/appointmentStore";
import { usePharmacyStore } from "@/lib/stores/pharmacyStore";
import { useBillingStore } from "@/lib/stores/billingStore";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  Pill,
  CreditCard,
  ChevronRight,
  Clock,
  Stethoscope,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@/lib/types";

// ─── Helper: format date nicely ──────────────────────────────────────────────
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Helper: greeting based on time of day ───────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// ─── Status pill colour map ───────────────────────────────────────────────────
const statusColors: Record<AppointmentStatus, string> = {
  Confirmed:   "bg-blue-100 text-blue-700",
  "Checked-in": "bg-amber-100 text-amber-700",
  "In-Progress": "bg-purple-100 text-purple-700",
  "Checked-out": "bg-teal-100 text-teal-700",
  Completed:   "bg-green-100 text-green-700",
  Cancelled:   "bg-red-100 text-red-700",
  Rescheduled: "bg-slate-100 text-slate-600",
  Pending:     "bg-yellow-100 text-yellow-700",
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  href?: string;
}) {
  const inner = (
    <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
      <CardContent className="p-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
          <p className={cn("text-3xl font-bold", accent)}>{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={cn("p-3 rounded-xl", accent.replace("text-", "bg-").replace("-600", "-100").replace("-700", "-100"))}>
          <Icon className={cn("w-5 h-5", accent)} />
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PatientDashboardPage() {
  const user = useCurrentUser();
  const { appointments } = useAppointmentStore();
  const { prescriptions } = usePharmacyStore();
  const { invoices } = useBillingStore();

  // All data scoped to the logged-in patient
  const upcoming = useMemo(() => {
    if (!user) return [];
    return appointments
      .filter(
        (a) =>
          a.patientId === user.userId &&
          (a.status === "Confirmed" || a.status === "Pending")
      )
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
      .slice(0, 4);
  }, [appointments, user]);

  const activePrescriptions = useMemo(() => {
    if (!user) return [];
    return prescriptions.filter(
      (p) => p.patientId === user.userId && !p.dispensed
    );
  }, [prescriptions, user]);

  const outstandingBalance = useMemo(() => {
    if (!user) return 0;
    return invoices
      .filter(
        (i) =>
          i.patientId === user.userId &&
          (i.status === "Unpaid" || i.status === "Partial" || i.status === "Due" || i.status === "Overdue")
      )
      .reduce((sum, i) => sum + i.balanceDue, 0);
  }, [invoices, user]);

  if (!user) return null;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {getGreeting()}, {user.firstName}! 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Here's a summary of your health activity.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          icon={Calendar}
          label="Upcoming Appointments"
          value={upcoming.length}
          sub="Confirmed & pending"
          accent="text-blue-600"
          href="#upcoming-appointments"
        />
        <KpiCard
          icon={Pill}
          label="Active Prescriptions"
          value={activePrescriptions.length}
          sub="Awaiting dispensal"
          accent="text-violet-600"
          href="/prescriptions"
        />
        <KpiCard
          icon={CreditCard}
          label="Outstanding Balance"
          value={outstandingBalance > 0 ? `LKR ${outstandingBalance.toLocaleString()}` : "Settled"}
          sub={outstandingBalance > 0 ? "Across unpaid invoices" : "No dues"}
          accent={outstandingBalance > 0 ? "text-rose-600" : "text-green-600"}
        />
      </div>

      {/* Upcoming Appointments */}
      <section id="upcoming-appointments">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Upcoming Appointments</h2>
          <Link
            href="/find-doctors"
            className="text-sm font-medium text-[var(--brand-primary)] hover:underline flex items-center gap-1"
          >
            Book New <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-slate-500 bg-slate-50 text-sm">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No upcoming appointments.{" "}
            <Link href="/find-doctors" className="text-[var(--brand-primary)] hover:underline font-medium">
              Book one now
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((appt) => (
              <Card key={appt.appointmentId} className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div className="flex items-start gap-4">
                    {/* Ticket badge */}
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wide leading-none">Tkt</span>
                      <span className="text-lg font-bold text-blue-700 leading-none">
                        {appt.ticketNumber ?? "—"}
                      </span>
                    </div>

                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{appt.doctorName}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Stethoscope className="w-3 h-3" />
                        {appt.doctorSpecialization ?? appt.visitType}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(appt.dateTime)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "self-start sm:self-center text-xs font-semibold px-3 py-1 rounded-full",
                      statusColors[appt.status as AppointmentStatus] ?? "bg-slate-100 text-slate-600"
                    )}
                  >
                    {appt.status}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Active Prescriptions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Active Prescriptions</h2>
          <Link
            href="/prescriptions"
            className="text-sm font-medium text-[var(--brand-primary)] hover:underline flex items-center gap-1"
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activePrescriptions.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-slate-500 bg-slate-50 text-sm">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No active prescriptions.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activePrescriptions.slice(0, 4).map((presc) => (
              <Card key={presc.prescriptionId} className="border border-violet-100 shadow-sm">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                    <Pill className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{presc.medicationName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{presc.dosage} · {presc.frequency}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{presc.duration}</p>
                  </div>
                  <button className="flex items-center gap-1 text-xs font-semibold text-[var(--brand-primary)] hover:underline shrink-0">
                    <RotateCcw className="w-3 h-3" />
                    Refill
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
