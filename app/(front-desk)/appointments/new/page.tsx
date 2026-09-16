"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppointmentStore } from "@/lib/stores/appointmentStore";
import { useCurrentUser } from "@/lib/stores/authStore";
import { doctors, Doctor } from "@/lib/mockData/doctors";
import { patients, Patient } from "@/lib/mockData/patients";
import { branches } from "@/lib/mockData/branches";
import { Appointment, VisitType, SessionType } from "@/lib/mockData/appointments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarPlus,
  ArrowLeft,
  CheckCircle2,
  Search,
  ChevronDown,
  Check,
  Star,
} from "lucide-react";
import Link from "next/link";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";

// ─── Constants & Helpers ──────────────────────────────────────────────────────

const VISIT_TYPES: VisitType[] = [
  "General Checkup",
  "Follow-up",
  "Consultation",
  "New Patient",
  "Routine Check",
  "Emergency",
  "Walk-in",
  "Video Consultation",
  "Pre-Visit",
];

const DURATIONS = [15, 30, 45, 60, 90];

const SESSIONS: SessionType[] = ["Morning", "Afternoon", "Evening"];

function getNextDays(count: number) {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function getAvatarGradient(initials: string) {
  const gradients = [
    "from-teal-500 to-emerald-600",
    "from-blue-500 to-indigo-600",
    "from-violet-500 to-purple-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-teal-600",
  ];
  const idx = initials.charCodeAt(0) % gradients.length;
  return gradients[idx];
}

// ─── Custom Selectors ─────────────────────────────────────────────────────────

function PatientSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    return patients.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.patientId.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search)
    );
  }, [search]);

  const selected = patients.find((p) => p.patientId === selectedId);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full min-h-[3rem] px-4 py-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between transition-all hover:border-[var(--brand-primary)] focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none"
      >
        {selected ? (
          <div className="flex items-center gap-3 text-left">
            <div
              className={cn(
                "w-8 h-8 flex items-center justify-center text-xs font-bold shrink-0",
                getAvatarColor(selected.name)
              )}
              style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
            >
              {getInitials(selected.name)}
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm leading-tight">{selected.name}</p>
              <p className="text-xs text-slate-500">{selected.patientId} • {selected.phone}</p>
            </div>
          </div>
        ) : (
          <span className="text-slate-500 text-sm">Select a patient...</span>
        )}
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-100 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, ID, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-[var(--brand-primary)]"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No patients found</p>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.patientId}
                  type="button"
                  onClick={() => {
                    onSelect(p.patientId);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded-lg transition-colors text-left",
                    selectedId === p.patientId ? "bg-teal-50" : "hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 flex items-center justify-center text-xs font-bold shrink-0",
                        getAvatarColor(p.name)
                      )}
                      style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
                    >
                      {getInitials(p.name)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.age} yrs • {p.phone}</p>
                    </div>
                  </div>
                  {selectedId === p.patientId && <Check className="w-4 h-4 text-[var(--brand-primary)]" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DoctorSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    return doctors.filter((d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialization.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const selected = doctors.find((d) => d.doctorId === selectedId);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full min-h-[3rem] px-4 py-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between transition-all hover:border-[var(--brand-primary)] focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none"
      >
        {selected ? (
          <div className="flex items-center gap-3 text-left">
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getAvatarGradient(selected.avatar)} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}
            >
              {selected.avatar.replace(/[0-9]/g, "")}
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm leading-tight">{selected.name}</p>
              <p className="text-xs text-[var(--brand-primary)] font-medium">{selected.specialization}</p>
            </div>
          </div>
        ) : (
          <span className="text-slate-500 text-sm">Select a specialist...</span>
        )}
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-100 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or specialization..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-[var(--brand-primary)]"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No specialists found</p>
            ) : (
              filtered.map((d) => (
                <button
                  key={d.doctorId}
                  type="button"
                  onClick={() => {
                    onSelect(d.doctorId);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded-lg transition-colors text-left",
                    selectedId === d.doctorId ? "bg-teal-50" : "hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getAvatarGradient(d.avatar)} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}
                    >
                      {d.avatar.replace(/[0-9]/g, "")}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{d.name}</p>
                      <p className="text-xs text-[var(--brand-primary)] font-medium">{d.specialization}</p>
                    </div>
                  </div>
                  {selectedId === d.doctorId && <Check className="w-4 h-4 text-[var(--brand-primary)]" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewAppointmentPage() {
  const router = useRouter();
  const { addAppointment } = useAppointmentStore();
  const user = useCurrentUser();

  const availableDays = useMemo(() => getNextDays(7), []);

  const [form, setForm] = useState({
    patientId: "",
    doctorId: "",
    branchId: "BR-001",
    selectedDay: null as Date | null,
    selectedSession: null as SessionType | null,
    duration: 30,
    visitType: "General Checkup" as VisitType,
    notes: "",
    paymentStatus: "Unpaid" as const,
  });

  const [submitted, setSubmitted] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState<number | null>(null);
  const [error, setError] = useState("");

  const selectedDoctor = doctors.find((d) => d.doctorId === form.doctorId);
  const selectedPatient = patients.find((p) => p.patientId === form.patientId);

  const isFullyBooked = (d: Date, doc: Doctor | undefined) =>
    doc?.fullyBookedDate ? d.toISOString().startsWith(doc.fullyBookedDate) : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.doctorId || !form.selectedDay || !form.selectedSession) {
      setError("Please complete all required fields (Patient, Doctor, Date, and Session).");
      return;
    }
    setError("");

    // Calculate ticket number
    const existingForSession = useAppointmentStore.getState().appointments.filter(
      a => a.doctorId === form.doctorId && 
           a.session === form.selectedSession && 
           new Date(a.dateTime).toDateString() === form.selectedDay!.toDateString()
    );
    const nextTicket = existingForSession.length + 1;
    setGeneratedTicket(nextTicket);

    const dt = new Date(form.selectedDay);
    if (form.selectedSession === "Morning") dt.setHours(9, 0, 0, 0);
    else if (form.selectedSession === "Afternoon") dt.setHours(14, 0, 0, 0);
    else dt.setHours(18, 0, 0, 0);

    const newAppt: Appointment = {
      appointmentId: `APT-${Date.now()}`,
      patientId: form.patientId,
      patientName: selectedPatient!.name,
      doctorId: form.doctorId,
      doctorName: selectedDoctor!.name,
      doctorSpecialization: selectedDoctor!.specialization,
      branchId: form.branchId,
      branchName: branches.find((b) => b.branchId === form.branchId)?.name || "MedSync Central",
      dateTime: dt.toISOString(),
      duration: form.duration,
      session: form.selectedSession,
      ticketNumber: nextTicket,
      visitType: form.visitType,
      status: "Confirmed",
      paymentStatus: form.paymentStatus,
      source: "Booked",
      notes: form.notes,
    };

    addAppointment(newAppt);
    setSubmitted(true);
  };

  const dayFmt = (d: Date) =>
    d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 animate-fade-in">
        <div
          className="w-20 h-20 bg-emerald-100 flex items-center justify-center mx-auto mb-6 shadow-sm"
          style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
        >
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Appointment Scheduled!</h2>
        <p className="text-slate-500 mb-2">
          <strong>{selectedPatient?.name}</strong> is scheduled to see <strong>{selectedDoctor?.name}</strong>
        </p>
        <div className="w-full max-w-sm mx-auto bg-slate-50 rounded-2xl p-4 text-sm space-y-2 border border-slate-100 mb-8 mt-4 relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 bg-[var(--brand-primary)] text-white px-3 py-1 rounded-bl-xl font-bold">
            Ticket #{generatedTicket}
          </div>
          <p className="text-slate-500">
            📅 <span className="font-semibold text-slate-800">{form.selectedDay && dayFmt(form.selectedDay)}</span>{" "}
            • <span className="font-semibold text-slate-800">{form.selectedSession} Session</span>
          </p>
          <p className="text-slate-500">
            🏥 <span className="font-semibold text-slate-800">{branches.find((b) => b.branchId === form.branchId)?.name}</span>
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => {
              setSubmitted(false);
              setForm({
                patientId: "",
                doctorId: "",
                branchId: "BR-001",
                selectedDay: null,
                selectedSession: null,
                duration: 30,
                visitType: "General Checkup",
                notes: "",
                paymentStatus: "Unpaid",
              });
            }}
            variant="outline"
            className="rounded-xl px-6 h-11"
          >
            Book Another
          </Button>
          <Link href="/appointments">
            <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl px-6 h-11 shadow-md">
              View All Appointments
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <Link href="/appointments">
          <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 rounded-xl shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Schedule New Appointment</h2>
          <p className="text-slate-500 text-sm mt-0.5">Select a patient, a specialist, and a convenient session.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Main Info) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Patient Selection */}
          <Card className="border-slate-100 shadow-sm overflow-hidden border-t-4 border-t-blue-500">
            <CardHeader className="pb-4 bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-xs">1</div>
                Patient Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <PatientSelector
                selectedId={form.patientId}
                onSelect={(id) => setForm((f) => ({ ...f, patientId: id }))}
              />
            </CardContent>
          </Card>

          {/* Doctor Selection */}
          <Card className="border-slate-100 shadow-sm overflow-hidden border-t-4 border-t-[var(--brand-primary)]">
            <CardHeader className="pb-4 bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-teal-100 text-teal-700 flex items-center justify-center text-xs">2</div>
                Specialist & Location
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Specialist *</label>
                <DoctorSelector
                  selectedId={form.doctorId}
                  onSelect={(id) => {
                    setForm((f) => ({
                      ...f,
                      doctorId: id,
                      // reset session if doctor changes as availability might differ
                      selectedDay: null,
                      selectedSession: null,
                    }));
                  }}
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Branch</label>
                <select
                  value={form.branchId}
                  onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none transition-all cursor-pointer"
                >
                  {branches.map((b) => (
                    <option key={b.branchId} value={b.branchId}>
                      {b.name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Visit Type</label>
                  <select
                    value={form.visitType}
                    onChange={(e) => setForm((f) => ({ ...f, visitType: e.target.value as VisitType }))}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] outline-none cursor-pointer"
                  >
                    {VISIT_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Duration</label>
                  <select
                    value={form.duration}
                    onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] outline-none cursor-pointer"
                  >
                    {DURATIONS.map((d) => <option key={d} value={d}>{d} mins</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Additional Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Reason for visit or special instructions..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none resize-none transition-all"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Date & Time Picker) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-slate-100 shadow-sm overflow-hidden border-t-4 border-t-amber-400 sticky top-6">
            <CardHeader className="pb-4 bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center text-xs">3</div>
                Date & Session
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {!form.doctorId ? (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarPlus className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="font-semibold text-slate-700 text-sm">Select a specialist first</p>
                  <p className="text-xs text-slate-500 mt-1">Their availability will appear here.</p>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  {/* Day Picker */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Select Day</p>
                      <p className="text-[10px] font-semibold text-[var(--brand-primary)] uppercase bg-teal-50 px-2 py-0.5 rounded-full">
                        {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {availableDays.map((day) => {
                        const booked = isFullyBooked(day, selectedDoctor);
                        const selected = form.selectedDay?.toDateString() === day.toDateString();
                        return (
                          <button
                            key={day.toISOString()}
                            type="button"
                            disabled={booked}
                            onClick={() => setForm((f) => ({ ...f, selectedDay: day, selectedSession: null }))}
                            className={cn(
                              "flex flex-col items-center py-2.5 px-1 rounded-xl border text-xs font-semibold transition-all",
                              booked
                                ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed opacity-60"
                                : selected
                                ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white shadow-md shadow-teal-500/20"
                                : "border-slate-200 bg-white text-slate-700 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                            )}
                          >
                            <span className="text-[10px] uppercase opacity-80 mb-0.5">
                              {day.toLocaleDateString("en-US", { weekday: "short" })}
                            </span>
                            <span className="text-base font-bold leading-none mb-0.5">{day.getDate()}</span>
                            {booked && <span className="text-[9px] text-rose-500 font-bold">Full</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Session Picker */}
                  <div className={cn("transition-opacity duration-300", form.selectedDay ? "opacity-100" : "opacity-30 pointer-events-none")}>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Available Sessions</p>
                    <div className="grid grid-cols-3 gap-2">
                      {SESSIONS.map((session) => {
                        const selected = form.selectedSession === session;
                        return (
                          <button
                            key={session}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, selectedSession: session }))}
                            className={cn(
                              "py-2.5 rounded-xl border text-xs font-bold transition-all",
                              selected
                                ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white shadow-md shadow-teal-500/20"
                                : "border-slate-200 bg-white text-slate-600 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                            )}
                          >
                            {session}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Action */}
          <div className="sticky top-[calc(100vh-8rem)]">
            {error && (
              <p className="text-red-600 text-xs font-semibold bg-red-50 border border-red-200 px-4 py-3 rounded-xl mb-4 animate-in slide-in-from-bottom-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={!form.patientId || !form.doctorId || !form.selectedDay || !form.selectedSession}
              className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl h-14 text-base font-bold shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:shadow-none transition-all hover:-translate-y-0.5"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" /> 
              Confirm Booking
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
