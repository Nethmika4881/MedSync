"use client";

import React from "react";
import type { ConsultationRecord } from "@/lib/types";
import { usePharmacyStore } from "@/lib/stores/pharmacyStore";
import { useClinicalStore } from "@/lib/stores/clinicalStore";
import { Button } from "@/components/ui/button";
import {
  X,
  FileText,
  Stethoscope,
  Calendar,
  Pill,
  Activity,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

export function ConsultationDetailModal({
  consultation,
  onClose,
}: {
  consultation: ConsultationRecord;
  onClose: () => void;
}) {
  const { prescriptions } = usePharmacyStore();
  const { treatments } = useClinicalStore();

  // Find related prescriptions and treatments
  const relatedPrescriptions = prescriptions.filter(
    (p) =>
      p.consultationId === consultation.consultationId ||
      (p.patientId === consultation.patientId &&
        p.doctorId === consultation.doctorId &&
        new Date(p.issuedDate).toDateString() === new Date(consultation.date).toDateString())
  );

  const relatedTreatments = treatments.filter(
    (t) =>
      t.appointmentId === consultation.appointmentId ||
      (t.patientId === consultation.patientId &&
        t.doctorId === consultation.doctorId &&
        new Date(t.orderedAt).toDateString() === new Date(consultation.date).toDateString())
  );

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Clinical Consultation Report</h2>
              <p className="text-white/80 text-xs">
                {consultation.doctorName} · {new Date(consultation.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Header metadata bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Doctor</span>
              <span className="font-bold text-slate-800">{consultation.doctorName}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Consultation Date</span>
              <span className="font-semibold text-slate-800">
                {new Date(consultation.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Follow-Up</span>
              <span className="font-semibold text-teal-600">
                {consultation.followUpRequired
                  ? consultation.followUpDate
                    ? `Needed by ${consultation.followUpDate}`
                    : "Recommended"
                  : "None Required"}
              </span>
            </div>
          </div>

          {/* Diagnosis & Symptoms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-2 mb-1.5">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wide text-blue-900">
                  Primary Diagnosis
                </h3>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {consultation.diagnosis || "No primary diagnosis recorded"}
              </p>
            </div>

            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-100">
              <div className="flex items-center gap-2 mb-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wide text-amber-900">
                  Symptoms Reported
                </h3>
              </div>
              <p className="text-sm font-medium text-slate-800 leading-relaxed">
                {consultation.symptoms || "Routine follow-up / general evaluation"}
              </p>
            </div>
          </div>

          {/* Doctor's Notes */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Clinical Observations & Notes
            </h3>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 text-sm text-slate-700 leading-relaxed">
              {consultation.notes || "No additional clinical notes."}
            </div>
          </div>

          {/* Prescriptions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-violet-600" />
                Prescribed Medications ({relatedPrescriptions.length})
              </h3>
            </div>
            {relatedPrescriptions.length > 0 ? (
              <div className="space-y-2">
                {relatedPrescriptions.map((p) => (
                  <div
                    key={p.prescriptionId}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-2xs text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{p.medicationName}</p>
                      <p className="text-slate-500 mt-0.5">
                        Dosage: {p.dosage} · Frequency: {p.frequency} · Duration: {p.duration}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                        p.dispensed
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {p.dispensed ? "Dispensed" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                No medications prescribed during this visit.
              </p>
            )}
          </div>

          {/* Diagnostic & Laboratory Procedures */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-teal-600" />
                Ordered Procedures & Lab Tests ({relatedTreatments.length})
              </h3>
            </div>
            {relatedTreatments.length > 0 ? (
              <div className="space-y-2">
                {relatedTreatments.map((t) => (
                  <div
                    key={t.treatmentId}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-2xs text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{t.treatmentName}</p>
                      <p className="text-slate-500 mt-0.5">Category: {t.category} · Fee: LKR {t.unitPrice}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-blue-100 text-blue-700">
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                No special laboratory or radiology procedures ordered.
              </p>
            )}
          </div>

          {/* Action footer */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex-1 rounded-xl h-11 border-slate-200 gap-2 font-semibold"
            >
              <Download className="w-4 h-4" />
              Download / Print Summary
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-11 font-semibold"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
