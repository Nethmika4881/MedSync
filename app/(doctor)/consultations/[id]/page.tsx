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
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/catms/StatusPill";
import { SafetyInfoBanner } from "@/components/catms/SafetyInfoBanner";
import { AvatarWithName } from "@/components/catms/AvatarWithName";
import { EmptyState } from "@/components/catms/EmptyState";
import { ArrowLeft, Save, Calendar, Plus, X, Search, Minus } from "lucide-react";
import Link from "next/link";
import { treatmentCatalogue } from "@/lib/mockData/treatments";

export default function ConsultationWorkspacePage() {
  const params = useParams<{ id: string }>();
  const appointmentId = params.id;
  const router = useRouter();

  const { consultations, treatments, addConsultation, updateConsultation, addTreatment, removeTreatment, updateTreatmentQuantity } = useClinicalStore();
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
  const [consultationId] = useState(existing?.consultationId ?? `CON-${Date.now()}`);
  const [catalogueSearch, setCatalogueSearch] = useState("");

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

  const attachedTreatments = treatments.filter((t) => t.consultationId === consultationId);
  const treatmentsTotal = attachedTreatments.reduce((sum, t) => sum + t.total, 0);

  const filteredCatalogue = treatmentCatalogue.filter((item) =>
    item.name.toLowerCase().includes(catalogueSearch.toLowerCase())
  );

  const handleAddTreatment = (catalogueId: string) => {
    const item = treatmentCatalogue.find((c) => c.catalogueId === catalogueId);
    if (!item) return;
    addTreatment({
      treatmentId: `TRT-${Date.now()}`,
      consultationId,
      patientId,
      patientName,
      doctorId,
      doctorName,
      treatmentName: item.name,
      category: item.category,
      description: item.description,
      unitPrice: item.unitPrice,
      quantity: 1,
      total: item.unitPrice,
      status: "Ordered",
      orderedAt: new Date().toISOString(),
      branchId: appt?.branchId ?? "BR-001",
    });
  };

  const handleSave = () => {
    const treatmentIds = attachedTreatments.map((t) => t.treatmentId);
    if (existing) {
      updateConsultation(existing.consultationId, {
        symptoms,
        diagnosis,
        notes,
        followUpRequired,
        followUpDate: followUpRequired ? followUpDate : undefined,
        treatmentIds,
      });
    } else {
      addConsultation({
        consultationId,
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
        treatmentIds,
        prescriptionIds: [],
      });
    }
    router.push("/consultations");
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
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

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-900">Treatments &amp; Procedures</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search treatment catalogue..."
              className="pl-9"
              value={catalogueSearch}
              onChange={(e) => setCatalogueSearch(e.target.value)}
            />
          </div>

          {catalogueSearch && (
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-56 overflow-y-auto custom-scrollbar">
              {filteredCatalogue.length === 0 && (
                <p className="p-4 text-sm text-slate-500">No matching treatments found.</p>
              )}
              {filteredCatalogue.map((item) => (
                <div key={item.catalogueId} className="flex items-center justify-between p-3 hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{item.category}</Badge>
                      <span className="text-xs text-slate-500">${item.unitPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg h-8"
                    onClick={() => {
                      handleAddTreatment(item.catalogueId);
                      setCatalogueSearch("");
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Attached ({attachedTreatments.length})</p>
            {attachedTreatments.length === 0 ? (
              <p className="text-sm text-slate-500">No treatments or procedures attached yet.</p>
            ) : (
              <div className="space-y-2">
                {attachedTreatments.map((t) => (
                  <div key={t.treatmentId} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{t.treatmentName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{t.category}</Badge>
                        <span className="text-xs text-slate-500">${t.unitPrice.toFixed(2)} each</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg">
                        <button
                          className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                          disabled={t.quantity <= 1}
                          onClick={() => updateTreatmentQuantity(t.treatmentId, t.quantity - 1)}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-semibold w-5 text-center">{t.quantity}</span>
                        <button
                          className="p-1.5 text-slate-500 hover:text-slate-900"
                          onClick={() => updateTreatmentQuantity(t.treatmentId, t.quantity + 1)}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-slate-900 w-16 text-right">${t.total.toFixed(2)}</span>
                      <button
                        className="p-1.5 text-slate-400 hover:text-red-600"
                        onClick={() => removeTreatment(t.treatmentId)}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <p className="text-sm font-bold text-slate-900">Total: ${treatmentsTotal.toFixed(2)}</p>
                </div>
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
