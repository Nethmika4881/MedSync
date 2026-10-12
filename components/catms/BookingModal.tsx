"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { Doctor } from "@/lib/types";
import type { DoctorDirectoryItem } from "@/lib/actions/doctors";
import { ALLOWED_VISIT_TYPES } from "@/lib/types";
import {
  getDoctorBookableSlots,
  bookPatientAppointment,
  type BookableSlot,
  type BookAppointmentResult,
} from "@/lib/actions/patient-booking";
import { Button } from "@/components/ui/button";
import {
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Ticket,
  AlertCircle,
  Clock,
  Calendar as CalendarIcon,
  RefreshCw,
  Loader2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { cn, getSpecialtyGradient } from "@/lib/utils";
import { useRouter } from "next/navigation";

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

function formatTime(timeStr: string): string {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr || "00";
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function ConfirmRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
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

type BookingStep = "datetime" | "details" | "confirm" | "success";

export interface BookingModalProps {
  doctor: Doctor | DoctorDirectoryItem;
  onClose: () => void;
  currentUserId?: string;
  currentUserName?: string;
  onBookingSuccess?: (
    appointment: Extract<BookAppointmentResult, { success: true }>["appointment"]
  ) => void;
}

export function BookingModal(props: BookingModalProps) {
  const { doctor, onClose, onBookingSuccess } = props;
  const router = useRouter();

  // ── States ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<BookingStep>("datetime");
  const [slots, setSlots] = useState<BookableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(null);

  const [visitType, setVisitType] = useState<string>(ALLOWED_VISIT_TYPES[0]);
  const [reasonForVisit, setReasonForVisit] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<
    Extract<BookAppointmentResult, { success: true }>["appointment"] | null
  >(null);

  // ── Fetch Live Slots from Database ──────────────────────────────────────────
  const loadSlots = useCallback(async () => {
    setLoadingSlots(true);
    setSlotsError(null);
    try {
      const data = await getDoctorBookableSlots(doctor.doctorId);
      setSlots(data);

      // If user had a selected slot, re-verify it's still available in latest data
      setSelectedSlot((curr) => {
        if (!curr) return null;
        const updated = data.find((s) => s.timeSlotId === curr.timeSlotId);
        return updated ?? null;
      });

      // Default select the first available date if none selected yet
      setSelectedDate((curr) => {
        if (!curr && data.length > 0) {
          return data[0].date;
        }
        return curr;
      });
    } catch (err) {
      console.error("[BookingModal] Failed to load live slots:", err);
      setSlotsError("Unable to retrieve live schedule. Please try again.");
    } finally {
      setLoadingSlots(false);
    }
  }, [doctor.doctorId]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  // ── Group available dates from live slots ───────────────────────────────────
  const uniqueDates = useMemo(() => {
    const dates = Array.from(new Set(slots.map((s) => s.date)));
    return dates.sort();
  }, [slots]);

  // Slots for currently selected date
  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return slots.filter((s) => s.date === selectedDate);
  }, [slots, selectedDate]);

  // ── Handle Booking Submission ───────────────────────────────────────────────
  async function handleConfirmBooking() {
    if (!selectedSlot) {
      setSubmitError("Please select a time slot first.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await bookPatientAppointment({
        doctorId: doctor.doctorId,
        branchId: selectedSlot.branchId,
        timeSlotId: selectedSlot.timeSlotId,
        date: selectedSlot.date,
        visitType,
        reasonForVisit: reasonForVisit.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (result.success) {
        setConfirmedBooking(result.appointment);
        setStep("success");
        onBookingSuccess?.(result.appointment);
        router.refresh(); // Invalidate server components / counters
      } else {
        // Handle specific failure codes from authoritative server action
        if (
          result.code === "NO_CAPACITY" ||
          result.code === "CONCURRENT_CONFLICT"
        ) {
          setSubmitError(
            "This session reached capacity or another patient just booked the ticket. Please choose another session."
          );
          // Reload live slots to show real updated capacity
          loadSlots();
        } else if (result.code === "DUPLICATE_BOOKING") {
          setSubmitError(
            "You already have an active appointment booked in this session."
          );
        } else if (result.code === "UNAUTHENTICATED" || result.code === "FORBIDDEN") {
          setSubmitError("Authentication required. Please log in as a patient.");
        } else {
          setSubmitError(result.error || "Booking could not be completed.");
        }
      }
    } catch (err) {
      console.error("[BookingModal] Submission error:", err);
      setSubmitError("A connection error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const gradient = getSpecialtyGradient(doctor.specialization);
  const STEPS: BookingStep[] = ["datetime", "details", "confirm"];
  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={isSubmitting ? undefined : onClose}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up border border-slate-100 flex flex-col max-h-[90vh]">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className={`bg-gradient-to-r ${gradient} p-6 text-white shrink-0`}>
          <button
            onClick={isSubmitting ? undefined : onClose}
            disabled={isSubmitting}
            aria-label="Close booking modal"
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg shadow-inner">
              {(doctor.avatar || doctor.name).replace(/[0-9]/g, "").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight">{doctor.name}</h2>
              <p className="text-white/80 text-sm font-medium mt-0.5">
                {doctor.specialization} · {doctor.branchName}
              </p>
              <p className="text-xs text-white/70 mt-1">
                Fee: Rs. {Number(doctor.consultationFee).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Step indicator */}
          {step !== "success" && (
            <div className="flex items-center gap-2 mt-5">
              {STEPS.map((s, i) => (
                <React.Fragment key={s}>
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                      step === s
                        ? "bg-white text-[var(--brand-primary)] shadow-md"
                        : stepIndex > i
                        ? "bg-white/50 text-white"
                        : "bg-white/20 text-white/60"
                    )}
                  >
                    {stepIndex > i ? <Check className="w-3.5 h-3.5" /> : i + 1}
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
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Global error banner if any */}
          {submitError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3.5 flex items-start gap-2.5 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{submitError}</p>
                {step === "confirm" && (
                  <button
                    onClick={() => {
                      setSubmitError(null);
                      setStep("datetime");
                      loadSlots();
                    }}
                    className="mt-1 text-rose-600 underline font-medium hover:text-rose-800"
                  >
                    Return to time slots to choose another session
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 1: Date & Live Slot Selection ─────────────────────────── */}
          {step === "datetime" && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Select Date &amp; Slot</h3>
                  <p className="text-xs text-slate-500">Live PostgreSQL-backed availability</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadSlots}
                  disabled={loadingSlots}
                  className="h-8 px-2.5 text-xs text-slate-600 gap-1.5 rounded-lg hover:bg-slate-100"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", loadingSlots && "animate-spin")} />
                  Refresh
                </Button>
              </div>

              {/* Loading State */}
              {loadingSlots && slots.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
                  <p className="text-sm font-medium text-slate-600">
                    Checking live doctor schedule &amp; available slots...
                  </p>
                </div>
              ) : slotsError ? (
                /* Slot Loading Error State */
                <div className="py-8 text-center bg-rose-50 rounded-2xl border border-rose-100 p-6 space-y-3">
                  <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                  <p className="text-sm font-semibold text-rose-700">{slotsError}</p>
                  <Button
                    onClick={loadSlots}
                    variant="outline"
                    className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-100 h-9 text-xs"
                  >
                    Retry Connection
                  </Button>
                </div>
              ) : uniqueDates.length === 0 ? (
                /* No Available Slots State */
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-100 p-6 space-y-3">
                  <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto stroke-1" />
                  <h4 className="text-sm font-bold text-slate-700">No Available Slots Found</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    This doctor has no open slots scheduled in the coming days. Please check back later or select another specialist.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Date Selector */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      Available Dates
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {uniqueDates.map((dateStr) => {
                        const isSelected = selectedDate === dateStr;
                        const dateSlots = slots.filter((s) => s.date === dateStr);
                        const hasOpenCapacity = dateSlots.some((s) => s.remainingCapacity > 0);

                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => {
                              setSelectedDate(dateStr);
                              setSelectedSlot(null);
                              setSubmitError(null);
                            }}
                            className={cn(
                              "flex flex-col items-center py-2.5 px-3.5 rounded-xl border text-xs font-semibold transition-all shrink-0 min-w-[76px]",
                              isSelected
                                ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white shadow-md"
                                : hasOpenCapacity
                                ? "border-slate-200 bg-white text-slate-700 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                                : "border-slate-100 bg-slate-50 text-slate-400 opacity-60"
                            )}
                          >
                            <span className="text-[10px] uppercase opacity-80">
                              {new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
                                weekday: "short",
                              })}
                            </span>
                            <span className="text-base font-bold my-0.5">
                              {new Date(dateStr + "T00:00:00").getDate()}
                            </span>
                            <span className="text-[10px] opacity-80">
                              {new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
                                month: "short",
                              })}
                            </span>
                            {!hasOpenCapacity && (
                              <span className="text-[8px] mt-0.5 text-rose-500 font-bold">
                                FULL
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Slots for Selected Date */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Sessions for {selectedDate ? formatDate(selectedDate) : "Selected Date"}
                      </span>
                      {selectedSlot && (
                        <span className="text-emerald-600 font-medium normal-case">
                          Selected: {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                        </span>
                      )}
                    </p>

                    <div className="grid grid-cols-1 gap-2.5 max-h-56 overflow-y-auto pr-1">
                      {slotsForSelectedDate.length === 0 ? (
                        <p className="text-xs text-slate-400 py-4 text-center">
                          No sessions scheduled for this day.
                        </p>
                      ) : (
                        slotsForSelectedDate.map((slot) => {
                          const isFull = slot.remainingCapacity <= 0;
                          const isSelected = selectedSlot?.timeSlotId === slot.timeSlotId;

                          return (
                            <button
                              key={slot.timeSlotId}
                              type="button"
                              disabled={isFull}
                              onClick={() => {
                                setSelectedSlot(slot);
                                setSubmitError(null);
                              }}
                              className={cn(
                                "w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3",
                                isFull
                                  ? "border-slate-100 bg-slate-50/70 text-slate-400 cursor-not-allowed opacity-60"
                                  : isSelected
                                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/5 ring-1 ring-[var(--brand-primary)] text-slate-900 shadow-sm"
                                  : "border-slate-200 bg-white hover:border-[var(--brand-primary)] hover:bg-slate-50/50 text-slate-700"
                              )}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                                  <span className="font-bold text-sm text-slate-800">
                                    {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                                  </span>
                                  {isSelected && (
                                    <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)]" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span>{slot.branchName}</span>
                                </div>
                              </div>

                              <div className="text-right shrink-0 flex flex-col items-end">
                                {isFull ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                                    Fully Booked
                                  </span>
                                ) : (
                                  <>
                                    <span
                                      className={cn(
                                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold",
                                        slot.remainingCapacity <= 2
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-emerald-100 text-emerald-800"
                                      )}
                                    >
                                      {slot.remainingCapacity} {slot.remainingCapacity === 1 ? "ticket" : "tickets"} left
                                    </span>
                                    <span className="text-[10px] text-slate-400 mt-1 font-mono">
                                      ~Ticket #{slot.bookedCount + 1}
                                    </span>
                                  </>
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Proceed to Details Button */}
                  <Button
                    type="button"
                    disabled={!selectedSlot || selectedSlot.remainingCapacity <= 0}
                    onClick={() => setStep("details")}
                    className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl h-11 font-semibold transition-all mt-3 disabled:opacity-50"
                  >
                    Continue to Visit Details
                    <ChevronRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Visit Type & Reason ───────────────────────────────── */}
          {step === "details" && selectedSlot && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Appointment Details</h3>
                <p className="text-xs text-slate-500">
                  Select your visit type and provide any notes for the doctor.
                </p>
              </div>

              {/* Selected slot summary pill */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">
                  📅 {formatDate(selectedSlot.date)} · {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                </span>
                <button
                  type="button"
                  onClick={() => setStep("datetime")}
                  className="text-[var(--brand-primary)] font-semibold hover:underline"
                >
                  Change
                </button>
              </div>

              {/* Visit Type Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Visit Type *
                </label>
                <select
                  value={visitType}
                  onChange={(e) => setVisitType(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all cursor-pointer font-medium text-slate-800"
                >
                  {ALLOWED_VISIT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason for Visit */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Reason for Visit (Optional)
                </label>
                <input
                  type="text"
                  maxLength={150}
                  placeholder="e.g. Mild persistent headache, Annual checkup..."
                  value={reasonForVisit}
                  onChange={(e) => setReasonForVisit(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  placeholder="Any prior medical history or questions for the doctor..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all placeholder:text-slate-400 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setStep("datetime")}
                  className="flex-1 rounded-xl h-11 border-slate-200 text-slate-700"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep("confirm")}
                  className="flex-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl h-11 font-semibold"
                >
                  Review Booking
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Confirm & Authoritative Submission ───────────────────── */}
          {step === "confirm" && selectedSlot && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Confirm Appointment</h3>
                <p className="text-xs text-slate-500">
                  Please review the details below before reserving your ticket.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100">
                <ConfirmRow label="Doctor" value={doctor.name} />
                <ConfirmRow label="Specialization" value={doctor.specialization} />
                <ConfirmRow label="Branch" value={selectedSlot.branchName} />
                <ConfirmRow label="Date" value={formatDate(selectedSlot.date)} />
                <ConfirmRow
                  label="Time Slot"
                  value={`${formatTime(selectedSlot.startTime)} - ${formatTime(selectedSlot.endTime)}`}
                />
                <ConfirmRow label="Visit Type" value={visitType} />
                {reasonForVisit && (
                  <ConfirmRow label="Reason" value={reasonForVisit} />
                )}
                {notes && <ConfirmRow label="Notes" value={notes} />}
                <div className="border-t border-slate-200/70 pt-2 mt-2">
                  <ConfirmRow
                    label="Consultation Fee"
                    value={`Rs. ${Number(doctor.consultationFee).toLocaleString()}`}
                    highlight
                  />
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex items-center gap-2.5 text-emerald-800 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Ticket reservation is transactional and verified directly against hospital capacity.
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setStep("details")}
                  className="flex-1 rounded-xl h-11 border-slate-200 text-slate-700"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmBooking}
                  className="flex-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl h-11 font-semibold flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Reserving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm Booking</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Authoritative Success Receipt ────────────────────────── */}
          {step === "success" && confirmedBooking && selectedSlot && (
            <div className="flex flex-col items-center text-center gap-4 py-2 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-8 h-8 text-emerald-600 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Appointment Confirmed!</h3>
                <p className="text-slate-500 text-xs mt-1">
                  Your appointment with <span className="font-semibold text-slate-700">{doctor.name}</span> has been saved to the database.
                </p>
              </div>

              {/* Verified Ticket Card */}
              <div className="w-full rounded-2xl p-5 text-left relative overflow-hidden border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 via-teal-50 to-white shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-800 opacity-70">
                      Confirmed Ticket Number
                    </p>
                    <p className="text-5xl font-black text-emerald-700 leading-none mt-1">
                      #{confirmedBooking.queueNumber}
                    </p>
                  </div>
                  <Ticket className="w-10 h-10 text-emerald-400 stroke-1" />
                </div>

                <div className="space-y-1 text-xs text-slate-700 pt-2 border-t border-emerald-100/80">
                  <p className="font-semibold text-slate-900">
                    🏥 {selectedSlot.branchName}
                  </p>
                  <p>📅 {formatDate(confirmedBooking.date)}</p>
                  <p>⏰ {formatTime(confirmedBooking.startTime)} – {formatTime(confirmedBooking.endTime)}</p>
                  <p>📋 Visit Type: <span className="font-medium text-slate-800">{visitType}</span></p>
                  <p className="text-[11px] text-slate-500 font-mono pt-1">
                    Booking Ref: {confirmedBooking.appointmentId}
                  </p>
                </div>
              </div>

              <Button
                type="button"
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
