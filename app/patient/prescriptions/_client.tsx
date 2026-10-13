"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pill,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Stethoscope,
  Calendar,
  Info,
  MapPin,
} from "lucide-react";
import {
  getPatientPrescriptions,
  type PatientPrescriptionItem,
} from "@/lib/actions/patient-prescriptions";
import {
  groupPrescriptionsByAppointment,
  type AppointmentPrescriptionGroup,
} from "@/lib/utils/prescription-grouping";
import type { AuthUser } from "@/lib/types";

type Tab = "active" | "past" | "all";

export default function MyPrescriptionsPage({ user }: { user: AuthUser }) {
  const [prescriptions, setPrescriptions] = useState<PatientPrescriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("active");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getPatientPrescriptions();
        if (!cancelled) setPrescriptions(data);
      } catch {
        if (!cancelled) setError("Failed to load prescriptions. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter medicines by active status according to existing application logic
  const active = prescriptions.filter((p) => p.isActive);
  const past = prescriptions.filter((p) => !p.isActive);
  const displayedMedicines =
    tab === "active" ? active : tab === "past" ? past : prescriptions;

  // Group filtered medicines by their appointmentId
  const appointmentGroups = useMemo(
    () => groupPrescriptionsByAppointment(displayedMedicines),
    [displayedMedicines]
  );

  // Preserve existing count semantics (representing total medicine records)
  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "active", label: "Active", count: active.length },
    { key: "past", label: "Past", count: past.length },
    { key: "all", label: "All", count: prescriptions.length },
  ];

  if (!user || user.role !== "patient") return null;

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-in">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
        <p className="text-sm text-slate-500">Loading your prescriptions…</p>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-in">
        <AlertTriangle className="w-8 h-8 text-amber-500" />
        <p className="text-sm text-slate-600">{error}</p>
        <button
          className="text-sm font-semibold text-[var(--brand-primary)] hover:underline"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Prescriptions</h2>
        <p className="text-slate-500">View your active and past prescribed medications grouped by appointment visit.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === t.key
                ? "bg-[var(--brand-primary)] text-white shadow"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t.label}
            <span
              className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                tab === t.key
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Empty state */}
      {displayedMedicines.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 border rounded-xl border-dashed border-slate-200 bg-white">
          <Pill className="w-8 h-8 text-slate-300" />
          <p className="text-sm text-slate-500">
            {tab === "active"
              ? "You have no active prescriptions."
              : tab === "past"
              ? "No past prescriptions found."
              : "No prescriptions on record."}
          </p>
        </div>
      )}

      {/* Grouped appointment cards list */}
      <div className="space-y-5">
        {appointmentGroups.map((group) => (
          <AppointmentCard key={group.appointmentId} group={group} />
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────── */
/*  Shared Appointment Card                       */
/* ────────────────────────────────────────────── */
function AppointmentCard({ group }: { group: AppointmentPrescriptionGroup }) {
  return (
    <Card className="shadow-sm border border-slate-200/90 rounded-2xl overflow-hidden transition-all hover:shadow-md bg-white">
      {/* Shared Appointment Header */}
      <div className="bg-slate-50/80 border-b border-slate-100 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-[var(--brand-primary)] flex items-center justify-center shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                {group.doctorName}
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {group.issuedDate}
                </span>
                {group.branchName && (
                  <span className="flex items-center gap-1 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {group.branchName}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
              <Pill className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              {group.medicines.length} {group.medicines.length === 1 ? "medicine" : "medicines"}
            </span>
          </div>
        </div>
      </div>

      {/* Distinct section for each prescribed medicine */}
      <CardContent className="p-4 sm:p-5 space-y-3 sm:space-y-4">
        {group.medicines.map((med) => (
          <MedicineSection key={med.prescriptionId} med={med} />
        ))}
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────── */
/*  Individual Medicine Section                   */
/* ────────────────────────────────────────────── */
function MedicineSection({ med }: { med: PatientPrescriptionItem }) {
  const isActive = med.isActive;

  return (
    <div
      className={`flex items-start gap-3.5 sm:gap-4 p-3.5 sm:p-4 rounded-xl border transition-all ${
        isActive
          ? "border-teal-100 bg-teal-50/20 hover:bg-teal-50/40"
          : "border-slate-100 bg-slate-50/40 hover:bg-slate-50/80 opacity-90 hover:opacity-100"
      }`}
    >
      {/* Icon */}
      <div
        className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0 rounded-xl ${
          isActive
            ? "bg-teal-50 text-[var(--brand-primary)] border border-teal-100"
            : "bg-slate-100 text-slate-400 border border-slate-200/60"
        }`}
      >
        <Pill className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Title + Individual Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
              {med.medicationName}
            </h4>
            {(med.strength || med.form) && (
              <span className="text-xs font-medium text-slate-500">
                {[med.strength, med.form].filter(Boolean).join(" • ")}
              </span>
            )}
            {med.category && (
              <span className="text-[11px] text-slate-400">
                • {med.category}
              </span>
            )}
          </div>

          {/* Medicine's individual status badge */}
          <div className="shrink-0">
            {isActive ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap bg-blue-100 text-blue-700">
                <Clock className="w-3 h-3 text-blue-600" /> Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap bg-slate-100 text-slate-600">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
              </span>
            )}
          </div>
        </div>

        {/* Dosage & frequency */}
        <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1 mb-2">
          {med.dosage}
          {med.frequency ? ` — ${med.frequency}` : ""}
        </p>

        {/* Notes / instructions */}
        {med.notes && (
          <div className="bg-white/90 p-2.5 rounded-lg border border-slate-200/70 text-xs text-slate-600 mb-2.5">
            <span className="font-semibold text-slate-700 flex items-center gap-1 mb-0.5">
              <Info className="w-3.5 h-3.5 text-slate-400" /> Notes
            </span>
            <p className="whitespace-pre-line">{med.notes}</p>
          </div>
        )}

        {/* Metadata: Duration, Expiry, Allergy */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 mt-2">
          {med.durationDays != null && (
            <span>
              Duration: <strong className="text-slate-900 font-semibold">{med.durationDays} days</strong>
              {med.endDate ? ` (ends ${med.endDate})` : ""}
            </span>
          )}
          {med.allergyChecked && (
            <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Allergy checked
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
