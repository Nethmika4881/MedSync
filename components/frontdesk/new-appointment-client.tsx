"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { toast, Toaster } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Search, ChevronDown, Check, Clock, Ticket, Loader2, AlertCircle, UserCheck, Zap } from "lucide-react";
import Link from "next/link";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";

// ALL Imports point to the single file we just created!
import {
  getBranchPatients,
  getDoctorDirectory,
  getDoctorBookableSlots,
  bookAppointment,
  checkInPatientAppointment,
  type FrontDeskPatientSummary,
  type DoctorDirectoryItem,
  type BookableSlot
} from "@/lib/actions/frontdesk-appointments";

const VISIT_TYPES = ["General Checkup", "Follow-up", "Consultation", "New Patient", "Emergency", "Walk-in"] as const;

// ─── Patient Selector Subcomponent ───
function PatientSelector({ patients, selectedId, onSelect }: any) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => patients.filter((p: any) =>
    p.fullName.toLowerCase().includes(search.toLowerCase()) || (p.phone && p.phone.includes(search))
  ), [patients, search]);

  const selected = patients.find((p: any) => p.patientId === selectedId);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full min-h-[3rem] px-4 py-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
      >
        {selected ? (
          <div className="flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white", getAvatarColor(selected.fullName))}>
              {getInitials(selected.fullName)}
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900 text-sm">{selected.fullName}</p>
              <p className="text-xs text-slate-500 font-mono">Phone: {selected.phone || "N/A"}</p>
            </div>
          </div>
        ) : (
          <span className="text-slate-500 text-sm">Select a registered patient...</span>
        )}
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border focus:outline-none"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-1.5">
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No patients found</p>
            ) : (
              filtered.map((p: any) => (
                <button
                  key={p.patientId}
                  type="button"
                  onClick={() => { onSelect(p.patientId); setOpen(false); setSearch(""); }}
                  className={cn("w-full flex items-center justify-between p-2.5 rounded-lg text-left", selectedId === p.patientId ? "bg-teal-50" : "hover:bg-slate-50")}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white", getAvatarColor(p.fullName))}>
                      {getInitials(p.fullName)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{p.fullName}</p>
                      <p className="text-xs text-slate-500 font-mono">{p.phone || "No phone"}</p>
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

// ─── Doctor Selector Subcomponent ───
function DoctorSelector({ doctors, selectedId, onSelect }: any) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => doctors.filter((d: any) =>
    d.name.toLowerCase().includes(search.toLowerCase()) || d.specialization.toLowerCase().includes(search.toLowerCase())
  ), [doctors, search]);

  const selected = doctors.find((d: any) => d.doctorId === selectedId);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)} className="w-full min-h-[3rem] px-4 py-2.5 rounded-xl border bg-white flex items-center justify-between">
        {selected ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {getInitials(selected.name)}
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900 text-sm leading-tight">{selected.name}</p>
              <p className="text-xs text-[var(--brand-primary)] font-medium">{selected.specialization} • Fee: Rs. {Number(selected.consultationFee).toLocaleString()}</p>
            </div>
          </div>
        ) : (
          <span className="text-slate-500 text-sm">Select an available doctor...</span>
        )}
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search by name or specialization..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border focus:outline-none" autoFocus />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-1.5">
            {filtered.map((d: any) => (
              <button key={d.doctorId} type="button" onClick={() => { onSelect(d.doctorId); setOpen(false); setSearch(""); }} className={cn("w-full flex items-center justify-between p-2.5 rounded-lg text-left", selectedId === d.doctorId ? "bg-teal-50" : "hover:bg-slate-50")}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center text-white text-xs font-bold">
                    {getInitials(d.name)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{d.name}</p>
                    <p className="text-xs text-slate-500">{d.specialization} • Rs. {Number(d.consultationFee).toLocaleString()}</p>
                  </div>
                </div>
                {selectedId === d.doctorId && <Check className="w-4 h-4 text-[var(--brand-primary)]" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Booking Page ───
export default function NewAppointmentClient({ user }: { user: any }) {
  const [patients, setPatients] = useState<FrontDeskPatientSummary[]>([]);
  const [doctors, setDoctors] = useState<DoctorDirectoryItem[]>([]);
  const [availableSlots, setAvailableSlots] = useState<BookableSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState<number | null>(null);
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ patientId: "", doctorId: "", timeSlotId: "", visitType: "General Checkup", notes: "" });

  useEffect(() => {
    async function loadData() {
      const [patientList, doctorList] = await Promise.all([getBranchPatients(user?.branchId), getDoctorDirectory()]);
      setPatients(patientList);
      setDoctors(doctorList);
    }
    loadData();
  }, [user]);

  useEffect(() => {
    if (!form.doctorId) return setAvailableSlots([]);
    setIsLoadingSlots(true);
    getDoctorBookableSlots(form.doctorId).then((slots) => {
      setAvailableSlots(slots);
      setForm((f) => ({ ...f, timeSlotId: slots.length > 0 ? slots[0].timeSlotId : "" }));
      setIsLoadingSlots(false);
    });
  }, [form.doctorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.doctorId || !form.timeSlotId) return toast.error("Please select all required fields.");
    setIsSubmitting(true); setError("");

    const res = await bookAppointment({
      time_slot_id: form.timeSlotId,
      patient_id: form.patientId,
      created_by: user.userId,
      source: isWalkIn ? "Walkin" : "Booked",
      reason_for_visit: `${form.visitType}${form.notes ? `: ${form.notes}` : ""}`,
    });

    if (res.success && res.data) {
      if (isWalkIn) {
        await checkInPatientAppointment(res.data.appointmentId);
        toast.success("Walk-in booked and patient checked in!");
      } else {
        toast.success("Appointment scheduled!");
      }
      setGeneratedTicket(res.data.queueNumber);
      setSubmitted(true);
    } else {
      setError(res.error || "Failed to book appointment.");
    }
    setIsSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 animate-fade-in">
        <Toaster richColors position="top-right" />
        <div className={cn("w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-md rounded-2xl", isWalkIn ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600")}>
          {isWalkIn ? <UserCheck className="w-10 h-10" /> : <CheckCircle2 className="w-10 h-10" />}
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {isWalkIn ? "Walk-In Checked In!" : "Appointment Scheduled!"}
        </h2>
        <div className="w-full max-w-sm mx-auto bg-slate-50 rounded-2xl p-5 border relative shadow-sm text-left mt-6">
          <div className={cn("absolute top-0 right-0 text-white px-3.5 py-1 rounded-bl-xl font-mono text-sm", isWalkIn ? "bg-amber-600" : "bg-emerald-600")}>
            Token #{generatedTicket}
          </div>
          <p className="text-slate-600 mt-2">Patient: <span className="font-semibold text-slate-900">{patients.find((p) => p.patientId === form.patientId)?.fullName}</span></p>
          <p className="text-slate-600 mt-2">Doctor: <span className="font-semibold text-slate-900">{doctors.find((d) => d.doctorId === form.doctorId)?.name}</span></p>
        </div>
        <div className="flex gap-3 justify-center mt-6">
          <Button onClick={() => { setSubmitted(false); setIsWalkIn(false); setForm({ ...form, patientId: "", doctorId: "", timeSlotId: "" }); }} variant="outline">Book Another</Button>
          <Link href="/front-desk/appointments"><Button className="bg-[var(--brand-primary)] text-white">View Appointments</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-12">
      <Toaster richColors position="top-right" />
      <div className="flex items-center gap-3 mb-6">
        <Link href="/front-desk/appointments">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Schedule Appointment</h2>
          <p className="text-slate-500 text-sm">Select a patient, a doctor, and choose an available session slot.</p>
        </div>
      </div>

      <div className={cn("mb-6 p-4 rounded-2xl border flex items-center justify-between", isWalkIn ? "bg-amber-50/90 border-amber-300" : "bg-white border-slate-200")}>
        <div className="flex items-center gap-3.5">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isWalkIn ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500")}>
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Walk-In Patient Mode</h3>
            <p className="text-xs text-slate-500">{isWalkIn ? "Auto Check-In Enabled." : "Advance scheduling."}</p>
          </div>
        </div>
        <button type="button" role="switch" aria-checked={isWalkIn} onClick={() => { setIsWalkIn(!isWalkIn); setForm(f => ({ ...f, visitType: !isWalkIn ? "Walk-in" : "General Checkup" })) }} className={cn("relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200", isWalkIn ? "bg-amber-600" : "bg-slate-200")}>
          <span className={cn("pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white transition duration-200", isWalkIn ? "translate-x-5" : "translate-x-0")} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <Card><CardHeader className="pb-3 border-b"><CardTitle className="text-base font-semibold">1. Patient Details</CardTitle></CardHeader>
            <CardContent className="pt-4">
              <PatientSelector patients={patients} selectedId={form.patientId} onSelect={(id: string) => setForm(f => ({ ...f, patientId: id }))} />
            </CardContent>
          </Card>

          <Card><CardHeader className="pb-3 border-b"><CardTitle className="text-base font-semibold">2. Assigned Specialist</CardTitle></CardHeader>
            <CardContent className="pt-4 space-y-4">
              <DoctorSelector doctors={doctors} selectedId={form.doctorId} onSelect={(id: string) => setForm(f => ({ ...f, doctorId: id }))} />
              {form.doctorId && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Available Doctor Slots *</label>
                  {isLoadingSlots ? <Loader2 className="w-4 h-4 animate-spin text-[var(--brand-primary)]" /> : 
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto">
                      {availableSlots.map((slot) => (
                        <button key={slot.timeSlotId} type="button" onClick={() => setForm(f => ({ ...f, timeSlotId: slot.timeSlotId }))} className={cn("p-3 rounded-xl border text-left", form.timeSlotId === slot.timeSlotId ? "border-[var(--brand-primary)] bg-teal-50" : "border-slate-200")}>
                          <div className="font-semibold text-xs">{slot.date}</div>
                          <div className="text-[10px] text-slate-500">{slot.startTime} - {slot.endTime}</div>
                        </button>
                      ))}
                    </div>
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Card><CardHeader className="pb-3 border-b"><CardTitle className="text-base font-semibold">3. Visit Type & Notes</CardTitle></CardHeader>
            <CardContent className="pt-4 space-y-4">
              <select value={form.visitType} onChange={(e) => setForm(f => ({ ...f, visitType: e.target.value }))} className="w-full h-11 px-4 rounded-xl border bg-white text-sm">
                {VISIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <textarea rows={3} value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes..." className="w-full px-4 py-3 rounded-xl border bg-white text-sm resize-none" />
              
              {error && <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl">{error}</p>}
              <Button type="submit" disabled={isSubmitting || !form.timeSlotId} className="w-full h-11 rounded-xl text-white font-semibold">
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : isWalkIn ? "Book & Check-In Immediately" : "Confirm & Issue Token"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}