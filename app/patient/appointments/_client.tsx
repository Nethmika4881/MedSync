"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  PatientAppointmentHistoryItem,
} from "@/lib/actions/patient-appointments";
import {
  reschedulePatientAppointment,
  getPatientAppointments,
} from "@/lib/actions/patient-appointments";
import {
  getDoctorBookableSlots,
  type BookableSlot,
} from "@/lib/actions/patient-booking";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Ticket,
  RefreshCw,
  Loader2,
  ArrowRight,
  Lock,
} from "lucide-react";
import { cn, getSpecialtyGradient } from "@/lib/utils";

type TabFilter = "upcoming" | "completed" | "cancelled" | "all";

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
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "Scheduled":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
          Scheduled
        </span>
      );
    case "CheckedIn":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          Checked In
        </span>
      );
    case "InProgress":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
          In Consultation
        </span>
      );
    case "Completed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Completed
        </span>
      );
    case "Cancelled":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-500" />
          Cancelled
        </span>
      );
    case "NoShow":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          No Show
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          {status}
        </span>
      );
  }
}

// ── Reschedule Modal Component ────────────────────────────────────────────────

interface RescheduleModalProps {
  appointment: PatientAppointmentHistoryItem;
  onClose: () => void;
  onSuccess: (updated: {
    appointmentId: string;
    queueNumber: number;
    newTimeSlotId: string;
    date: string;
    startTime: string;
    endTime: string;
  }) => void;
}

function RescheduleModal({ appointment, onClose, onSuccess }: RescheduleModalProps) {
  const [slots, setSlots] = useState<BookableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [rescheduleResult, setRescheduleResult] = useState<{
    queueNumber: number;
    date: string;
    startTime: string;
    endTime: string;
  } | null>(null);

  const loadSlots = useCallback(async () => {
    setLoadingSlots(true);
    setSlotsError(null);
    try {
      const data = await getDoctorBookableSlots(appointment.doctorId);
      // Filter out the current appointment slot
      const otherSlots = data.filter((s) => s.timeSlotId !== appointment.timeSlotId);
      setSlots(otherSlots);

      if (otherSlots.length > 0) {
        setSelectedDate(otherSlots[0].date);
      }
    } catch (err) {
      console.error("[RescheduleModal] Failed to load slots:", err);
      setSlotsError("Unable to retrieve open doctor sessions. Please try again.");
    } finally {
      setLoadingSlots(false);
    }
  }, [appointment.doctorId, appointment.timeSlotId]);

  React.useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const uniqueDates = useMemo(() => {
    const dates = Array.from(new Set(slots.map((s) => s.date)));
    return dates.sort();
  }, [slots]);

  const slotsForDate = useMemo(() => {
    if (!selectedDate) return [];
    return slots.filter((s) => s.date === selectedDate);
  }, [slots, selectedDate]);

  async function handleConfirmMove() {
    if (!selectedSlot) {
      setSubmitError("Please select a new time slot.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await reschedulePatientAppointment({
        appointmentId: appointment.appointmentId,
        newTimeSlotId: selectedSlot.timeSlotId,
      });

      if (res.success) {
        setRescheduleResult({
          queueNumber: res.data.queueNumber,
          date: res.data.date,
          startTime: res.data.startTime,
          endTime: res.data.endTime,
        });
        onSuccess(res.data);
      } else {
        if (res.code === "TOO_LATE") {
          setSubmitError(
            "Appointments can only be rescheduled at least 24 hours in advance."
          );
        } else if (res.code === "NO_CAPACITY" || res.code === "CONCURRENT_CONFLICT") {
          setSubmitError(
            "This slot just filled up or conflicted with another reservation. Please pick another session."
          );
          loadSlots();
        } else {
          setSubmitError(res.error || "Unable to reschedule appointment.");
        }
      }
    } catch (err) {
      console.error("[RescheduleModal] Execution error:", err);
      setSubmitError("A connection error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const gradient = getSpecialtyGradient(appointment.doctorSpecialization);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isSubmitting ? undefined : onClose}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className={`bg-gradient-to-r ${gradient} p-6 text-white shrink-0`}>
          <button
            onClick={isSubmitting ? undefined : onClose}
            disabled={isSubmitting}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-lg text-white shadow-inner">
              {appointment.doctorName.replace(/[0-9]/g, "").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Reschedule Appointment</h3>
              <p className="text-white/80 text-xs mt-0.5">
                {appointment.doctorName} · {appointment.doctorSpecialization}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {rescheduleResult ? (
            /* Success confirmation */
            <div className="text-center py-4 space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">Rescheduled Successfully!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Your appointment has been updated in the hospital system.
                </p>
              </div>

              <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase text-emerald-800 tracking-wider">
                    New Ticket Number
                  </span>
                  <Ticket className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-4xl font-black text-emerald-700">
                  #{rescheduleResult.queueNumber}
                </p>
                <div className="text-xs text-slate-700 pt-2 border-t border-emerald-200/60 space-y-1">
                  <p>📅 {formatDate(rescheduleResult.date)}</p>
                  <p>⏰ {formatTime(rescheduleResult.startTime)} – {formatTime(rescheduleResult.endTime)}</p>
                  <p>🏥 {appointment.branchName}</p>
                </div>
              </div>

              <Button
                onClick={onClose}
                className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl h-11 font-semibold"
              >
                Done
              </Button>
            </div>
          ) : (
            <>
              {/* Existing appointment info */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Current Schedule</span>
                  <span className="font-mono">Ticket #{appointment.queueNumber}</span>
                </div>
                <p className="font-bold text-slate-800">
                  📅 {formatDate(appointment.date)} · {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                </p>
                <p className="text-slate-600">🏥 {appointment.branchName}</p>
              </div>

              {submitError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <p className="font-medium">{submitError}</p>
                </div>
              )}

              {loadingSlots ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-center">
                  <Loader2 className="w-7 h-7 animate-spin text-[var(--brand-primary)]" />
                  <p className="text-xs text-slate-500 font-medium">
                    Loading open doctor sessions...
                  </p>
                </div>
              ) : slotsError ? (
                <div className="py-6 text-center bg-rose-50 rounded-xl p-4 space-y-2">
                  <p className="text-xs text-rose-700 font-semibold">{slotsError}</p>
                  <Button
                    onClick={loadSlots}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs rounded-lg"
                  >
                    Retry
                  </Button>
                </div>
              ) : uniqueDates.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-2">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No Alternative Sessions</p>
                  <p className="text-xs text-slate-500">
                    This doctor has no other scheduled open sessions available at this time.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Select New Date
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {uniqueDates.map((dateStr) => {
                        const isSelected = selectedDate === dateStr;
                        const dateSlots = slots.filter((s) => s.date === dateStr);
                        const hasCapacity = dateSlots.some((s) => s.remainingCapacity > 0);

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
                              "flex flex-col items-center py-2 px-3 rounded-xl border text-xs font-semibold transition-all shrink-0 min-w-[70px]",
                              isSelected
                                ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white shadow-md"
                                : hasCapacity
                                ? "border-slate-200 bg-white text-slate-700 hover:border-[var(--brand-primary)]"
                                : "border-slate-100 bg-slate-50 text-slate-300 opacity-60"
                            )}
                          >
                            <span className="text-[10px] uppercase opacity-80">
                              {new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
                                weekday: "short",
                              })}
                            </span>
                            <span className="text-sm font-bold my-0.5">
                              {new Date(dateStr + "T00:00:00").getDate()}
                            </span>
                            <span className="text-[10px] opacity-80">
                              {new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
                                month: "short",
                              })}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Available Sessions
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {slotsForDate.map((slot) => {
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
                              "w-full text-left p-3 rounded-xl border text-xs flex items-center justify-between transition-all",
                              isFull
                                ? "border-slate-100 bg-slate-50 text-slate-400 opacity-50 cursor-not-allowed"
                                : isSelected
                                ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/5 ring-1 ring-[var(--brand-primary)] text-slate-900"
                                : "border-slate-200 bg-white hover:border-[var(--brand-primary)] text-slate-700"
                            )}
                          >
                            <div>
                              <p className="font-bold">
                                {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                              </p>
                              <p className="text-[11px] text-slate-500">{slot.branchName}</p>
                            </div>
                            <div className="text-right">
                              {isFull ? (
                                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                                  Full
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  {slot.remainingCapacity} left
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <Button
                      variant="outline"
                      type="button"
                      disabled={isSubmitting}
                      onClick={onClose}
                      className="flex-1 rounded-xl h-10 border-slate-200 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      disabled={!selectedSlot || isSubmitting}
                      onClick={handleConfirmMove}
                      className="flex-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl h-10 font-semibold text-xs flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Rescheduling...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirm Reschedule</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────

interface Props {
  user: {
    userId: string;
    name: string;
    role: string;
  };
  initialAppointments: PatientAppointmentHistoryItem[];
}

export default function PatientAppointmentsClient({
  initialAppointments,
}: Props) {
  const router = useRouter();
  const [appointments, setAppointments] =
    useState<PatientAppointmentHistoryItem[]>(initialAppointments);
  const [tab, setTab] = useState<TabFilter>("upcoming");
  const [search, setSearch] = useState("");
  const [reschedulingAppointment, setReschedulingAppointment] =
    useState<PatientAppointmentHistoryItem | null>(null);

  const refreshList = useCallback(async () => {
    try {
      const data = await getPatientAppointments();
      setAppointments(data);
      router.refresh();
    } catch (err) {
      console.error("[PatientAppointmentsClient] Refresh failed:", err);
    }
  }, [router]);

  // Tab counters
  const counts = useMemo(() => {
    const upcoming = appointments.filter((a) =>
      ["Scheduled", "CheckedIn", "InProgress"].includes(a.status)
    ).length;
    const completed = appointments.filter((a) => a.status === "Completed").length;
    const cancelled = appointments.filter((a) => a.status === "Cancelled").length;
    return {
      upcoming,
      completed,
      cancelled,
      all: appointments.length,
    };
  }, [appointments]);

  // Filtered list
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      // Tab filter
      let matchesTab = true;
      if (tab === "upcoming") {
        matchesTab = ["Scheduled", "CheckedIn", "InProgress"].includes(a.status);
      } else if (tab === "completed") {
        matchesTab = a.status === "Completed";
      } else if (tab === "cancelled") {
        matchesTab = a.status === "Cancelled";
      }

      if (!matchesTab) return false;

      // Search filter
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        a.doctorName.toLowerCase().includes(q) ||
        a.doctorSpecialization.toLowerCase().includes(q) ||
        a.branchName.toLowerCase().includes(q) ||
        (a.reasonForVisit && a.reasonForVisit.toLowerCase().includes(q))
      );
    });
  }, [appointments, tab, search]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Appointments
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            View your upcoming schedule, past consultations, and verified tickets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshList}
            className="rounded-xl border-slate-200 gap-1.5 h-9 text-xs text-slate-600"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <Link href="/patient/find-doctors">
            <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl gap-1.5 h-9 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              Book New Visit
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setTab("upcoming")}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5",
              tab === "upcoming"
                ? "bg-[var(--brand-primary)] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <span>Upcoming</span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px]",
                tab === "upcoming"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200/80 text-slate-700"
              )}
            >
              {counts.upcoming}
            </span>
          </button>

          <button
            onClick={() => setTab("completed")}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5",
              tab === "completed"
                ? "bg-[var(--brand-primary)] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <span>Completed</span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px]",
                tab === "completed"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200/80 text-slate-700"
              )}
            >
              {counts.completed}
            </span>
          </button>

          <button
            onClick={() => setTab("cancelled")}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5",
              tab === "cancelled"
                ? "bg-[var(--brand-primary)] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <span>Cancelled</span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px]",
                tab === "cancelled"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200/80 text-slate-700"
              )}
            >
              {counts.cancelled}
            </span>
          </button>

          <button
            onClick={() => setTab("all")}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5",
              tab === "all"
                ? "bg-[var(--brand-primary)] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <span>All</span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px]",
                tab === "all"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200/80 text-slate-700"
              )}
            >
              {counts.all}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search appointments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[var(--brand-primary)] transition-all"
          />
        </div>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Calendar className="w-8 h-8 stroke-1" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">
            No {tab === "all" ? "" : tab} appointments found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {tab === "upcoming"
              ? "You have no scheduled appointments. Browse specialists and book a consultation online."
              : "No appointment records match your current filter."}
          </p>
          {tab === "upcoming" && (
            <Link href="/patient/find-doctors" className="inline-block pt-2">
              <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl text-xs h-9 font-semibold">
                Find a Doctor
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAppointments.map((appt) => {
            const gradient = getSpecialtyGradient(appt.doctorSpecialization);

            return (
              <div
                key={appt.appointmentId}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar with Status and Ticket Number */}
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
                    <StatusBadge status={appt.status} />
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-lg">
                      <Ticket className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ticket #{appt.queueNumber}</span>
                    </div>
                  </div>

                  {/* Doctor Info */}
                  <div className="p-4 flex items-start gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm`}
                    >
                      {appt.doctorName.replace(/[0-9]/g, "").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">
                        {appt.doctorName}
                      </h4>
                      <p className="text-xs text-[var(--brand-primary)] font-medium mt-0.5">
                        {appt.doctorSpecialization}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{appt.branchName}</span>
                      </p>
                    </div>
                  </div>

                  {/* Schedule Pills */}
                  <div className="px-4 pb-3 space-y-2">
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium">{formatDate(appt.date)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium">
                          {formatTime(appt.startTime)} – {formatTime(appt.endTime)}
                        </span>
                      </div>
                    </div>

                    {appt.reasonForVisit && (
                      <p className="text-xs text-slate-600 bg-slate-50/50 p-2 rounded-lg border border-slate-100 line-clamp-2">
                        <span className="font-semibold text-slate-700">Visit Reason: </span>
                        {appt.reasonForVisit}
                      </p>
                    )}

                    {appt.cancelledReason && (
                      <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-100">
                        <span className="font-semibold">Cancellation Reason: </span>
                        {appt.cancelledReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Actions (Reschedule if Scheduled) */}
                <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between text-xs mt-2">
                  <span className="text-slate-400 text-[11px] font-mono">
                    Ref: {appt.appointmentId.slice(0, 8)}...
                  </span>

                  {/* Reschedule Button or Cutoff Notice (Only for Scheduled appointments) */}
                  {appt.status === "Scheduled" && (
                    <div>
                      {appt.isReschedulable ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReschedulingAppointment(appt)}
                          className="h-8 px-3 rounded-xl border-slate-200 text-xs text-[var(--brand-primary)] hover:bg-slate-50 font-semibold gap-1.5"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          Reschedule
                        </Button>
                      ) : (
                        <div
                          title="Appointments cannot be rescheduled within 24 hours of scheduled time"
                          className="flex items-center gap-1 text-[11px] text-slate-400 font-medium px-2 py-1 rounded-lg bg-slate-50"
                        >
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>Within 24h cutoff</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingAppointment && (
        <RescheduleModal
          appointment={reschedulingAppointment}
          onClose={() => setReschedulingAppointment(null)}
          onSuccess={() => {
            refreshList();
          }}
        />
      )}
    </div>
  );
}
