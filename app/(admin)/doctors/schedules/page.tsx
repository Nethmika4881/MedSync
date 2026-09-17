"use client";

import React, { useState } from "react";
import { doctors } from "@/lib/constants";;
import type { Doctor } from "@/lib/types";
import {   } from "@/lib/constants";;
import { useRole } from "@/lib/stores/authStore";
import { useAppointmentStore } from "@/lib/stores/appointmentStore";
import { useSessionConfigStore } from "@/lib/stores/sessionConfigStore";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ToggleLeft, ToggleRight, Settings2, Users, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SESSION_META, SessionType } from "@/lib/constants";;

const ALL_SESSIONS: SessionType[] = ["Morning", "Midday", "Afternoon", "Evening"];

const SESSION_GRADIENT: Record<SessionType, string> = {
  Morning:   "from-amber-400  to-orange-400",
  Midday:    "from-sky-400    to-blue-500",
  Afternoon: "from-teal-400   to-emerald-500",
  Evening:   "from-indigo-400 to-violet-500",
};

const SESSION_CARD_BG: Record<SessionType, string> = {
  Morning:   "bg-amber-50  border-amber-200",
  Midday:    "bg-sky-50    border-sky-200",
  Afternoon: "bg-teal-50   border-teal-200",
  Evening:   "bg-indigo-50 border-indigo-200",
};

const SESSION_TEXT: Record<SessionType, string> = {
  Morning:   "text-amber-700",
  Midday:    "text-sky-700",
  Afternoon: "text-teal-700",
  Evening:   "text-indigo-700",
};

export default function DoctorSchedulesPage() {
  const role = useRole();
  const { appointments } = useAppointmentStore();
  const { configs, updateConfig, toggleSession } = useSessionConfigStore();
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(doctors[0]);
  /** Inline-edit buffer: doctorId-session → new value */
  const [editBuffer, setEditBuffer] = useState<Record<string, string>>({});

  if (!role) return null;

  const today = new Date().toDateString();

  /** How many non-cancelled appointments exist for a doctor × session × today */
  function getTodayCount(doctorId: string, session: SessionType): number {
    return appointments.filter(
      (a) =>
        a.doctorId === doctorId &&
        a.session === session &&
        new Date(a.dateTime).toDateString() === today &&
        a.status !== "Cancelled"
    ).length;
  }

  /** Upcoming 7-day count for a doctor × session */
  function getUpcomingCount(doctorId: string, session: SessionType): number {
    const now = new Date();
    const in7 = new Date();
    in7.setDate(now.getDate() + 7);
    return appointments.filter(
      (a) =>
        a.doctorId === doctorId &&
        a.session === session &&
        new Date(a.dateTime) >= now &&
        new Date(a.dateTime) <= in7 &&
        a.status !== "Cancelled"
    ).length;
  }

  function getConfig(doctorId: string, session: SessionType) {
    return configs.find((c) => c.doctorId === doctorId && c.session === session);
  }

  const editKey = (doctorId: string, session: SessionType) => `${doctorId}-${session}`;

  function commitEdit(doctorId: string, session: SessionType) {
    const key = editKey(doctorId, session);
    const raw = editBuffer[key];
    if (raw === undefined) return;
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 50) {
      updateConfig(doctorId, session, parsed);
    }
    setEditBuffer((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Session Capacity Manager</h2>
        <p className="text-slate-500">
          Configure per-session ticket limits and availability for each doctor.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Doctor List Panel */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1 mb-3">
            Select Doctor
          </p>
          <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
            {doctors.map((doc: Doctor) => (
              <button
                key={doc.doctorId}
                onClick={() => setSelectedDoctor(doc)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                  selectedDoctor?.doctorId === doc.doctorId
                    ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-md"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 flex items-center justify-center text-xs font-bold shrink-0",
                    selectedDoctor?.doctorId === doc.doctorId
                      ? "bg-white/30 text-white"
                      : "bg-slate-100 text-slate-700"
                  )}
                  style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
                >
                  {doc.name
                    .replace("Dr. ", "")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm font-semibold truncate",
                      selectedDoctor?.doctorId === doc.doctorId ? "text-white" : "text-slate-900"
                    )}
                  >
                    {doc.name}
                  </p>
                  <p
                    className={cn(
                      "text-xs truncate",
                      selectedDoctor?.doctorId === doc.doctorId ? "text-white/70" : "text-slate-500"
                    )}
                  >
                    {doc.specialization}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Panel */}
        <div className="lg:col-span-3 space-y-4">
          {selectedDoctor && (
            <>
              {/* Doctor Header */}
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)]" />
                <CardContent className="p-5 flex items-center gap-5">
                  <div
                    className="w-16 h-16 bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold shrink-0"
                    style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" }}
                  >
                    {selectedDoctor.name
                      .replace("Dr. ", "")
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">{selectedDoctor.name}</h3>
                    <p className="text-[var(--brand-primary)] font-semibold text-sm">
                      {selectedDoctor.specialization}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedDoctor.branchName}</p>
                  </div>
                  <div className="text-right hidden md:block">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-4 h-4 fill-amber-500" /> {selectedDoctor.rating}
                    </div>
                    <p className="text-xs text-slate-500">{selectedDoctor.reviewCount} reviews</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      ${selectedDoctor.consultationFee} / visit
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs text-slate-500 px-1">
                <span className="flex items-center gap-1.5">
                  <Settings2 className="w-3.5 h-3.5" /> Max tickets = admin-set cap per session
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Booked = non-cancelled appointments
                </span>
              </div>

              {/* Session capacity cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ALL_SESSIONS.map((session) => {
                  const meta = SESSION_META[session];
                  const config = getConfig(selectedDoctor.doctorId, session);
                  const maxTickets = config?.maxTickets ?? 12;
                  const isEnabled = config?.isEnabled ?? true;
                  const todayCount = getTodayCount(selectedDoctor.doctorId, session);
                  const upcomingCount = getUpcomingCount(selectedDoctor.doctorId, session);
                  const todayPct = Math.min((todayCount / maxTickets) * 100, 100);
                  const key = editKey(selectedDoctor.doctorId, session);
                  const editing = editBuffer[key] !== undefined;
                  const bufferVal = editBuffer[key] ?? String(maxTickets);

                  const progressColor =
                    todayPct >= 90 ? "bg-rose-400" : todayPct >= 60 ? "bg-amber-400" : "bg-emerald-400";

                  return (
                    <Card
                      key={session}
                      className={cn(
                        "border-2 shadow-sm transition-all",
                        isEnabled ? SESSION_CARD_BG[session] : "border-slate-200 bg-slate-50 opacity-60"
                      )}
                    >
                      <CardContent className="p-5 space-y-4">
                        {/* Session header row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{meta.emoji}</span>
                            <div>
                              <p className={cn("font-bold text-sm", SESSION_TEXT[session])}>
                                {meta.label}
                              </p>
                              <p className="text-xs text-slate-500">{meta.timeRange}</p>
                            </div>
                          </div>
                          {/* Toggle */}
                          <button
                            onClick={() =>
                              toggleSession(selectedDoctor.doctorId, session, !isEnabled)
                            }
                            className="transition-transform hover:scale-105"
                            title={isEnabled ? "Disable session" : "Enable session"}
                          >
                            {isEnabled ? (
                              <ToggleRight
                                className={cn("w-8 h-8", SESSION_TEXT[session])}
                              />
                            ) : (
                              <ToggleLeft className="w-8 h-8 text-slate-400" />
                            )}
                          </button>
                        </div>

                        {/* Today capacity progress */}
                        <div>
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span>Today's bookings</span>
                            <span className="font-semibold">
                              {todayCount} / {maxTickets}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all", progressColor)}
                              style={{ width: `${todayPct}%` }}
                            />
                          </div>
                          {todayPct >= 90 && (
                            <p className="text-[10px] text-rose-500 flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3 h-3" /> Nearly full today
                            </p>
                          )}
                        </div>

                        {/* Upcoming 7-day stat */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Next 7 days</span>
                          <span className="font-semibold text-slate-700">
                            {upcomingCount} booked
                          </span>
                        </div>

                        {/* Max Tickets Inline Editor */}
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                            Max Tickets / Session
                          </label>
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "flex items-center gap-1 rounded-xl border-2 overflow-hidden bg-white",
                                editing
                                  ? "border-[var(--brand-primary)]"
                                  : "border-slate-200"
                              )}
                            >
                              <button
                                className="px-3 py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors font-bold text-base"
                                onClick={() => {
                                  const cur = parseInt(bufferVal, 10) || maxTickets;
                                  if (cur > 1) {
                                    setEditBuffer((p) => ({ ...p, [key]: String(cur - 1) }));
                                  }
                                }}
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={50}
                                value={bufferVal}
                                onChange={(e) =>
                                  setEditBuffer((p) => ({ ...p, [key]: e.target.value }))
                                }
                                onBlur={() => commitEdit(selectedDoctor.doctorId, session)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") commitEdit(selectedDoctor.doctorId, session);
                                  if (e.key === "Escape") {
                                    setEditBuffer((p) => {
                                      const n = { ...p }; delete n[key]; return n;
                                    });
                                  }
                                }}
                                className="w-14 text-center text-sm font-bold py-2 focus:outline-none text-slate-800 bg-transparent"
                              />
                              <button
                                className="px-3 py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors font-bold text-base"
                                onClick={() => {
                                  const cur = parseInt(bufferVal, 10) || maxTickets;
                                  if (cur < 50) {
                                    setEditBuffer((p) => ({ ...p, [key]: String(cur + 1) }));
                                  }
                                }}
                              >
                                +
                              </button>
                            </div>
                            {editing && (
                              <button
                                onClick={() => commitEdit(selectedDoctor.doctorId, session)}
                                className="px-3 py-2 rounded-xl bg-[var(--brand-primary)] text-white text-xs font-semibold hover:bg-[var(--brand-primary-dark)] transition-colors"
                              >
                                Save
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Range: 1–50 tickets. Changes apply immediately.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
