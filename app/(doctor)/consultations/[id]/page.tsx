"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useClinicalStore } from "@/lib/stores/clinicalStore";
import { useAppointmentStore } from "@/lib/stores/appointmentStore";
import { usePatientStore } from "@/lib/stores/patientStore";
import { useCurrentUser } from "@/lib/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/catms/StatusPill";
import { SafetyInfoBanner } from "@/components/catms/SafetyInfoBanner";
import { AvatarWithName } from "@/components/catms/AvatarWithName";
import { EmptyState } from "@/components/catms/EmptyState";
import { ArrowLeft, Save, Calendar } from "lucide-react";
import Link from "next/link";

export default function ConsultationWorkspacePage() {
  const params = useParams<{ id: string }>();
  const appointmentId = params.id;
  const router = useRouter();

  const { consultations, addConsultation, updateConsultation } = useClinicalStore();
  const { appointments } = useAppointmentStore();
  const { allergies, conditions } = usePatientStore();
  const user = useCurrentUser();

  const appt = appointments.find((a) => a.appointmentId === appointmentId);
  const existing = consultations.find((c) => c.appointmentId === appointmentId);

  const patientId = appt?.patientId ?? existing?.patientId;
  const patientName = appt?.patientName ?? existing?.patientName;
  const doctorId = appt?.doctorId ?? existing?.doctorId ?? user?.userId ?? "";
  const doctorName = appt?.doctorName ?? existing?.doctorName ?? user?.name ?? "";

  const [symptoms, setSymptoms] = useState(existing?.symptoms ?? "");
  const [diagnosis, setDiagnosis] = useState(existing?.diagnosis ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [followUpRequired, setFollowUpRequired] = useState(existing?.followUpRequired ?? false);
  const [followUpDate, setFollowUpDate] = useState(existing?.followUpDate ?? "");
  const [saved, setSaved] = useState(false);

  if (!patientId || !patientName) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Link href="/consultations" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Back to Queue
        </Link>
        <Card className="border-slate-200 shadow-sm">
          <EmptyState icon={Calendar} title="Appointment not found" description="This consultation could not be located." />
        </Card>
      </div>
    );
  }

  const patientAllergies = allergies.filter((a) => a.patientId === patientId);
  const patientConditions = conditions.filter((c) => c.patientId === patientId);

  const handleSave = () => {
    if (existing) {
      updateConsultation(existing.consultationId, {
        symptoms,
        diagnosis,
        notes,
        followUpRequired,
        followUpDate: followUpRequired ? followUpDate : undefined,
      });
    } else {
      addConsultation({
        consultationId: `CON-${Date.now()}`,
        appointmentId: appointmentId,
        patientId,
        patientName,
        doctorId,
        doctorName,
        date: new Date().toISOString().slice(0, 10),
        symptoms,
        diagnosis,
        notes,
        followUpRequired,
        followUpDate: followUpRequired ? followUpDate : undefined,
        treatmentIds: [],
        prescriptionIds: [],
      });
    }
    setSaved(true);
    router.push("/consultations");
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <Link href="/consultations" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" /> Back to Queue
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <AvatarWithName name={patientName} subtitle={appt ? `${appt.visitType} • ${new Date(appt.dateTime).toLocaleString([], { hour: "2-digit", minute: "2-digit" })}` : existing?.date} size="lg" />
        {appt && <StatusPill status={appt.status} />}
      </div>

      <SafetyInfoBanner patientName={patientName} allergies={patientAllergies} conditions={patientConditions} />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-900">Clinical Entry</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="symptoms">Symptoms</Label>
            <Textarea
              id="symptoms"
              rows={3}
              placeholder="Describe the patient's reported symptoms..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnosis</Label>
            <Textarea
              id="diagnosis"
              rows={3}
              placeholder="Clinical diagnosis / assessment..."
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={4}
              placeholder="Additional notes, advice given, observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <input
                id="followUp"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                checked={followUpRequired}
                onChange={(e) => setFollowUpRequired(e.target.checked)}
              />
              <Label htmlFor="followUp">Follow-up required</Label>
            </div>
            {followUpRequired && (
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="followUpDate">Follow-up date</Label>
                <Input
                  id="followUpDate"
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" className="rounded-xl" onClick={() => router.push("/consultations")}>
          Cancel
        </Button>
        <Button
          className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl px-6"
          onClick={handleSave}
          disabled={!symptoms && !diagnosis && !notes}
        >
          <Save className="w-4 h-4 mr-2" /> Save Consultation
        </Button>
      </div>
    </div>
  );
}
