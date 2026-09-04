"use client";

import React, { useState } from "react";
import { doctors } from "@/lib/mockData/doctors";
import { Doctor } from "@/lib/mockData/doctors";
import { useRole } from "@/lib/stores/authStore";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Star, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

// Deterministic mock availability: seeded per doctor
function isSlotAvailable(doctorId: string, day: string, time: string): boolean {
  const seed = (doctorId + day + time).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return seed % 3 !== 0; // ~66% available
}

export default function DoctorSchedulesPage() {
  const role = useRole();
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(doctors[0]);
  const [selectedDay, setSelectedDay] = useState("Monday");

  if (!role) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Doctor Schedules</h2>
        <p className="text-slate-500">View availability and time slots for all doctors.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Doctor List Panel */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1 mb-3">Select Doctor</p>
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
                {/* Hexagon shape avatar */}
                <div className={cn(
                  "w-10 h-10 flex items-center justify-center text-xs font-bold shrink-0",
                  selectedDoctor?.doctorId === doc.doctorId ? "bg-white/30 text-white" : "bg-slate-100 text-slate-700"
                )} style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                  {doc.name.replace("Dr. ", "").split(" ").map((n: string) => n[0]).join("")}
                </div>
                <div className="min-w-0">
                  <p className={cn("text-sm font-semibold truncate", selectedDoctor?.doctorId === doc.doctorId ? "text-white" : "text-slate-900")}>
                    {doc.name}
                  </p>
                  <p className={cn("text-xs truncate", selectedDoctor?.doctorId === doc.doctorId ? "text-white/70" : "text-slate-500")}>
                    {doc.specialization}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="lg:col-span-3 space-y-4">
          {selectedDoctor && (
            <>
              {/* Doctor Header */}
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)]" />
                <CardContent className="p-5 flex items-center gap-5">
                  <div className="w-16 h-16 bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold shrink-0"
                    style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" }}>
                    {selectedDoctor.name.replace("Dr. ", "").split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">{selectedDoctor.name}</h3>
                    <p className="text-[var(--brand-primary)] font-semibold text-sm">{selectedDoctor.specialization}</p>
                  </div>
                  <div className="text-right hidden md:block">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-4 h-4 fill-amber-500" /> {selectedDoctor.rating}
                    </div>
                    <p className="text-xs text-slate-500">{selectedDoctor.reviewCount} reviews</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">${selectedDoctor.consultationFee} / visit</p>
                  </div>
                </CardContent>
              </Card>

              {/* Day Selector */}
              <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                {DAYS.map(day => (
                  <button key={day} onClick={() => setSelectedDay(day)}
                    className={cn("px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all",
                      selectedDay === day ? "bg-[var(--brand-primary)] text-white shadow-md" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}>
                    {day}
                  </button>
                ))}
              </div>

              {/* Time Slots Grid */}
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <p className="text-sm font-semibold text-slate-500 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> {selectedDay} — Available Slots
                  </p>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {TIME_SLOTS.map(time => {
                      const available = isSlotAvailable(selectedDoctor.doctorId, selectedDay, time);
                      return (
                        <button
                          key={time}
                          disabled={!available}
                          className={cn(
                            "relative flex flex-col items-center justify-center h-20 rounded-xl border-2 text-sm font-semibold transition-all",
                            available
                              ? "border-[var(--brand-primary)] bg-blue-50/50 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white hover:shadow-md cursor-pointer"
                              : "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                          )}
                        >
                          {/* CSS shape indicator in corner */}
                          <div
                            className={cn("absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center",
                              available ? "bg-green-100" : "bg-red-50"
                            )}
                            style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
                          />
                          <span className="text-base">{time}</span>
                          <span className="text-[10px] font-medium mt-1 opacity-70">{available ? "Open" : "Booked"}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex items-center gap-6 text-xs text-slate-500">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-100 rounded" /> Available
                    </span>
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-slate-100 rounded" /> Booked
                    </span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
