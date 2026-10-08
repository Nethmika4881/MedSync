"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, CalendarCheck, FileText, Pill, Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/catms/EmptyState";
import { AvatarWithName } from "@/components/catms/AvatarWithName";
import { formatDay } from "@/lib/doctorFormat";
import type { PatientDetail } from "@/lib/doctorTypes";

function Field({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-slate-900 mt-1">{value === null || value === "" ? "—" : value}</p>
    </div>
  );
}

export default function PatientDetailPage({ patient }: { patient: PatientDetail }) {
  const emergency = [patient.emergencyContactName, patient.emergencyContactRelationship && `(${patient.emergencyContactRelationship})`]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <Link href="/doctor/patients" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" /> Back to Patients
      </Link>

      <AvatarWithName name={patient.fullName} subtitle={`${patient.gender || "—"} • ${patient.age ?? "—"} yrs`} size="lg" />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-900">Patient Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Age" value={patient.age} />
          <Field label="Gender" value={patient.gender} />
          <Field label="Blood Group" value={patient.bloodGroup} />
          <Field label="Phone" value={patient.phone} />
          <Field label="Emergency Contact" value={emergency} />
          <Field label="Emergency Phone" value={patient.emergencyContactPhone} />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-400" /> Visit History ({patient.history.length})
        </h3>

        {patient.history.length === 0 ? (
          <Card className="border-slate-200 shadow-sm">
            <EmptyState icon={CalendarCheck} title="No recorded visits" description="Consultation records will appear here." className="py-12" />
          </Card>
        ) : (
          patient.history.map((visit) => (
            <Card key={visit.appointmentId} className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <CardTitle className="text-sm font-semibold text-slate-900">{formatDay(visit.date)}</CardTitle>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5" /> {visit.doctorName}</span>
                    {visit.isMine && (
                      <Link href={`/doctor/consultations/${visit.appointmentId}`} className="font-semibold text-[var(--brand-primary)]">
                        Open record
                      </Link>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Symptoms" value={visit.symptoms} />
                  <Field label="Diagnosis" value={visit.diagnosis} />
                </div>
                {visit.notes && <Field label="Notes" value={visit.notes} />}
                {visit.followUpRequired && (
                  <Badge variant="outline">Follow-up {visit.followUpDate ? formatDay(visit.followUpDate) : "required"}</Badge>
                )}

                {visit.treatments.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Treatments</p>
                    <div className="flex flex-wrap gap-2">
                      {visit.treatments.map((t, i) => (
                        <Badge key={i} variant="outline">{t.name} × {t.quantity}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {visit.prescriptions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Prescriptions</p>
                    <ul className="space-y-1">
                      {visit.prescriptions.map((p, i) => (
                        <li key={i} className="flex items-center gap-2 text-slate-700">
                          <Pill className="w-3.5 h-3.5 text-[var(--brand-primary)] shrink-0" />
                          <span className="font-medium">{p.medication}</span>
                          <span className="text-slate-500">
                            {[p.dosage, p.frequency, p.durationDays ? `${p.durationDays} days` : ""].filter(Boolean).join(" • ")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
