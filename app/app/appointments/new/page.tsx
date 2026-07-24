"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppointmentStore } from "@/lib/stores/appointmentStore";
import { useCurrentUser } from "@/lib/stores/authStore";
import { doctors } from "@/lib/mockData/doctors";
import { patients } from "@/lib/mockData/patients";
import { branches } from "@/lib/mockData/branches";
import { Appointment, VisitType } from "@/lib/mockData/appointments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarPlus, ArrowLeft, CheckCircle2, User, Stethoscope, Calendar, Clock, FileText } from "lucide-react";
import Link from "next/link";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";

const VISIT_TYPES: VisitType[] = ["General Checkup", "Follow-up", "Consultation", "New Patient", "Routine Check", "Emergency", "Walk-in", "Video Consultation", "Pre-Visit"];
const DURATIONS = [15, 30, 45, 60, 90];

export default function NewAppointmentPage() {
  const router = useRouter();
  const { addAppointment } = useAppointmentStore();
  const user = useCurrentUser();

  const [form, setForm] = useState({
    patientId: "",
    doctorId: "",
    branchId: "BR-001",
    dateTime: "",
    duration: 30,
    visitType: "General Checkup" as VisitType,
    notes: "",
    paymentStatus: "Unpaid" as const,
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const selectedDoctor = doctors.find(d => d.doctorId === form.doctorId);
  const selectedPatient = patients.find(p => p.patientId === form.patientId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.doctorId || !form.dateTime) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    const newAppt: Appointment = {
      appointmentId: `APT-${Date.now()}`,
      patientId: form.patientId,
      patientName: selectedPatient!.name,
      doctorId: form.doctorId,
      doctorName: selectedDoctor!.name,
      doctorSpecialization: selectedDoctor!.specialization,
      branchId: form.branchId,
      branchName: branches.find(b => b.branchId === form.branchId)?.name || "Healthora Central",
      dateTime: form.dateTime,
      duration: form.duration,
      visitType: form.visitType,
      status: "Confirmed",
      paymentStatus: form.paymentStatus,
      source: "Booked",
      notes: form.notes,
    };
    addAppointment(newAppt);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 animate-fade-in">
        <div
          className="w-20 h-20 bg-green-100 flex items-center justify-center mx-auto mb-6"
          style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
        >
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Appointment Booked!</h2>
        <p className="text-slate-500 mb-2">
          <strong>{selectedPatient?.name}</strong> is scheduled with <strong>{selectedDoctor?.name}</strong>
        </p>
        <p className="text-slate-500 mb-8">{new Date(form.dateTime).toLocaleString()}</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => { setSubmitted(false); setForm({ patientId: "", doctorId: "", branchId: "BR-001", dateTime: "", duration: 30, visitType: "General Checkup", notes: "", paymentStatus: "Unpaid" }); }}
            variant="outline" className="rounded-xl px-6 h-11">Book Another</Button>
          <Link href="/app/appointments">
            <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl px-6 h-11">View All Appointments</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/app/appointments">
          <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Book New Appointment</h2>
          <p className="text-slate-500 text-sm">Fill in the details below to schedule a visit.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold"
                style={{ clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" }}>1</div>
              Select Patient
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <select
              value={form.patientId}
              onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none"
              required
            >
              <option value="">— Choose a patient —</option>
              {patients.map(p => (
                <option key={p.patientId} value={p.patientId}>{p.name} ({p.patientId})</option>
              ))}
            </select>
            {selectedPatient && (
              <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <div className={cn("w-12 h-12 flex items-center justify-center text-sm font-bold shrink-0", getAvatarColor(selectedPatient.name))}
                  style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                  {getInitials(selectedPatient.name)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{selectedPatient.name}</p>
                  <p className="text-sm text-slate-500">{selectedPatient.age} yrs • {selectedPatient.gender} • Blood: {selectedPatient.bloodGroup}</p>
                  <p className="text-sm text-slate-500">{selectedPatient.phone}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Doctor Selection */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-7 h-7 bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold"
                style={{ clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" }}>2</div>
              Select Doctor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <select
              value={form.doctorId}
              onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none"
              required
            >
              <option value="">— Choose a doctor —</option>
              {doctors.map(d => (
                <option key={d.doctorId} value={d.doctorId}>{d.name} — {d.specialization}</option>
              ))}
            </select>
            {selectedDoctor && (
              <div className="flex items-center gap-4 p-4 bg-purple-50 border border-purple-100 rounded-xl">
                <div className="w-12 h-12 bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" }}>
                  {selectedDoctor.name.replace("Dr. ", "").split(" ").map((n: string) => n[0]).join("")}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{selectedDoctor.name}</p>
                  <p className="text-sm text-[var(--brand-primary)] font-medium">{selectedDoctor.specialization}</p>
                  <p className="text-sm text-slate-500">Consultation Fee: ${selectedDoctor.consultationFee}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Date, Time & Details */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-7 h-7 bg-teal-100 text-teal-600 flex items-center justify-center text-sm font-bold"
                style={{ clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" }}>3</div>
              Schedule & Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Date & Time *</label>
                <input type="datetime-local" value={form.dateTime} onChange={e => setForm(f => ({ ...f, dateTime: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Duration</label>
                <select value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] outline-none">
                  {DURATIONS.map(d => <option key={d} value={d}>{d} minutes</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Visit Type</label>
                <select value={form.visitType} onChange={e => setForm(f => ({ ...f, visitType: e.target.value as VisitType }))}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] outline-none">
                  {VISIT_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Branch</label>
                <select value={form.branchId} onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] outline-none">
                  {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Notes (Optional)</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Chief complaint, patient-reported symptoms..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none resize-none" />
              </div>
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl h-11 px-8 font-semibold">
            <CalendarPlus className="w-4 h-4 mr-2" /> Confirm Appointment
          </Button>
          <Link href="/app/appointments">
            <Button type="button" variant="outline" className="rounded-xl h-11 px-6 text-slate-600">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
