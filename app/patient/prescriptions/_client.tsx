"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pill, CheckCircle2, Clock, AlertTriangle, Loader2, Stethoscope, Calendar, Info } from "lucide-react";
import {
  getPatientPrescriptions,
  type PatientPrescriptionItem,
} from "@/lib/actions/patient-prescriptions";

type Tab = "active" | "past" | "all";

export default function MyPrescriptionsPage({ user }: { user: any }) {
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
    return () => { cancelled = true; };
  }, []);

  if (!user || user.role !== "patient") return null;

  const active = prescriptions.filter((p) => p.isActive);
  const past = prescriptions.filter((p) => !p.isActive);
  const displayed = tab === "active" ? active : tab === "past" ? past : prescriptions;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "active", label: "Active", count: active.length },
    { key: "past", label: "Past", count: past.length },
    { key: "all", label: "All", count: prescriptions.length },
  ];

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
        <p className="text-slate-500">View your active and past prescribed medications.</p>
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
      {displayed.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 border rounded-xl border-dashed border-slate-200">
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

      {/* Prescription list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayed.map((presc) => (
          <PrescriptionCard key={presc.prescriptionId} presc={presc} />
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────── */
/*  Individual prescription card                  */
/* ────────────────────────────────────────────── */
function PrescriptionCard({ presc }: { presc: PatientPrescriptionItem }) {
  const isActive = presc.isActive;

  return (
    <Card
      className={`shadow-sm transition-all hover:shadow-md ${
        isActive ? "border-[var(--brand-primary)] shadow-blue-500/10" : "border-slate-200 opacity-85 hover:opacity-100"
      }`}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={`w-12 h-12 flex items-center justify-center shrink-0 rounded-2xl ${
              isActive ? "bg-blue-100 text-[var(--brand-primary)]" : "bg-slate-100 text-slate-400"
            }`}
          >
            <Pill className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Title + status badge */}
            <div className="flex justify-between items-start gap-2">
              <h4 className="font-bold text-slate-900 truncate">{presc.medicationName}</h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                  isActive
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {isActive ? (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" /> Completed
                  </span>
                )}
              </span>
            </div>

            {/* Dosage / frequency */}
            <p className="text-sm text-slate-600 font-medium mb-2">
              {presc.dosage}
              {presc.frequency ? ` — ${presc.frequency}` : ""}
            </p>

            {/* Strength + form */}
            {(presc.strength || presc.form) && (
              <p className="text-xs text-slate-500 mb-2">
                {[presc.strength, presc.form].filter(Boolean).join(" • ")}
                {presc.category ? ` • ${presc.category}` : ""}
              </p>
            )}

            {/* Notes */}
            {presc.notes && (
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-600 mb-3">
                <span className="font-semibold text-slate-700 flex items-center gap-1 mb-0.5">
                  <Info className="w-3 h-3" /> Notes
                </span>
                {presc.notes}
              </div>
            )}

            {/* Metadata row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              {presc.durationDays != null && (
                <span>
                  Duration: <strong className="text-slate-900">{presc.durationDays} days</strong>
                  {presc.endDate ? ` (ends ${presc.endDate})` : ""}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Stethoscope className="w-3 h-3" /> {presc.doctorName}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {presc.issuedDate}
              </span>
            </div>

            {/* Allergy flag */}
            {presc.allergyChecked && (
              <p className="mt-2 text-[10px] text-green-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Allergy checked
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
