"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { toast, Toaster } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  Search,
  ChevronDown,
  Check,
  Clock,
  Ticket,
  Loader2,
  AlertCircle,
  UserCheck,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";
import { getBranchPatients, type FrontDeskPatientSummary } from "@/lib/actions/frontdesk-patients";
import { getDoctorDirectory, type DoctorDirectoryItem } from "@/lib/actions/doctors";
import { getDoctorBookableSlots, type BookableSlot } from "@/lib/actions/patient-booking";
import { bookAppointment } from "@/lib/actions/appointments";
import { checkInPatientAppointment } from "@/lib/actions/frontdesk-appointments";

const VISIT_TYPES = [
  "General Checkup",
  "Follow-up",
  "Consultation",
  "New Patient",
  "Routine Check",
  "Emergency",
  "Walk-in",
] as const;

// ─── Patient Selector ─────────────────────────────────────────────────────────
function PatientSelector({
  patients,
  selectedId,
  onSelect,
}: {
  patients: FrontDeskPatientSummary[];
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
    return patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(search.toLowerCase()) ||
        p.nic.toLowerCase().includes(search.toLowerCase()) ||
        (p.phone && p.phone.includes(search))
    );
  }, [patients, search]);

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
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white shadow-sm",
                getAvatarColor(selected.fullName)
              )}
            >
              {getInitials(selected.fullName)}
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm leading-tight">{selected.fullName}</p>
              <p className="text-xs text-slate-500 font-mono">NIC: {selected.nic} • {selected.phone}</p>
            </div>
          </div>
        ) : (
          <span className="text-slate-500 text-sm">Select a registered patient...</span>
        )}
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, NIC, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-[var(--brand-primary)]"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-1.5 divide-y divide-slate-50">
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
                    "w-full flex items-center justify-between p-2.5 rounded-lg transition-colors text-left",
                    selectedId === p.patientId ? "bg-teal-50" : "hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white",
                        getAvatarColor(p.fullName)
                      )}
                    >
                      {getInitials(p.fullName)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{p.fullName}</p>
                      <p className="text-xs text-slate-500 font-mono">NIC: {p.nic} • {p.phone || "No phone"}</p>
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

// ─── Doctor Selector ─────────────────────────────────────────────────────────
function DoctorSelector({
  doctors,
  selectedId,
  onSelect,
}: {
  doctors: DoctorDirectoryItem[];
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
    return doctors.filter(
      (d) =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.specialization.toLowerCase().includes(search.toLowerCase())
    );
  }, [doctors, search]);

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
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
              {getInitials(selected.name)}
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm leading-tight">{selected.name}</p>
              <p className="text-xs text-[var(--brand-primary)] font-medium">
                {selected.specialization} • Fee: Rs. {Number(selected.consultationFee).toLocaleString()}
              </p>
            </div>
          </div>
        ) : (
          <span className="text-slate-500 text-sm">Select an available doctor...</span>
        )}
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
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
          <div className="max-h-60 overflow-y-auto p-1.5 divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No doctors found</p>
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
                    "w-full flex items-center justify-between p-2.5 rounded-lg transition-colors text-left",
                    selectedId === d.doctorId ? "bg-teal-50" : "hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {getInitials(d.name)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{d.name}</p>
                      <p className="text-xs text-slate-500">
                        {d.specialization} • Rs. {Number(d.consultationFee).toLocaleString()}
                      </p>
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

// ─── Main Booking Page Component ─────────────────────────────────────────────
export default function NewAppointmentPage({ user }: { user: any }) {
  const [patients, setPatients] = useState<FrontDeskPatientSummary[]>([]);
  const [doctors, setDoctors] = useState<DoctorDirectoryItem[]>([]);
  const [availableSlots, setAvailableSlots] = useState<BookableSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState<number | null>(null);
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    patientId: "",
    doctorId: "",
    timeSlotId: "",
    visitType: "General Checkup",
    notes: "",
  });

  // Load initial patients and doctor directory
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [patientList, doctorList] = await Promise.all([
          getBranchPatients(user?.branchId),
          getDoctorDirectory(),
        ]);
        setPatients(patientList);
        setDoctors(doctorList);
      } catch (err) {
        console.error("Failed to load initial booking data:", err);
      }
    }
    loadInitialData();
  }, [user]);

  // Load live slots when a doctor is selected
  useEffect(() => {
    if (!form.doctorId) {
      setAvailableSlots([]);
      setForm((f) => ({ ...f, timeSlotId: "" }));
      return;
    }

    async function loadSlots() {
      setIsLoadingSlots(true);
      try {
        const slots = await getDoctorBookableSlots(form.doctorId);
        setAvailableSlots(slots);
        if (slots.length > 0) {
          setForm((f) => ({ ...f, timeSlotId: slots[0].timeSlotId }));
        } else {
          setForm((f) => ({ ...f, timeSlotId: "" }));
        }
      } catch (err) {
        console.error("Failed to load doctor slots:", err);
      } finally {
        setIsLoadingSlots(false);
      }
    }
    loadSlots();
  }, [form.doctorId]);

  const selectedPatient = patients.find((p) => p.patientId === form.patientId);
  const selectedDoctor = doctors.find((d) => d.doctorId === form.doctorId);
  const selectedSlot = availableSlots.find((s) => s.timeSlotId === form.timeSlotId);

  const handleToggleWalkIn = () => {
    const nextState = !isWalkIn;
    setIsWalkIn(nextState);
    if (nextState) {
      setForm((f) => ({ ...f, visitType: "Walk-in" }));
    } else {
      setForm((f) => ({ ...f, visitType: "General Checkup" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId) {
      toast.error("Please select a patient.");
      return;
    }
    if (!form.doctorId) {
      toast.error("Please select a doctor.");
      return;
    }
    if (!form.timeSlotId) {
      toast.error("Please select an available session time slot.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await bookAppointment({
        time_slot_id: form.timeSlotId,
        patient_id: form.patientId,
        created_by: user.userId,
        source: isWalkIn ? "Walkin" : "Booked",
        reason_for_visit: `${form.visitType}${form.notes ? `: ${form.notes}` : ""}`,
      });

      if (res.success && res.data) {
        // If Walk-In mode is enabled, immediately check the patient in
        if (isWalkIn) {
          try {
            await checkInPatientAppointment(res.data.appointmentId);
            toast.success("Walk-in booked and patient checked in immediately!");
          } catch (ciErr) {
            console.error("Immediate check-in error:", ciErr);
            toast.success("Appointment booked! (Please confirm check-in manually)");
          }
        } else {
          toast.success(res.message || "Appointment booked successfully!");
        }

        setGeneratedTicket(res.data.queueNumber);
        setSubmitted(true);
      } else {
        const errMsg = res.error || "Failed to book appointment.";
        setError(errMsg);
        toast.error(errMsg);
      }
    } catch (err: any) {
      const errMsg = err?.message || "An unexpected booking error occurred.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 animate-fade-in">
        <Toaster richColors position="top-right" />
        <div
          className={cn(
            "w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-md",
            isWalkIn ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
          )}
          style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
        >
          {isWalkIn ? <UserCheck className="w-10 h-10" /> : <CheckCircle2 className="w-10 h-10" />}
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2 font-outfit">
          {isWalkIn ? "Walk-In Registered & Checked In!" : "Appointment Scheduled!"}
        </h2>
        <p className="text-slate-500 mb-4 text-sm">
          <strong>{selectedPatient?.fullName}</strong> has been successfully booked for{" "}
          <strong>{selectedDoctor?.name}</strong>.
        </p>

        {isWalkIn && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-4 border border-amber-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
            Status: Checked-In (Patient in Live Waiting Queue)
          </div>
        )}

        <div className="w-full max-w-sm mx-auto bg-slate-50 rounded-2xl p-5 text-sm space-y-2 border border-slate-200 mb-8 relative overflow-hidden text-left shadow-sm">
          <div
            className={cn(
              "absolute top-0 right-0 text-white px-3.5 py-1 rounded-bl-xl font-mono font-bold text-sm",
              isWalkIn ? "bg-amber-600" : "bg-emerald-600"
            )}
          >
            Token #{generatedTicket}
          </div>
          <p className="text-slate-600">
            📅 <span className="font-semibold text-slate-900">{selectedSlot?.date}</span>
          </p>
          <p className="text-slate-600">
            ⏰ <span className="font-semibold text-slate-900">{selectedSlot?.startTime} - {selectedSlot?.endTime}</span>
          </p>
          <p className="text-slate-600">
            👨‍⚕️ <span className="font-semibold text-slate-900">{selectedDoctor?.name}</span> ({selectedDoctor?.specialization})
          </p>
          {isWalkIn && (
            <p className="text-slate-600">
              🏷️ <span className="font-semibold text-amber-800">Walk-In Patient • Verified Present</span>
            </p>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => {
              setSubmitted(false);
              setGeneratedTicket(null);
              setIsWalkIn(false);
              setForm({
                patientId: "",
                doctorId: "",
                timeSlotId: "",
                visitType: "General Checkup",
                notes: "",
              });
            }}
            variant="outline"
            className="rounded-xl px-6 h-11 border-slate-200"
          >
            Book Another
          </Button>
          <Link href="/front-desk/appointments">
            <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl px-6 h-11 shadow-sm font-semibold">
              View Appointments
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-12">
      <Toaster richColors position="top-right" />

      <div className="flex items-center gap-3 mb-6">
        <Link href="/front-desk/appointments">
          <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-outfit">
            Schedule Appointment
          </h2>
          <p className="text-slate-500 text-sm">
            Select a patient, a doctor, and choose an available session slot.
          </p>
        </div>
      </div>

      {/* Walk-in Mode Toggle Banner */}
      <div
        className={cn(
          "mb-6 p-4 rounded-2xl border transition-all flex items-center justify-between shadow-sm",
          isWalkIn ? "bg-amber-50/90 border-amber-300" : "bg-white border-slate-200"
        )}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors",
              isWalkIn ? "bg-amber-500 text-white shadow-sm" : "bg-slate-100 text-slate-500"
            )}
          >
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Walk-In Patient Mode</h3>
              {isWalkIn && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  Instant Check-In Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {isWalkIn
                ? "Patient is physically at the desk. System will automatically check in and enter doctor's live queue."
                : "Advance appointment scheduling. Status will remain scheduled until receptionist checks in the patient."}
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isWalkIn}
          onClick={handleToggleWalkIn}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2",
            isWalkIn ? "bg-amber-600" : "bg-slate-200"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
              isWalkIn ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Patient & Doctor Selection */}
        <div className="lg:col-span-7 space-y-6">
          {/* Patient Card */}
          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                  1
                </div>
                Patient Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <PatientSelector
                patients={patients}
                selectedId={form.patientId}
                onSelect={(id) => setForm((f) => ({ ...f, patientId: id }))}
              />
            </CardContent>
          </Card>

          {/* Doctor Card */}
          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">
                  2
                </div>
                Assigned Specialist
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <DoctorSelector
                doctors={doctors}
                selectedId={form.doctorId}
                onSelect={(id) => setForm((f) => ({ ...f, doctorId: id }))}
              />

              {/* Slots List */}
              {form.doctorId && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Available Doctor Slots *
                  </label>
                  {isLoadingSlots ? (
                    <div className="py-6 flex items-center justify-center gap-2 text-slate-500 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--brand-primary)]" />
                      Loading doctor schedules...
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      No available time slots found for this doctor in the next 14 days.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                      {availableSlots.map((slot) => {
                        const isSelected = form.timeSlotId === slot.timeSlotId;
                        return (
                          <button
                            key={slot.timeSlotId}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, timeSlotId: slot.timeSlotId }))}
                            className={cn(
                              "p-3 rounded-xl border text-left transition-all",
                              isSelected
                                ? "border-[var(--brand-primary)] bg-teal-50/70 ring-1 ring-[var(--brand-primary)]"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-xs text-slate-900">{slot.date}</span>
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                {slot.remainingCapacity} left
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {slot.startTime} - {slot.endTime}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Visit Details & Summary */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                  3
                </div>
                Visit Type &amp; Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Visit Type
                </label>
                <select
                  value={form.visitType}
                  onChange={(e) => setForm((f) => ({ ...f, visitType: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] outline-none"
                >
                  {VISIT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Reception Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Patient symptoms, referral reason, or notes..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] outline-none resize-none"
                />
              </div>

              {/* Booking Summary */}
              {selectedDoctor && selectedPatient && selectedSlot && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-1.5">
                  <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                    Booking Summary
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Patient:</span>
                    <span className="font-semibold text-slate-900">{selectedPatient.fullName}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Doctor:</span>
                    <span className="font-semibold text-slate-900">{selectedDoctor.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Mode:</span>
                    <span
                      className={cn(
                        "font-semibold",
                        isWalkIn ? "text-amber-700" : "text-slate-900"
                      )}
                    >
                      {isWalkIn ? "Walk-In (Auto Check-In)" : "Scheduled Booking"}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Fee:</span>
                    <span className="font-bold text-emerald-700">
                      Rs. {Number(selectedDoctor.consultationFee).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || !form.timeSlotId}
                className={cn(
                  "w-full h-11 rounded-xl text-white font-semibold text-sm shadow-sm transition-all",
                  isWalkIn
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)]"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isWalkIn ? "Scheduling & Checking In..." : "Booking Appointment..."}
                  </>
                ) : isWalkIn ? (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Book &amp; Check-In Immediately
                  </>
                ) : (
                  <>
                    <Ticket className="w-4 h-4 mr-2" />
                    Confirm &amp; Issue Token
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
