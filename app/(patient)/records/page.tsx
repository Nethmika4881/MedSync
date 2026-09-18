"use client";

import React, { useState, useMemo } from "react";
import { useCurrentUser, useRole } from "@/lib/stores/authStore";
import { useClinicalStore } from "@/lib/stores/clinicalStore";
import { usePatientStore } from "@/lib/stores/patientStore";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Download,
  CheckCircle2,
  ShieldAlert,
  Search,
  Stethoscope,
  Eye,
  Calendar,
  Filter,
} from "lucide-react";
import type { ConsultationRecord } from "@/lib/types";
import { ConsultationDetailModal } from "@/components/catms/ConsultationDetailModal";

export default function MedicalRecordsPage() {
  const user = useCurrentUser();
  const role = useRole();
  const { consultations } = useClinicalStore();
  const { allergies, conditions } = usePatientStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationRecord | null>(null);

  const myConsultations = useMemo(() => {
    if (!user) return [];
    return consultations.filter((c) => c.patientId === user.userId);
  }, [consultations, user]);

  const filteredConsultations = useMemo(() => {
    if (!searchTerm.trim()) return myConsultations;
    const term = searchTerm.toLowerCase();
    return myConsultations.filter(
      (c) =>
        c.doctorName.toLowerCase().includes(term) ||
        (c.diagnosis && c.diagnosis.toLowerCase().includes(term)) ||
        (c.symptoms && c.symptoms.toLowerCase().includes(term)) ||
        (c.notes && c.notes.toLowerCase().includes(term))
    );
  }, [myConsultations, searchTerm]);

  const myAllergies = useMemo(() => {
    if (!user) return [];
    return allergies.filter((a) => a.patientId === user.userId);
  }, [allergies, user]);

  const myConditions = useMemo(() => {
    if (!user) return [];
    return conditions.filter((c) => c.patientId === user.userId);
  }, [conditions, user]);

  if (!user || role !== "patient") return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Medical Records</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Safely inspect your past clinical consultation notes, diagnoses, active conditions, and allergies.
        </p>
      </div>

      {/* Health Summary Card */}
      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-3xl">
        <div className="h-3 bg-gradient-to-r from-blue-500 via-teal-500 to-indigo-600" />
        <CardContent className="p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            Health Profile Summary
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Active Conditions
              </p>
              {myConditions.length > 0 ? (
                <div className="space-y-2">
                  {myConditions.map((c) => (
                    <div
                      key={c.conditionId}
                      className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{c.conditionName}</p>
                        <p className="text-xs text-slate-500">Diagnosed: {c.diagnosedDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                  No active medical conditions recorded.
                </p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Known Allergies
              </p>
              {myAllergies.length > 0 ? (
                <div className="space-y-2">
                  {myAllergies.map((a) => (
                    <div
                      key={a.allergyId}
                      className="flex items-start gap-2 bg-rose-50 p-3 rounded-xl border border-rose-100"
                    >
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-rose-900">{a.allergenName}</p>
                        <p className="text-xs text-rose-700 font-medium">{a.severity} Severity</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                  No known drug or environmental allergies.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consultations Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-[var(--brand-primary)]" />
            Consultation History &amp; Diagnoses
          </h2>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search diagnosis, doctor, notes..."
              className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
            />
          </div>
        </div>

        {filteredConsultations.length === 0 ? (
          <div className="p-10 border-2 border-dashed border-slate-200 rounded-3xl text-center bg-slate-50/50">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Consultation Notes Found</p>
            <p className="text-xs text-slate-500 mt-1">
              {searchTerm ? "No matches for your search keywords." : "No past consultations recorded for your account."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredConsultations.map((consult) => (
              <Card
                key={consult.consultationId}
                className="border border-slate-200 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{consult.doctorName}</h3>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          Verified Consultation
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(consult.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedConsultation(consult)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white text-xs font-semibold rounded-xl transition-all shadow-xs shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" /> Inspect Full Report
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Primary Diagnosis
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {consult.diagnosis || "No primary diagnosis specified"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Symptoms Reported
                      </p>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {consult.symptoms || "Routine check / General evaluation"}
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Doctor's Clinical Notes
                      </p>
                      <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed line-clamp-3">
                        {consult.notes}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Consultation Detail Modal */}
      {selectedConsultation && (
        <ConsultationDetailModal
          consultation={selectedConsultation}
          onClose={() => setSelectedConsultation(null)}
        />
      )}
    </div>
  );
}
