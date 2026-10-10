"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle, AlertTriangle, ArrowLeft, CheckCircle2, Lock, Minus, Pill, Plus, Receipt, Save, Search, User, X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AvatarWithName } from "@/components/catms/AvatarWithName";
import { StatusPill } from "@/components/catms/StatusPill";
import { formatClockTime, formatDay, formatMoney } from "@/lib/doctorFormat";
import { saveConsultationDraft, completeConsultation } from "@/lib/actions/doctor-consultations";
import type { ConsultationWorkspace, WorkspaceTreatment } from "@/lib/doctorTypes";
import type { TreatmentCatalogueItem, Medication, TreatmentCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

interface OrderedTreatment {
  treatmentServiceCode: string;
  name: string;
  category: TreatmentCategory;
  unitPrice: number;
  quantity: number;
}
interface DraftPrescription {
  key: string;
  medicationId: string;
  medicationName: string;
  contraindications: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  notes: string;
  allergyChecked: boolean;
}

interface WorkspaceProps {
  workspace: ConsultationWorkspace;
  catalogue: TreatmentCatalogueItem[];
  medications: Medication[];
}

// Treatments the lab/radiology team already started can't be edited from here.
const isEditable = (t: WorkspaceTreatment) => t.status === "Ordered";

export default function ConsultationWorkspacePage({ workspace, catalogue, medications }: WorkspaceProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { appointment: appt, consultation, isLocked } = workspace;

  const [symptoms, setSymptoms] = useState(consultation?.symptoms ?? "");
  const [diagnosis, setDiagnosis] = useState(consultation?.diagnosis ?? "");
  const [notes, setNotes] = useState(consultation?.notes ?? "");
  const [followUpRequired, setFollowUpRequired] = useState(consultation?.followUpRequired ?? false);
  const [followUpDate, setFollowUpDate] = useState(consultation?.followUpDate ?? "");

  const [ordered, setOrdered] = useState<OrderedTreatment[]>(() =>
    workspace.treatments.filter(isEditable).map((t) => ({
      treatmentServiceCode: t.treatmentServiceCode,
      name: t.name,
      category: t.category,
      unitPrice: t.unitPrice,
      quantity: t.quantity,
    }))
  );
  const started = workspace.treatments.filter((t) => !isEditable(t));

  const [prescriptions, setPrescriptions] = useState<DraftPrescription[]>(() =>
    workspace.prescriptions.map((p) => ({
      key: p.prescriptionId,
      medicationId: p.medicationId,
      medicationName: p.medicationName,
      contraindications: p.contraindications,
      dosage: p.dosage,
      frequency: p.frequency,
      durationDays: p.durationDays,
      notes: p.notes,
      allergyChecked: p.allergyChecked,
    }))
  );

  const [catalogueSearch, setCatalogueSearch] = useState("");
  const [medicationSearch, setMedicationSearch] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const filteredCatalogue = useMemo(
    () => catalogue.filter((c) => c.name.toLowerCase().includes(catalogueSearch.toLowerCase())),
    [catalogue, catalogueSearch]
  );
  const filteredMedications = useMemo(() => {
    const q = medicationSearch.toLowerCase();
    return medications.filter(
      (m) => m.genericName.toLowerCase().includes(q) || (m.brandName ?? "").toLowerCase().includes(q)
    );
  }, [medications, medicationSearch]);

  const treatmentsTotal =
    ordered.reduce((sum, t) => sum + t.unitPrice * t.quantity, 0) +
    started.filter((t) => t.status !== "Cancelled").reduce((sum, t) => sum + t.total, 0);
  const estimatedTotal = appt.fee + treatmentsTotal;
  const unchecked = prescriptions.filter((p) => !p.allergyChecked).length;

  const addTreatment = (item: TreatmentCatalogueItem) =>
    setOrdered((list) => {
      const existing = list.find((t) => t.treatmentServiceCode === item.catalogueId);
      if (existing) {
        return list.map((t) => (t === existing ? { ...t, quantity: Math.min(100, t.quantity + 1) } : t));
      }
      return [
        ...list,
        { treatmentServiceCode: item.catalogueId, name: item.name, category: item.category, unitPrice: item.unitPrice, quantity: 1 },
      ];
    });

  const addMedication = (med: Medication) =>
    setPrescriptions((list) => [
      ...list,
      {
        key: `new-${med.medicationId}-${list.length}-${Date.now()}`,
        medicationId: med.medicationId,
        medicationName: [med.genericName, med.strength].filter(Boolean).join(" "),
        contraindications: med.contraindications ?? "",
        dosage: med.strength ?? "",
        frequency: "Once daily",
        durationDays: 7,
        notes: "",
        allergyChecked: false,
      },
    ]);

  const updatePrescription = (key: string, updates: Partial<DraftPrescription>) =>
    setPrescriptions((list) => list.map((p) => (p.key === key ? { ...p, ...updates } : p)));

  const buildInput = () => ({
    appointmentId: appt.appointmentId,
    symptoms,
    diagnosis,
    notes,
    followUpRequired,
    followUpDate: followUpRequired ? followUpDate || undefined : undefined,
    treatments: ordered.map((t) => ({ treatmentServiceCode: t.treatmentServiceCode, quantity: t.quantity })),
    prescriptions: prescriptions.map((p) => ({
      medicationId: p.medicationId,
      dosage: p.dosage,
      frequency: p.frequency,
      durationDays: p.durationDays,
      notes: p.notes,
      allergyChecked: p.allergyChecked,
    })),
  });

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await saveConsultationDraft(buildInput());
      if (!result.ok) return setMessage({ type: "error", text: result.error });
      setMessage({ type: "success", text: "Draft saved." });
      router.refresh();
    });
  };

  const handleComplete = () => {
    setMessage(null);
    if (!diagnosis.trim()) return setMessage({ type: "error", text: "A diagnosis is required to complete the consultation." });
    if (followUpRequired && !followUpDate) return setMessage({ type: "error", text: "Pick a follow-up date or untick follow-up." });
    if (unchecked > 0) {
      return setMessage({ type: "error", text: "Confirm the allergy check for every prescribed medication." });
    }
    if (!confirm("Complete this consultation? The record will be locked and an invoice will be created.")) return;

    startTransition(async () => {
      const result = await completeConsultation(buildInput());
      if (!result.ok) return setMessage({ type: "error", text: result.error });
      router.refresh();
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <Link href="/doctor/consultations" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" /> Back to Queue
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <AvatarWithName
          name={appt.patientName}
          subtitle={`${appt.visitType} • ${formatDay(appt.dateTime.slice(0, 10))} ${formatClockTime(appt.dateTime)} • Ticket #${appt.ticketNumber}`}
          size="lg"
        />
        <div className="flex items-center gap-3">
          <Link
            href={`/doctor/patients/${appt.patientId}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-primary)] bg-white border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50"
          >
            <User className="w-3.5 h-3.5" /> Patient History
          </Link>
          <StatusPill status={appt.status} />
        </div>
      </div>

      {appt.notes && (
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">Reason for visit: </span>
          {appt.notes}
        </div>
      )}

      {isLocked && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800">
          <Lock className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Consultation completed and locked</p>
            <p className="text-xs text-emerald-700">This record is final and can no longer be edited.</p>
          </div>
          {workspace.invoiceId && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-emerald-200">
              <Receipt className="w-3.5 h-3.5" /> Invoice {workspace.invoiceId.slice(0, 8).toUpperCase()}
            </span>
          )}
        </div>
      )}

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-900">Clinical Entry</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="symptoms">Symptoms</Label>
            <Textarea id="symptoms" rows={3} placeholder="Describe the patient's reported symptoms..." value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)} disabled={isLocked} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnosis</Label>
            <Textarea id="diagnosis" rows={3} placeholder="Clinical diagnosis / assessment..." value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)} disabled={isLocked} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={4} placeholder="Additional notes, advice given, observations..." value={notes}
              onChange={(e) => setNotes(e.target.value)} disabled={isLocked} />
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <input
                id="followUp"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] disabled:opacity-50"
                checked={followUpRequired}
                onChange={(e) => setFollowUpRequired(e.target.checked)}
                disabled={isLocked}
              />
              <Label htmlFor="followUp">Follow-up required</Label>
            </div>
            {followUpRequired && (
              <div className="space-y-2 w-44">
                <Label htmlFor="followUpDate">Follow-up date</Label>
                <Input
                  id="followUpDate"
                  type="date"
                  value={followUpDate}
                  min={appt.dateTime.slice(0, 10)}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  disabled={isLocked}
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
          {!isLocked && (
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input placeholder="Search treatment catalogue..." className="pl-9" value={catalogueSearch}
                onChange={(e) => setCatalogueSearch(e.target.value)} />
            </div>
          )}

          {!isLocked && catalogueSearch && (
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-56 overflow-y-auto custom-scrollbar">
              {filteredCatalogue.length === 0 && <p className="p-4 text-sm text-slate-500">No matching treatments found.</p>}
              {filteredCatalogue.map((item) => (
                <div key={item.catalogueId} className="flex items-center justify-between p-3 hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{item.category}</Badge>
                      <span className="text-xs text-slate-500">{formatMoney(item.unitPrice)}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-lg h-8"
                    onClick={() => { addTreatment(item); setCatalogueSearch(""); }}>
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Attached ({ordered.length + started.length})
            </p>
            {ordered.length + started.length === 0 ? (
              <p className="text-sm text-slate-500">No treatments or procedures attached yet.</p>
            ) : (
              <div className="space-y-2">
                {ordered.map((t) => (
                  <div key={t.treatmentServiceCode} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{t.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{t.category}</Badge>
                        <span className="text-xs text-slate-500">{formatMoney(t.unitPrice)} each</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {isLocked ? (
                        <span className="text-sm font-semibold text-slate-500">Qty {t.quantity}</span>
                      ) : (
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg">
                          <button className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30" disabled={t.quantity <= 1}
                            onClick={() => setOrdered((l) => l.map((x) => (x === t ? { ...x, quantity: x.quantity - 1 } : x)))}>
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-sm font-semibold w-6 text-center">{t.quantity}</span>
                          <button className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30" disabled={t.quantity >= 100}
                            onClick={() => setOrdered((l) => l.map((x) => (x === t ? { ...x, quantity: x.quantity + 1 } : x)))}>
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <span className="text-sm font-bold text-slate-900 w-24 text-right">{formatMoney(t.unitPrice * t.quantity)}</span>
                      {!isLocked && (
                        <button className="p-1.5 text-slate-400 hover:text-red-600"
                          onClick={() => setOrdered((l) => l.filter((x) => x !== t))}>
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {started.map((t) => (
                  <div key={t.appointmentTreatmentId} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{t.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{t.category}</Badge>
                        <StatusPill status={t.status} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold text-slate-500">Qty {t.quantity}</span>
                      <span className="text-sm font-bold text-slate-900 w-24 text-right">{formatMoney(t.total)}</span>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end pt-2">
                  <p className="text-sm font-bold text-slate-900">Treatments total: {formatMoney(treatmentsTotal)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-900">Medications &amp; Prescriptions</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {!isLocked && (
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input placeholder="Search medications by generic or brand name..." className="pl-9" value={medicationSearch}
                onChange={(e) => setMedicationSearch(e.target.value)} />
            </div>
          )}

          {!isLocked && medicationSearch && (
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-56 overflow-y-auto custom-scrollbar">
              {filteredMedications.length === 0 && <p className="p-4 text-sm text-slate-500">No matching medications found.</p>}
              {filteredMedications.map((med) => (
                <div key={med.medicationId} className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {med.genericName}
                      {med.brandName && <span className="text-slate-400 font-normal"> ({med.brandName})</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {(med.strength || med.form) && <Badge variant="outline">{[med.strength, med.form].filter(Boolean).join(" • ")}</Badge>}
                      {med.category && <span className="text-xs text-slate-500">{med.category}</span>}
                      {med.contraindications && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Has contraindications
                        </span>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-lg h-8 shrink-0"
                    onClick={() => { addMedication(med); setMedicationSearch(""); }}>
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Prescribed ({prescriptions.length})</p>
            {prescriptions.length === 0 ? (
              <p className="text-sm text-slate-500">No medications prescribed yet.</p>
            ) : (
              <div className="space-y-3">
                {prescriptions.map((p) => (
                  <div key={p.key} className={cn("p-4 rounded-xl border space-y-3",
                    p.allergyChecked ? "border-slate-100 bg-slate-50/50" : "border-amber-200 bg-amber-50/40")}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Pill className="w-4 h-4 text-[var(--brand-primary)] shrink-0" />
                        <p className="text-sm font-semibold text-slate-900 truncate">{p.medicationName}</p>
                      </div>
                      {!isLocked && (
                        <button className="p-1.5 text-slate-400 hover:text-red-600 shrink-0"
                          onClick={() => setPrescriptions((l) => l.filter((x) => x.key !== p.key))}>
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {p.contraindications && (
                      <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-100/60 border border-amber-200 rounded-lg px-3 py-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
                        <span><strong>Contraindications:</strong> {p.contraindications}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Dosage</Label>
                        <Input className="h-8 text-sm" value={p.dosage} maxLength={50} disabled={isLocked}
                          onChange={(e) => updatePrescription(p.key, { dosage: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Frequency</Label>
                        <Input className="h-8 text-sm" value={p.frequency} maxLength={50} disabled={isLocked}
                          onChange={(e) => updatePrescription(p.key, { frequency: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Duration (Days)</Label>
                        <Input className="h-8 text-sm" type="number" min={1} max={365} value={p.durationDays || ""} disabled={isLocked}
                          onChange={(e) => updatePrescription(p.key, { durationDays: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <Label className="text-xs text-slate-500">Instructions</Label>
                        <Input className="h-8 text-sm" placeholder="e.g. Take with food" value={p.notes} maxLength={255} disabled={isLocked}
                          onChange={(e) => updatePrescription(p.key, { notes: e.target.value })} />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] disabled:opacity-50"
                        checked={p.allergyChecked}
                        disabled={isLocked}
                        onChange={(e) => updatePrescription(p.key, { allergyChecked: e.target.checked })}
                      />
                      I have checked this medication against the patient&apos;s allergies
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {!isLocked && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white text-sm">
          <span className="text-slate-500">Estimated invoice (consultation {formatMoney(appt.fee)} + treatments)</span>
          <span className="font-bold text-slate-900">{formatMoney(estimatedTotal)}</span>
        </div>
      )}

      {message && (
        <p className={cn("flex items-center gap-2 text-sm rounded-lg px-3 py-2 border",
          message.type === "error" ? "text-red-600 bg-red-50 border-red-100" : "text-emerald-700 bg-emerald-50 border-emerald-100")}>
          {message.type === "error" ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {message.text}
        </p>
      )}

      {isLocked ? (
        <div className="flex justify-end">
          <Button variant="outline" className="rounded-xl" onClick={() => router.push("/doctor/consultations")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Queue
          </Button>
        </div>
      ) : (
        <div className="flex justify-end gap-3">
          <Button variant="outline" className="rounded-xl" onClick={() => router.push("/doctor/consultations")} disabled={pending}>
            Close
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={handleSave}
            disabled={pending || (!symptoms && !diagnosis && !notes)}>
            <Save className="w-4 h-4 mr-2" /> {pending ? "Saving..." : "Save Draft"}
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6" onClick={handleComplete}
            disabled={pending || !diagnosis.trim()}
            title={!diagnosis.trim() ? "A diagnosis is required to complete the consultation" : undefined}>
            <CheckCircle2 className="w-4 h-4 mr-2" /> Complete Consultation
          </Button>
        </div>
      )}
    </div>
  );
}
