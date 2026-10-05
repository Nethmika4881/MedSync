"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Stethoscope,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  CalendarCheck,
  Activity,
  ClipboardList,
  CheckCircle2,
  FlaskConical,
} from "lucide-react";
import {
  getPatientRecords,
  type ConsultationRecordItem,
  type TreatmentItem,
} from "@/lib/actions/patient-records";

export default function MedicalRecordsPage({ user }: { user: any }) {
  const [records, setRecords] = useState<ConsultationRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getPatientRecords();
        if (!cancelled) setRecords(data);
      } catch {
        if (!cancelled) setError("Failed to load medical records. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (!user || user.role !== "patient") return null;

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-in">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
        <p className="text-sm text-slate-500">Loading your medical records…</p>
      </div>
    );
  }

  // ── Error ──
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

  // Summary stats
  const totalConsultations = records.length;
  const followUpsRequired = records.filter((r) => r.followUpRequired).length;
  const totalTreatments = records.reduce((sum, r) => sum + r.treatments.length, 0);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Medical Records</h2>
        <p className="text-slate-500">View your consultation history, diagnoses, and treatment records.</p>
      </div>

      {/* Summary card */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />
        <CardContent className="p-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalConsultations}</p>
              <p className="text-xs text-slate-500 font-medium">Consultations</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalTreatments}</p>
              <p className="text-xs text-slate-500 font-medium">Treatments</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{followUpsRequired}</p>
              <p className="text-xs text-slate-500 font-medium">Follow-ups Needed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consultation list */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-[var(--brand-primary)]" />
          Consultation History
        </h3>

        {records.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 border rounded-xl border-dashed border-slate-200">
            <FileText className="w-8 h-8 text-slate-300" />
            <p className="text-sm text-slate-500">No consultation records found.</p>
          </div>
        )}

        {records.map((record) => (
          <ConsultationCard key={record.consultationRecId} record={record} />
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────── */
/*  Consultation card (expandable)                */
/* ────────────────────────────────────────────── */
function ConsultationCard({ record }: { record: ConsultationRecordItem }) {
  const [expanded, setExpanded] = useState(false);

  const dateDisplay = new Date(record.appointmentDate + "T00:00:00").toLocaleDateString(
    undefined,
    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        {/* ── Header row (always visible) ── */}
        <button
          className="w-full p-5 text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer hover:bg-slate-50/50 transition-colors rounded-xl"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-blue-100 text-[var(--brand-primary)] flex items-center justify-center shrink-0 rounded-2xl">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">{record.doctorName}</h4>
              {record.specialization && (
                <p className="text-xs text-[var(--brand-primary)] font-medium">{record.specialization}</p>
              )}
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {dateDisplay}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {record.startTime} – {record.endTime}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {record.branchName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {record.followUpRequired && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 whitespace-nowrap flex items-center gap-1">
                <CalendarCheck className="w-3 h-3" /> Follow-up
              </span>
            )}
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </button>

        {/* ── Expanded details ── */}
        {expanded && (
          <div className="px-5 pb-5 pt-0 space-y-4 border-t border-slate-100 animate-fade-in">
            {/* Clinical fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {/* Diagnosis */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Diagnosis</p>
                <p className="text-sm text-slate-900 font-medium">
                  {record.diagnosis || "No diagnosis recorded"}
                </p>
              </div>

              {/* Symptoms */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Symptoms Reported</p>
                <p className="text-sm text-slate-700">
                  {record.symptoms || "No symptoms recorded"}
                </p>
              </div>

              {/* Reason for visit */}
              {record.reasonForVisit && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Reason for Visit</p>
                  <p className="text-sm text-slate-700">{record.reasonForVisit}</p>
                </div>
              )}

              {/* Follow-up */}
              {record.followUpRequired && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Follow-up Date</p>
                  <p className="text-sm text-amber-700 font-medium flex items-center gap-1">
                    <CalendarCheck className="w-3.5 h-3.5" />
                    {record.followUpDate
                      ? new Date(record.followUpDate + "T00:00:00").toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Date not set"}
                  </p>
                </div>
              )}
            </div>

            {/* Consultation notes */}
            {record.consultationNotes && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Doctor&apos;s Notes</p>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {record.consultationNotes}
                </p>
              </div>
            )}

            {/* Appointment notes (if different from consultation notes) */}
            {record.appointmentNotes && record.appointmentNotes !== record.consultationNotes && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Appointment Notes</p>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {record.appointmentNotes}
                </p>
              </div>
            )}

            {/* Treatments */}
            {record.treatments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" /> Treatments &amp; Procedures
                </p>
                <div className="space-y-2">
                  {record.treatments.map((t) => (
                    <TreatmentRow key={t.appointmentTreatmentId} treatment={t} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────── */
/*  Treatment row inside a consultation card      */
/* ────────────────────────────────────────────── */
function TreatmentRow({ treatment }: { treatment: TreatmentItem }) {
  const statusColor: Record<string, string> = {
    Completed: "bg-green-100 text-green-700",
    InProgress: "bg-blue-100 text-blue-700",
    Ordered: "bg-slate-100 text-slate-600",
    Cancelled: "bg-red-100 text-red-600",
  };

  const statusIcon: Record<string, React.ReactNode> = {
    Completed: <CheckCircle2 className="w-3 h-3" />,
    InProgress: <Loader2 className="w-3 h-3" />,
    Ordered: <Clock className="w-3 h-3" />,
    Cancelled: <AlertTriangle className="w-3 h-3" />,
  };

  return (
    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <FlaskConical className="w-4 h-4 text-slate-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{treatment.treatmentName}</p>
          <p className="text-xs text-slate-500">
            {treatment.category}
            {treatment.quantity > 1 ? ` × ${treatment.quantity}` : ""}
            {treatment.performedBy ? ` • By ${treatment.performedBy}` : ""}
          </p>
          {treatment.notes && (
            <p className="text-xs text-slate-500 mt-0.5 italic">{treatment.notes}</p>
          )}
        </div>
      </div>
      <span
        className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1 ${
          statusColor[treatment.status] || "bg-slate-100 text-slate-600"
        }`}
      >
        {statusIcon[treatment.status]}
        {treatment.status}
      </span>
    </div>
  );
}
