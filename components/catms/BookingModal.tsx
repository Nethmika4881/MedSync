"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAppointmentStore } from "@/lib/stores/appointmentStore";
import { useSessionConfigStore } from "@/lib/stores/sessionConfigStore";
import type { Doctor, Appointment, VisitType, SessionType } from "@/lib/types";
import { SESSION_META } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { X, Check, ChevronLeft, ChevronRight, Ticket, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { bookAppointment, getSlotAvailability, type SlotAvailability } from "@/lib/actions/appointments";

const VISIT_TYPES: VisitType[] = [
  "General Checkup",
  "Consultation",
  "Follow-up",
  "New Patient",
  "Video Consultation",
];

const ALL_SESSIONS: SessionType[] = ["Morning", "Midday", "Afternoon", "Evening"];

export function getNextDays(count: number) {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

export function getAvatarGradient(initials: string) {
  const gradients = [
    "from-teal-500 to-emerald-600",
    "from-blue-500 to-indigo-600",
    "from-violet-500 to-purple-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-teal-600",
  ];
  if (!initials) return gradients[0];
  const idx = initials.charCodeAt(0) % gradients.length;
  return gradients[idx];
}

type BookingStep = "datetime" | "preview" | "details" | "confirm" | "success";

function ConfirmRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span
        className={cn(
          "text-sm font-semibold text-right",
          highlight ? "text-[var(--brand-primary)]" : "text-slate-800"
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** Ticket-badge badge colours per session */
const SESSION_BADGE_CLS: Record<SessionType, string> = {
  Morning:   "bg-amber-100 text-amber-700 border-amber-200",
  Midday:    "bg-sky-100   text-sky-700   border-sky-200",
  Afternoon: "bg-teal-100  text-teal-700  border-teal-200",
  Evening:   "bg-indigo-100 text-indigo-700 border-indigo-200",
};

export function BookingModal({
  doctor,
  onClose,
  currentUserId,
  currentUserName,
}: {
  doctor: Doctor;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
}) {
  const addAppointment = useAppointmentStore((s) => s.addAppointment);
  const appointments = useAppointmentStore((s) => s.appointments);
  const getConfig = useSessionConfigStore((s) => s.getConfig);

  const availableDays = useMemo(() => getNextDays(7), []);

  const fullyBooked = doctor.fullyBookedDate;

  const STEPS: BookingStep[] = ["datetime", "preview", "details", "confirm"];

  const [step, setStep] = useState<BookingStep>("datetime");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionType | null>(null);
  const [generatedTicket, setGeneratedTicket] = useState<number | null>(null);
  const [visitType, setVisitType] = useState<VisitType>("General Checkup");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [dbSlots, setDbSlots] = useState<SlotAvailability[]>([]);

  // Fetch slot availability from database whenever selectedDay changes
  useEffect(() => {
    if (!selectedDay) return;
    let active = true;
    const dateStr = selectedDay.toISOString().split("T")[0];
    getSlotAvailability(doctor.doctorId, dateStr)
      .then((res) => {
        if (active) setDbSlots(res);
      })
      .catch((err) => console.error("Failed to fetch slots", err));
    return () => {
      active = false;
    };
  }, [doctor.doctorId, selectedDay]);

  const dayFmt = (d: Date) =>
    d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const isFullyBooked = (d: Date) =>
    fullyBooked ? d.toISOString().startsWith(fullyBooked) : false;

  /** Count existing bookings (falling back to store if db unavailable) */
  function getSessionBookingCount(session: SessionType, day: Date): number {
    const dbSlot = dbSlots.find((s) => s.session === session);
    if (dbSlot) return dbSlot.currentCount;
    return appointments.filter(
      (a) =>
        a.doctorId === doctor.doctorId &&
        a.session === session &&
        new Date(a.dateTime).toDateString() === day.toDateString() &&
        a.status !== "Cancelled"
    ).length;
  }

  /** Approximate ticket the patient would receive (live count + 1) */
  const approxTicket = useMemo(() => {
    if (!selectedDay || !selectedSession) return null;
    return getSessionBookingCount(selectedSession, selectedDay) + 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, selectedSession, appointments, dbSlots]);

  async function handleBook() {
    if (!selectedDay || !selectedSession) return;
    setIsSubmitting(true);
    setBookingError(null);

    const dateStr = selectedDay.toISOString().split("T")[0];

    try {
      const res = await bookAppointment({
        patientId: currentUserId,
        doctorId: doctor.doctorId,
        branchId: doctor.branchId,
        date: dateStr,
        session: selectedSession,
        visitType,
        fee: doctor.consultationFee ?? 2500,
        notes: notes || undefined,
      });

      setIsSubmitting(false);

      if (!res.success) {
        setBookingError(res.message);
        return;
      }

      setGeneratedTicket(res.ticketNumber);

      const meta = SESSION_META[selectedSession];
      const dt = new Date(selectedDay);
      dt.setHours(meta?.startHour ?? 9, 0, 0, 0);

      const newAppt: Appointment = {
        appointmentId: res.appointmentId,
        patientId: currentUserId,
        patientName: currentUserName,
        doctorId: doctor.doctorId,
        doctorName: doctor.name,
        doctorSpecialization: doctor.specialization,
        branchId: doctor.branchId,
        branchName: doctor.branchName,
        dateTime: dt.toISOString(),
        duration: 30,
        session: selectedSession,
        ticketNumber: res.ticketNumber,
        visitType,
        status: "Pending",
        paymentStatus: "Unpaid",
        source: "Booked",
        fee: doctor.consultationFee ?? 2500,
        notes: notes || undefined,
      };

      addAppointment(newAppt);
      setStep("success");
    } catch (err) {
      setIsSubmitting(false);
      setBookingError(err instanceof Error ? err.message : "An unexpected error occurred.");
    }
  }

  const gradient = getAvatarGradient(doctor.avatar || doctor.name.slice(0, 2));

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className={`bg-gradient-to-r ${gradient} p-6 text-white`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-lg">
              {doctor.avatar ? doctor.avatar.replace(/[0-9]/g, "") : doctor.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold">{doctor.name}</h2>
              <p className="text-white/80 text-sm">{doctor.specialization}</p>
              <p className="text-white/70 text-xs mt-0.5">{doctor.branchName}</p>
            </div>
          </div>

          {/* Step indicator — 4 steps */}
          {step !== "success" && (
            <div className="flex items-center gap-2 mt-5">
              {STEPS.map((s, i) => (
                <React.Fragment key={s}>
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                      step === s
                        ? "bg-white text-[var(--brand-primary)]"
                        : stepIndex > i
                        ? "bg-white/50 text-white"
                        : "bg-white/20 text-white/60"
                    )}
                  >
                    {stepIndex > i ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 bg-white/30 rounded-full" />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* ── Body ─────────────────────────────────────────────── */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">

          {/* ── Step 1: Date & Session ─────────────────────────── */}
          {step === "datetime" && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="font-bold text-slate-900 text-lg">Select Date &amp; Session</h3>

              {/* Day picker */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2 tracking-wide">
                  Available Days
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {availableDays.map((day) => {
                    const booked = isFullyBooked(day);
                    const selected = selectedDay?.toDateString() === day.toDateString();
                    return (
                      <button
                        key={day.toISOString()}
                        disabled={booked}
                        onClick={() => {
                          setSelectedDay(day);
                          setSelectedSession(null);
                        }}
                        className={cn(
                          "flex flex-col items-center py-3 px-1 rounded-xl border text-xs font-semibold transition-all",
                          booked
                            ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                            : selected
                            ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white shadow-md"
                            : "border-slate-200 bg-white text-slate-700 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                        )}
                      >
                        <span className="text-[10px] uppercase opacity-70">
                          {day.toLocaleDateString("en-US", { weekday: "short" })}
                        </span>
                        <span className="text-base font-bold leading-tight">{day.getDate()}</span>
                        <span className="text-[10px] opacity-70">
                          {day.toLocaleDateString("en-US", { month: "short" })}
                        </span>
                        {booked && <span className="text-[9px] text-rose-400 mt-0.5">Full</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Session cards — only shown after day is selected */}
              {selectedDay && (
                <div className="animate-fade-in-up space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Sessions — {dayFmt(selectedDay)}
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    {ALL_SESSIONS.map((session) => {
                      const meta = SESSION_META[session];
                      const config = getConfig(doctor.doctorId, session);
                      const maxTickets = config?.maxTickets ?? 12;
                      const isEnabled = config?.isEnabled ?? true;
                      const booked = getSessionBookingCount(session, selectedDay);
                      const isFull = booked >= maxTickets;
                      const isDisabled = !isEnabled || isFull;
                      const isSelected = selectedSession === session;
                      const pct = Math.min((booked / maxTickets) * 100, 100);

                      const progressColor =
                        pct >= 90 ? "bg-rose-400" : pct >= 60 ? "bg-amber-400" : "bg-emerald-400";

                      return (
                        <button
                          key={session}
                          disabled={isDisabled}
                          onClick={() => setSelectedSession(session)}
                          className={cn(
                            "w-full rounded-2xl border-2 p-4 text-left transition-all duration-200",
                            isDisabled
                              ? "border-slate-100 bg-slate-50 cursor-not-allowed opacity-60"
                              : isSelected
                              ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/5 shadow-md"
                              : "border-slate-200 bg-white hover:border-[var(--brand-primary)]/50 hover:shadow-sm"
                          )}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{meta?.emoji ?? "📅"}</span>
                              <div>
                                <p
                                  className={cn(
                                    "font-bold text-sm",
                                    isSelected ? "text-[var(--brand-primary)]" : "text-slate-800"
                                  )}
                                >
                                  {meta?.label ?? session}
                                </p>
                                <p className="text-xs text-slate-500">{meta?.timeRange}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {isFull ? (
                                <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                  Full
                                </span>
                              ) : !isEnabled ? (
                                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                  Closed
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-slate-600">
                                  🎫 {booked} / {maxTickets}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Capacity progress bar */}
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all", progressColor)}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <Button
                disabled={!selectedDay || !selectedSession}
                onClick={() => setStep("preview")}
                className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl h-11 font-semibold disabled:opacity-40 transition-all"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* ── Step 2: Approximate Ticket Preview ─────────────── */}
          {step === "preview" && selectedDay && selectedSession && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="font-bold text-slate-900 text-lg">Your Estimated Ticket</h3>
              <p className="text-sm text-slate-500">
                Here's your <strong>approximate position</strong> in the queue for{" "}
                <span className="text-slate-700 font-semibold">
                  {SESSION_META[selectedSession]?.emoji} {SESSION_META[selectedSession]?.label}
                </span>{" "}
                on <span className="text-slate-700 font-semibold">{dayFmt(selectedDay)}</span>.
              </p>

              {/* Ticket mockup */}
              <div className="relative flex items-center justify-center py-4">
                {/* Outer decorative ring */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full border-4 border-dashed border-slate-100 animate-spin-slow" />
                </div>
                <div
                  className={cn(
                    "relative w-40 h-40 rounded-3xl flex flex-col items-center justify-center shadow-xl border-2",
                    SESSION_BADGE_CLS[selectedSession]
                  )}
                  style={{
                    background:
                      selectedSession === "Morning"
                        ? "linear-gradient(135deg,#fffbeb,#fef3c7)"
                        : selectedSession === "Midday"
                        ? "linear-gradient(135deg,#eff6ff,#dbeafe)"
                        : selectedSession === "Afternoon"
                        ? "linear-gradient(135deg,#f0fdfa,#ccfbf1)"
                        : "linear-gradient(135deg,#eef2ff,#e0e7ff)",
                  }}
                >
                  <Ticket className="w-6 h-6 mb-1 opacity-40" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest opacity-60 mb-1">
                    Est. Ticket
                  </p>
                  <p className="text-5xl font-black leading-none">
                    #{approxTicket}
                  </p>
                  <p className="text-[10px] font-semibold mt-2 opacity-50">
                    {SESSION_META[selectedSession]?.timeRange}
                  </p>
                </div>
              </div>

              {/* Warning note */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  This is an <strong>estimate</strong>. If others book at the same time, your
                  actual ticket number may shift by ±1. Your confirmed number will be shown after
                  you complete the booking.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("datetime")}
                  className="flex-1 rounded-xl h-11 border-slate-200"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep("details")}
                  className="flex-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl h-11 font-semibold"
                >
                  I Understand, Proceed
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Visit Details ───────────────────────────── */}
          {step === "details" && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="font-bold text-slate-900 text-lg">Visit Details</h3>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
                  Visit Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {VISIT_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setVisitType(type)}
                      className={cn(
                        "py-2.5 px-3 rounded-xl border text-xs font-semibold text-left transition-all",
                        visitType === type
                          ? "border-[var(--brand-primary)] bg-teal-50 text-[var(--brand-primary)]"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
                  Additional Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe your symptoms or reason for visit..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 text-sm p-3 resize-none focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("preview")}
                  className="flex-1 rounded-xl h-11 border-slate-200"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep("confirm")}
                  className="flex-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl h-11 font-semibold"
                >
                  Review
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 4: Confirm ─────────────────────────────────── */}
          {step === "confirm" && selectedDay && selectedSession && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="font-bold text-slate-900 text-lg">Confirm Appointment</h3>

              {/* Session badge */}
              <div
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold",
                  SESSION_BADGE_CLS[selectedSession]
                )}
              >
                <span>{SESSION_META[selectedSession]?.emoji}</span>
                <span>
                  {SESSION_META[selectedSession]?.label} · {SESSION_META[selectedSession]?.timeRange}
                </span>
                <span className="ml-1 opacity-60">~Ticket #{approxTicket}</span>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
                <ConfirmRow label="Doctor" value={doctor.name} />
                <ConfirmRow label="Specialization" value={doctor.specialization} />
                <ConfirmRow label="Branch" value={doctor.branchName} />
                <ConfirmRow label="Date" value={dayFmt(selectedDay)} />
                <ConfirmRow
                  label="Session"
                  value={`${SESSION_META[selectedSession]?.emoji ?? ""} ${selectedSession} (${SESSION_META[selectedSession]?.timeRange ?? ""})`}
                />
                <ConfirmRow label="Visit Type" value={visitType} />
                <ConfirmRow
                  label="Consultation Fee"
                  value={`LKR ${doctor.consultationFee?.toLocaleString() ?? 2500}`}
                  highlight
                />
                {notes && <ConfirmRow label="Notes" value={notes} />}
              </div>

              {bookingError && (
                <div className="flex items-start gap-3 p-4 bg-rose-50 rounded-2xl border border-rose-200 animate-fade-in">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-rose-800">Booking Failed</p>
                    <p className="text-xs text-rose-700 leading-relaxed mt-0.5">{bookingError}</p>
                    <button
                      onClick={() => setStep("datetime")}
                      className="text-xs text-rose-800 font-semibold underline mt-1 hover:text-rose-900"
                    >
                      Choose another date or session
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setStep("details")}
                  className="flex-1 rounded-xl h-11 border-slate-200"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <Button
                  disabled={isSubmitting}
                  onClick={handleBook}
                  className="flex-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl h-11 font-semibold disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-1.5" />
                      Confirm Booking
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ── Success ─────────────────────────────────────────── */}
          {step === "success" && selectedDay && selectedSession && (
            <div className="flex flex-col items-center text-center gap-4 py-4 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-10 h-10 text-emerald-600 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Appointment Booked!</h3>
                <p className="text-slate-500 text-sm mt-1">
                  Your appointment with{" "}
                  <span className="font-semibold text-slate-700">{doctor.name}</span> has been
                  successfully scheduled.
                </p>
              </div>

              {/* Prominent ticket display */}
              <div
                className={cn(
                  "w-full rounded-2xl p-5 text-left relative overflow-hidden border-2",
                  SESSION_BADGE_CLS[selectedSession]
                )}
                style={{
                  background:
                    selectedSession === "Morning"
                      ? "linear-gradient(135deg,#fffbeb,#fef3c7)"
                      : selectedSession === "Midday"
                      ? "linear-gradient(135deg,#eff6ff,#dbeafe)"
                      : selectedSession === "Afternoon"
                      ? "linear-gradient(135deg,#f0fdfa,#ccfbf1)"
                      : "linear-gradient(135deg,#eef2ff,#e0e7ff)",
                }}
              >
                {/* Big ticket number in top-right */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest opacity-60">
                      Confirmed Ticket
                    </p>
                    <p className="text-5xl font-black leading-none mt-1">#{generatedTicket}</p>
                  </div>
                  <div className="text-4xl">{SESSION_META[selectedSession]?.emoji}</div>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">
                    {SESSION_META[selectedSession]?.label} Session ·{" "}
                    {SESSION_META[selectedSession]?.timeRange}
                  </p>
                  <p className="opacity-70">📅 {dayFmt(selectedDay)}</p>
                  <p className="opacity-70">🏥 {doctor.branchName}</p>
                  <p className="opacity-70">
                    📋 Status:{" "}
                    <span className="font-semibold text-amber-600">Pending Confirmation</span>
                  </p>
                </div>
              </div>

              <Button
                onClick={onClose}
                className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl h-11 font-semibold"
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
