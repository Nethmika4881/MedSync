"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAppointmentStore } from "@/lib/stores/appointmentStore";
import { useRole, useCurrentUser } from "@/lib/stores/authStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/catms/StatusPill";
import { EmptyState } from "@/components/catms/EmptyState";
import {
  Calendar,
  Search,
  MoreHorizontal,
  UserCheck,
  XCircle,
  X,
  CheckCircle2,
  Sparkles,
  Clock,
  MapPin,
  User,
  Stethoscope,
  FileText,
  CreditCard,
  Printer,
} from "lucide-react";
import { AvatarWithName } from "@/components/catms/AvatarWithName";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { doctors } from "@/lib/mockData/doctors";
import { patients } from "@/lib/mockData/patients";
import { branches } from "@/lib/mockData/branches";
import type { Appointment, SessionType, VisitType } from "@/lib/mockData/appointments";
import { SESSION_META } from "@/lib/mockData/appointments";
import { SessionBadge } from "@/components/catms/SessionBadge";

/* ──────────────────────────────────────────────────────────
   Confetti Canvas
────────────────────────────────────────────────────────── */
function ConfettiExplosion({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = [
      "#16A085","#0F7A66","#27AE60","#F39C12",
      "#E74C3C","#9B59B6","#3498DB","#F1C40F",
      "#1ABC9C","#E67E22",
    ];

    const particles = Array.from({ length: 130 }, (_, i) => ({
      id: i,
      x: canvas.width / 2,
      y: canvas.height / 2,
      size: Math.random() * 10 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      angle: Math.random() * Math.PI * 2,
      speed: Math.random() * 14 + 4,
      spin: (Math.random() - 0.5) * 0.3,
      shape: (["circle","rect","triangle"] as const)[Math.floor(Math.random() * 3)],
      drift: (Math.random() - 0.5) * 2,
    }));

    let frame = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;
      const gravity = 0.25 * (frame / 10);

      particles.forEach((p) => {
        p.x += Math.cos(p.angle) * p.speed + p.drift;
        p.y += Math.sin(p.angle) * p.speed + gravity;
        p.speed *= 0.97;
        p.angle += p.spin;

        const alpha = Math.max(0, 1 - frame / 120);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle * 5);

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(p.size / 2, p.size / 2);
          ctx.lineTo(-p.size / 2, p.size / 2);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
        ctx.globalAlpha = 1;
      });

      if (frame < 145) {
        animRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
    />
  );
}

/* ──────────────────────────────────────────────────────────
   Receipt Row
────────────────────────────────────────────────────────── */
function ReceiptRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5" style={{ color: "#16A085" }}>{icon}</div>
      <div className="flex-1 flex items-baseline justify-between gap-2">
        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{label}</span>
        <span className="text-sm text-slate-700 font-semibold text-right">{value}</span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Receipt Modal
────────────────────────────────────────────────────────── */
function ReceiptModal({
  appointment,
  onClose,
}: {
  appointment: Appointment | null;
  onClose: () => void;
}) {
  if (!appointment) return null;

  const booked = new Date();
  const apptDate = new Date(appointment.dateTime);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: "rFadeIn 0.2s ease" }}
      />
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: "receiptSlideIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        {/* Green header */}
        <div
          className="relative px-8 pt-10 pb-8 text-white text-center overflow-hidden"
          style={{ background: "linear-gradient(135deg,#16A085 0%,#0F7A66 60%,#0a5c4a 100%)" }}
        >
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full"
            style={{ background: "rgba(255,255,255,0.15)" }} />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full"
            style={{ background: "rgba(255,255,255,0.08)" }} />
          <div
            className="relative z-10 mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.2)", animation: "popIn 0.6s 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}
          >
            <CheckCircle2 className="w-9 h-9 text-white" />
          </div>
          <div className="relative z-10" style={{ animation: "fadeUpIn 0.5s 0.4s both" }}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 opacity-80" />
              <p className="text-sm font-medium opacity-90 uppercase tracking-widest">Booking Confirmed</p>
              <Sparkles className="w-4 h-4 opacity-80" />
            </div>
            <h2 className="text-2xl font-bold">Appointment Booked!</h2>
            <p className="text-sm opacity-75 mt-1">Your appointment has been successfully scheduled.</p>
          </div>
        </div>

        {/* Zigzag / scallop divider */}
        <div style={{ height: "20px", background: "#0F7A66", position: "relative" }}>
          <svg
            viewBox="0 0 400 20"
            preserveAspectRatio="none"
            style={{ width: "100%", height: "20px", display: "block" }}
          >
            <path d="M0,0 Q10,20 20,0 Q30,20 40,0 Q50,20 60,0 Q70,20 80,0 Q90,20 100,0 Q110,20 120,0 Q130,20 140,0 Q150,20 160,0 Q170,20 180,0 Q190,20 200,0 Q210,20 220,0 Q230,20 240,0 Q250,20 260,0 Q270,20 280,0 Q290,20 300,0 Q310,20 320,0 Q330,20 340,0 Q350,20 360,0 Q370,20 380,0 Q390,20 400,0 L400,20 L0,20 Z" fill="white" />
          </svg>
        </div>

        {/* Receipt content */}
        <div className="px-8 pb-6 space-y-4" style={{ animation: "fadeUpIn 0.5s 0.5s both" }}>
          <div className="flex items-center justify-between py-3 border-b border-dashed border-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Appointment ID</span>
            <span className="text-sm font-bold text-slate-800" style={{ fontFamily: "monospace" }}>{appointment.appointmentId}</span>
          </div>
          <div className="space-y-3">
            <ReceiptRow icon={<Stethoscope className="w-4 h-4" />} label="Doctor" value={appointment.doctorName} />
            <ReceiptRow icon={<User className="w-4 h-4" />} label="Patient" value={appointment.patientName} />
            <ReceiptRow
              icon={<Calendar className="w-4 h-4" />}
              label="Date"
              value={apptDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            />
            <ReceiptRow
              icon={<Clock className="w-4 h-4" />}
              label="Session"
              value={`${SESSION_META[appointment.session].emoji} ${appointment.session} · ${SESSION_META[appointment.session].timeRange} (Ticket #${appointment.ticketNumber})`}
            />
            <ReceiptRow icon={<MapPin className="w-4 h-4" />} label="Branch" value={appointment.branchName} />
            <ReceiptRow icon={<FileText className="w-4 h-4" />} label="Visit Type" value={appointment.visitType} />
            <ReceiptRow icon={<CreditCard className="w-4 h-4" />} label="Specialization" value={appointment.doctorSpecialization} />
          </div>
          <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: "#E9F9EF" }}>
            <span className="text-sm font-semibold text-green-700">Status</span>
            <span className="text-sm font-bold text-green-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              {appointment.status}
            </span>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">
              Booked on {booked.toLocaleDateString()} at {booked.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => window.print()}
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-2xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-2xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95"
              style={{ background: "linear-gradient(135deg,#16A085,#0F7A66)" }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   New Appointment Modal
────────────────────────────────────────────────────────── */
const VISIT_TYPES: VisitType[] = [
  "General Checkup","Follow-up","Consultation","New Patient",
  "Routine Check","Emergency","Video Consultation",
];

function NewAppointmentModal({
  onClose,
  onSuccess,
  role,
  currentUser,
}: {
  onClose: () => void;
  onSuccess: (appt: Appointment) => void;
  role: string;
  currentUser: { userId: string; name: string };
}) {
  const { appointments, addAppointment } = useAppointmentStore();
  const isPatient = role === "patient";
  const selfPatient = isPatient
    ? patients.find((p) => p.name === currentUser.name) ?? null
    : null;

  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState(selfPatient?.patientId ?? "");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [visitType, setVisitType] = useState<VisitType>("General Checkup");
  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("09:00");
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const selectedDoctor = doctors.find((d) => d.doctorId === selectedDoctorId);
  const selectedPatient = patients.find((p) => p.patientId === selectedPatientId);

  useEffect(() => {
    if (selectedDoctor) setSelectedBranchId(selectedDoctor.branchId);
  }, [selectedDoctor]);

  const filteredDoctors = selectedBranchId
    ? doctors.filter((d) => d.branchId === selectedBranchId)
    : doctors;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selectedDoctorId) errs.doctor = "Please select a doctor.";
    if (!selectedPatientId) errs.patient = "Please select a patient.";
    if (!dateValue) errs.date = "Please select a date.";
    if (dateValue && timeValue) {
      const chosen = new Date(`${dateValue}T${timeValue}`);
      if (chosen <= new Date()) errs.date = "Appointment must be in the future.";
    }
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);

    const doctor = doctors.find((d) => d.doctorId === selectedDoctorId)!;
    const patient = patients.find((p) => p.patientId === selectedPatientId)!;
    const branch = branches.find((b) => b.branchId === doctor.branchId)!;

    const newId = `APT-${Date.now()}`;
    const hour = Number.parseInt(timeValue.split(":")[0] ?? "9", 10);
    const session: SessionType =
      hour < 11 ? "Morning" : hour < 14 ? "Midday" : hour < 17 ? "Afternoon" : "Evening";
    const ticketNumber =
      appointments.filter((a) => {
        if (a.doctorId !== doctor.doctorId || a.session !== session) return false;
        const existingDate = new Date(a.dateTime).toISOString().slice(0, 10);
        return existingDate === dateValue;
      }).length + 1;
    const appt: Appointment = {
      appointmentId: newId,
      patientId: patient.patientId,
      patientName: patient.name,
      doctorId: doctor.doctorId,
      doctorName: doctor.name,
      doctorSpecialization: doctor.specialization,
      branchId: branch.branchId,
      branchName: branch.name,
      dateTime: new Date(`${dateValue}T${timeValue}`).toISOString(),
      duration,
      session,
      ticketNumber,
      visitType,
      status: "Confirmed",
      paymentStatus: "Unpaid",
      source: "Booked",
      notes: notes || undefined,
    };

    addAppointment(appt);
    setTimeout(() => { setSubmitting(false); onSuccess(appt); }, 600);
  };

  const inp = "w-full h-11 px-4 rounded-xl border border-slate-200 text-sm text-slate-800 focus:border-[#16A085] focus:ring-2 focus:ring-[#16A085]/20 outline-none transition-all bg-white placeholder:text-slate-400";
  const sel = "w-full h-11 px-4 rounded-xl border border-slate-200 text-sm text-slate-800 focus:border-[#16A085] focus:ring-2 focus:ring-[#16A085]/20 outline-none transition-all bg-white";
  const lbl = "block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider";
  const err = "text-xs text-red-500 mt-1";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: "rFadeIn 0.2s ease" }}
      />
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ animation: "modalSlideIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-7 py-5 border-b border-slate-100 bg-white rounded-t-3xl z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-900">New Appointment</h3>
            <p className="text-xs text-slate-400 mt-0.5">Fill in the details to schedule a visit</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
          {/* Branch filter */}
          <div>
            <label className={lbl}>Branch (optional filter)</label>
            <select
              className={sel}
              value={selectedBranchId}
              onChange={(e) => { setSelectedBranchId(e.target.value); setSelectedDoctorId(""); }}
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.branchId} value={b.branchId}>{b.name} — {b.city}</option>
              ))}
            </select>
          </div>

          {/* Doctor */}
          <div>
            <label className={lbl}>Doctor <span className="text-red-400">*</span></label>
            <select
              className={`${sel} ${errors.doctor ? "border-red-400" : ""}`}
              value={selectedDoctorId}
              onChange={(e) => { setSelectedDoctorId(e.target.value); setErrors((p) => ({ ...p, doctor: "" })); }}
            >
              <option value="">Select Doctor</option>
              {filteredDoctors.map((d) => (
                <option key={d.doctorId} value={d.doctorId}>
                  {d.name} — {d.specialization} (${d.consultationFee})
                </option>
              ))}
            </select>
            {errors.doctor && <p className={err}>{errors.doctor}</p>}
            {selectedDoctor && (
              <div className="mt-2 flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: "linear-gradient(135deg,#16A085,#0F7A66)" }}
                >
                  {selectedDoctor.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{selectedDoctor.name}</p>
                  <p className="text-xs text-slate-400">{selectedDoctor.specialization} · ⭐ {selectedDoctor.rating}</p>
                </div>
                <span className="text-sm font-bold shrink-0" style={{ color: "#16A085" }}>${selectedDoctor.consultationFee}</span>
              </div>
            )}
          </div>

          {/* Patient */}
          {!isPatient ? (
            <div>
              <label className={lbl}>Patient <span className="text-red-400">*</span></label>
              <select
                className={`${sel} ${errors.patient ? "border-red-400" : ""}`}
                value={selectedPatientId}
                onChange={(e) => { setSelectedPatientId(e.target.value); setErrors((p) => ({ ...p, patient: "" })); }}
              >
                <option value="">Select Patient</option>
                {patients.map((p) => (
                  <option key={p.patientId} value={p.patientId}>{p.name} ({p.patientId})</option>
                ))}
              </select>
              {errors.patient && <p className={err}>{errors.patient}</p>}
            </div>
          ) : selfPatient ? (
            <div>
              <label className={lbl}>Patient</label>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: "linear-gradient(135deg,#3498DB,#2980B9)" }}
                >
                  {selfPatient.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{selfPatient.name}</p>
                  <p className="text-xs text-slate-400">{selfPatient.patientId}</p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Date <span className="text-red-400">*</span></label>
              <input
                type="date"
                className={`${inp} ${errors.date ? "border-red-400" : ""}`}
                value={dateValue}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => { setDateValue(e.target.value); setErrors((p) => ({ ...p, date: "" })); }}
              />
              {errors.date && <p className={err}>{errors.date}</p>}
            </div>
            <div>
              <label className={lbl}>Time</label>
              <input
                type="time"
                className={inp}
                value={timeValue}
                onChange={(e) => setTimeValue(e.target.value)}
              />
            </div>
          </div>

          {/* Visit Type & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Visit Type</label>
              <select className={sel} value={visitType} onChange={(e) => setVisitType(e.target.value as VisitType)}>
                {VISIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Duration</label>
              <select className={sel} value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                {[15,30,45,60,90,120].map((d) => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={lbl}>Notes (optional)</label>
            <textarea
              rows={3}
              placeholder="Any special instructions..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 focus:border-[#16A085] focus:ring-2 focus:ring-[#16A085]/20 outline-none transition-all bg-white placeholder:text-slate-400 resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Summary */}
          {selectedDoctor && selectedPatient && dateValue && (
            <div className="rounded-2xl p-4 text-sm space-y-1.5" style={{ background: "linear-gradient(135deg,#e8f5f2,#f0f4ff)" }}>
              <p className="font-semibold text-slate-700 text-xs uppercase tracking-wider mb-2">Booking Summary</p>
              <div className="grid grid-cols-2 gap-1 text-xs text-slate-600">
                <span className="text-slate-400">Doctor:</span>
                <span className="font-medium">{selectedDoctor.name}</span>
                <span className="text-slate-400">Patient:</span>
                <span className="font-medium">{selectedPatient.name}</span>
                <span className="text-slate-400">Branch:</span>
                <span className="font-medium">{selectedDoctor.branchName}</span>
                <span className="text-slate-400">Fee:</span>
                <span className="font-bold" style={{ color: "#16A085" }}>${selectedDoctor.consultationFee}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-2xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-11 rounded-2xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#16A085,#0F7A66)" }}
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  Book Appointment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Main Page
────────────────────────────────────────────────────────── */
export default function AppointmentsPage() {
  const { appointments, checkInAppointment, cancelAppointment } = useAppointmentStore();
  const role = useRole();
  const user = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [receipt, setReceipt] = useState<Appointment | null>(null);

  if (!role || !user) return null;

  let filtered = appointments;
  if (role === "doctor") {
    filtered = filtered.filter((a) => a.doctorId === user.userId);
  } else if (role === "patient") {
    const selfP = patients.find((p) => p.name === user.name);
    if (selfP) filtered = filtered.filter((a) => a.patientId === selfP.patientId);
  }

  if (searchTerm) {
    const q = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.patientName.toLowerCase().includes(q) ||
        a.doctorName.toLowerCase().includes(q) ||
        a.appointmentId.toLowerCase().includes(q)
    );
  }

  const upcoming = filtered.filter((a) =>
    ["Confirmed","Rescheduled","Pending","Checked-in"].includes(a.status)
  );
  const past = filtered.filter((a) =>
    ["Completed","Cancelled","Checked-out"].includes(a.status)
  );

  const canCreate = role === "admin" || role === "receptionist" || role === "patient";

  const handleSuccess = (appt: Appointment) => {
    setShowNewModal(false);
    setConfettiActive(false);
    requestAnimationFrame(() => {
      setConfettiActive(true);
      setReceipt(appt);
    });
    setTimeout(() => setConfettiActive(false), 3500);
  };

  return (
    <>
      <ConfettiExplosion active={confettiActive} />

      {showNewModal && (
        <NewAppointmentModal
          onClose={() => setShowNewModal(false)}
          onSuccess={handleSuccess}
          role={role}
          currentUser={user}
        />
      )}

      {receipt && (
        <ReceiptModal appointment={receipt} onClose={() => setReceipt(null)} />
      )}

      <div className="space-y-6 animate-fade-in">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Appointments</h2>
            <p className="text-slate-500">Manage all scheduling and patient visits.</p>
          </div>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-3 mt-4 sm:mt-0">
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-sm focus:border-[#16A085] focus:ring-1 focus:ring-[#16A085] outline-none transition-all bg-white"
              />
            </div>
            {canCreate && (
              <button
                id="new-appointment-btn"
                onClick={() => setShowNewModal(true)}
                className="appt-new-btn flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-white text-sm font-semibold w-full sm:w-auto shrink-0"
              >
                <Calendar className="w-4 h-4" />
                New Appointment
              </button>
            )}
          </div>
        </div>

        {/* Upcoming table */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Upcoming</h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: "#16A085", background: "#e8f5f2" }}>
              {upcoming.length} scheduled
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date &amp; Session</th>
                  {role !== "patient" && <th className="px-6 py-4 font-semibold">Patient</th>}
                  {role !== "doctor" && <th className="px-6 py-4 font-semibold">Doctor</th>}
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {upcoming.map((appt) => (
                  <tr key={appt.appointmentId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{new Date(appt.dateTime).toLocaleDateString()}</div>
                      <div className="mt-1">
                        <SessionBadge session={appt.session} ticketNumber={appt.ticketNumber} variant="compact" />
                      </div>
                    </td>
                    {role !== "patient" && (
                      <td className="px-6 py-4">
                        <AvatarWithName name={appt.patientName} subtitle={appt.appointmentId} size="sm" />
                      </td>
                    )}
                    {role !== "doctor" && (
                      <td className="px-6 py-4">
                        <AvatarWithName name={appt.doctorName} subtitle={appt.doctorSpecialization} size="sm" />
                      </td>
                    )}
                    <td className="px-6 py-4">{appt.visitType}</td>
                    <td className="px-6 py-4"><StatusPill status={appt.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 rounded-lg">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl">
                          {(role === "receptionist" || role === "admin") && appt.status === "Confirmed" && (
                            <DropdownMenuItem onClick={() => checkInAppointment(appt.appointmentId)} className="cursor-pointer">
                              <UserCheck className="w-4 h-4 mr-2 text-green-600" />
                              <span>Check-in Patient</span>
                            </DropdownMenuItem>
                          )}
                          {(appt.status === "Confirmed" || appt.status === "Pending" || appt.status === "Rescheduled") && (
                            <DropdownMenuItem
                              onClick={() => cancelAppointment(appt.appointmentId, "User cancelled")}
                              className="cursor-pointer text-red-600 focus:text-red-700"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              <span>Cancel Appointment</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {upcoming.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState icon={Calendar} title="No upcoming appointments" description="There are no scheduled appointments matching your criteria." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Past table */}
        {past.length > 0 && (
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Past Appointments</h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-slate-500 bg-slate-100">{past.length} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Date &amp; Session</th>
                    {role !== "patient" && <th className="px-6 py-4 font-semibold">Patient</th>}
                    {role !== "doctor" && <th className="px-6 py-4 font-semibold">Doctor</th>}
                    <th className="px-6 py-4 font-semibold">Type</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {past.map((appt) => (
                    <tr key={appt.appointmentId} className="hover:bg-slate-50/50 transition-colors opacity-75">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-700">{new Date(appt.dateTime).toLocaleDateString()}</div>
                        <div className="mt-1">
                          <SessionBadge session={appt.session} ticketNumber={appt.ticketNumber} variant="compact" />
                        </div>
                      </td>
                      {role !== "patient" && (
                        <td className="px-6 py-4">
                          <AvatarWithName name={appt.patientName} subtitle={appt.appointmentId} size="sm" />
                        </td>
                      )}
                      {role !== "doctor" && (
                        <td className="px-6 py-4">
                          <AvatarWithName name={appt.doctorName} subtitle={appt.doctorSpecialization} size="sm" />
                        </td>
                      )}
                      <td className="px-6 py-4">{appt.visitType}</td>
                      <td className="px-6 py-4"><StatusPill status={appt.status} /></td>
                      <td className="px-6 py-4 text-right"><span className="text-xs text-slate-400">—</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <style jsx global>{`
        /* ── New Appointment button ── */
        .appt-new-btn {
          background: linear-gradient(135deg, #16A085, #0F7A66);
          transition: all 0.2s ease;
        }
        .appt-new-btn:hover {
          background: linear-gradient(135deg, #14957a, #0d6b58) !important;
          box-shadow: 0 6px 20px rgba(22,160,133,0.4);
          transform: translateY(-1px);
          color: #ffffff !important;
        }
        .appt-new-btn:active {
          transform: scale(0.97);
        }

        /* ── Modal slide in ── */
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.9) translateY(24px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* ── Receipt slide in ── */
        @keyframes receiptSlideIn {
          from { opacity: 0; transform: scale(0.85) translateY(30px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* ── Pop in ── */
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.3); }
          to   { opacity: 1; transform: scale(1); }
        }

        /* ── Fade up ── */
        @keyframes fadeUpIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Fade in ── */
        @keyframes rFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ── Page fade in ── */
        .animate-fade-in {
          animation: rFadeIn 0.4s ease both;
        }

        /* ── Spinner ── */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </>
  );
}
