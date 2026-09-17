"use client";

import React, { useState, useMemo, useEffect } from "react";
import type { Appointment, SessionType } from "@/lib/types";
import { SESSION_META } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { X, Calendar, Clock, AlertCircle, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { rescheduleAppointment, getSlotAvailability, type SlotAvailability } from "@/lib/actions/appointments";
import { getNextDays } from "@/components/catms/BookingModal";

const ALL_SESSIONS: SessionType[] = ["Morning", "Midday", "Afternoon", "Evening"];

export function RescheduleModal({
  appointment,
  onClose,
  onSuccess,
}: {
  appointment: Appointment;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const availableDays = useMemo(() => getNextDays(7), []);

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionType | null>(null);
  const [dbSlots, setDbSlots] = useState<SlotAvailability[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check hours remaining on current appointment
  const hoursRemaining = useMemo(() => {
    const apptTime = new Date(appointment.dateTime).getTime();
    return (apptTime - Date.now()) / (1000 * 60 * 60);
  }, [appointment.dateTime]);

  const isLocked = hoursRemaining < 24;

  const dayFmt = (d: Date) =>
    d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  useEffect(() => {
    if (!selectedDay) return;
    let active = true;
    const dateStr = selectedDay.toISOString().split("T")[0];
    getSlotAvailability(appointment.doctorId, dateStr)
      .then((res) => {
        if (active) setDbSlots(res);
      })
      .catch((err) => console.error("Failed to fetch slots:", err));
    return () => {
      active = false;
    };
  }, [appointment.doctorId, selectedDay]);

  async function handleReschedule() {
    if (!selectedDay || !selectedSession) return;
    setIsSubmitting(true);
    setError(null);

    const dateStr = selectedDay.toISOString().split("T")[0];

    const res = await rescheduleAppointment({
      appointmentId: appointment.appointmentId,
      date: dateStr,
      session: selectedSession,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setError(res.message);
      return;
    }

    if (onSuccess) onSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Reschedule Appointment</h2>
              <p className="text-white/80 text-xs">Doctor: {appointment.doctorName}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Locked Notice */}
          {isLocked ? (
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-900">Rescheduling Locked</p>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Appointments can only be rescheduled up to 24 hours prior to the appointment. This appointment is less than 24 hours away.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Current Appointment info */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Current Booking</p>
                <p className="text-sm font-bold text-slate-800">{appointment.doctorName}</p>
                <p className="text-xs text-slate-600">
                  📅 {new Date(appointment.dateTime).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })} · {appointment.session ?? "Morning"} Session
                </p>
              </div>

              {/* Day Selection */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2 tracking-wide">
                  Select New Date
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {availableDays.map((day) => {
                    const selected = selectedDay?.toDateString() === day.toDateString();
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => {
                          setSelectedDay(day);
                          setSelectedSession(null);
                        }}
                        className={cn(
                          "flex flex-col items-center py-2.5 px-1 rounded-xl border text-xs font-semibold transition-all",
                          selected
                            ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        )}
                      >
                        <span className="text-[10px] uppercase opacity-70">
                          {day.toLocaleDateString("en-US", { weekday: "short" })}
                        </span>
                        <span className="text-base font-bold leading-tight">{day.getDate()}</span>
                        <span className="text-[10px] opacity-70">
                          {day.toLocaleDateString("en-US", { month: "short" })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Session Selection */}
              {selectedDay && (
                <div className="space-y-2 animate-fade-in">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Select New Session — {dayFmt(selectedDay)}
                  </p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {ALL_SESSIONS.map((session) => {
                      const meta = SESSION_META[session];
                      const slotInfo = dbSlots.find((s) => s.session === session);
                      const maxTickets = slotInfo?.maxTickets ?? 4;
                      const booked = slotInfo?.currentCount ?? 0;
                      const isFull = slotInfo?.isFull ?? false;
                      const isSelected = selectedSession === session;

                      return (
                        <button
                          key={session}
                          disabled={isFull}
                          onClick={() => setSelectedSession(session)}
                          className={cn(
                            "w-full rounded-2xl border-2 p-3.5 text-left transition-all flex items-center justify-between",
                            isFull
                              ? "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
                              : isSelected
                              ? "border-[var(--brand-primary)] bg-teal-50/50 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{meta?.emoji}</span>
                            <div>
                              <p className="font-bold text-sm text-slate-800">{session}</p>
                              <p className="text-xs text-slate-500">{meta?.timeRange}</p>
                            </div>
                          </div>
                          {isFull ? (
                            <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                              Full
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-600">
                              🎫 {booked} / {maxTickets}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl h-11 border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  disabled={!selectedDay || !selectedSession || isSubmitting}
                  onClick={handleReschedule}
                  className="flex-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl h-11 font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Rescheduling...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-1.5" />
                      Confirm Reschedule
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
