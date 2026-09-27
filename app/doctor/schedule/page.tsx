"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCurrentUser, useRole } from "@/lib/stores/authStore";
import { useAppointmentStore } from "@/lib/stores/appointmentStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/catms/StatusPill";
import { SessionBadge } from "@/components/catms/SessionBadge";
import { SESSION_META } from "@/lib/constants";;
import { Clock, Calendar as CalendarIcon, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const TIME_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

export default function MySchedulePage() {
  const user = useCurrentUser();
  const role = useRole();
  const { appointments, updateAppointment } = useAppointmentStore();

  if (!user || role !== "doctor") return null;

  const todayStr = new Date().toDateString();
  const myAppointments = appointments
    .filter(a =>
      a.doctorId === user.userId &&
      new Date(a.dateTime).toDateString() === todayStr &&
      ["Confirmed", "Checked-in", "In-Progress"].includes(a.status)
    )
    .sort((a, b) => a.dateTime.localeCompare(b.dateTime));

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Schedule</h2>
          <p className="text-slate-500">Your personal daily agenda and booked appointments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-slate-200 shadow-sm bg-blue-50/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                {/* Diamond Date CSS Shape */}
                <div className="w-16 h-16 bg-[var(--brand-primary)] text-white flex flex-col items-center justify-center shrink-0 shadow-md"
                  style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}>
                  <span className="text-xl font-black leading-none mt-1">{new Date().getDate()}</span>
                  <span className="text-[10px] font-semibold uppercase">{new Date().toLocaleString('default', { month: 'short' })}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Today's Overview</h3>
                  <p className="text-sm text-slate-600">{myAppointments.length} scheduled visits</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-sm font-semibold text-slate-900">Patient Queue</CardTitle>
            </CardHeader>
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto custom-scrollbar">
              {myAppointments.map(appt => (
                <div key={appt.appointmentId} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-slate-900">{appt.patientName}</p>
                    {appt.session && <SessionBadge session={appt.session} ticketNumber={appt.ticketNumber} variant="compact" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={appt.status} />
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{appt.visitType}</span>
                  </div>
                </div>
              ))}
              {myAppointments.length === 0 && (
                <div className="p-6 text-center text-slate-500 text-sm">No patients queued for today.</div>
              )}
            </div>
          </Card>
        </div>

        {/* Daily Time Grid */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200 shadow-sm h-full">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" /> Agenda View
              </CardTitle>
            </CardHeader>
            <div className="p-4 space-y-2">
              {TIME_SLOTS.map(time => {
                const hourNum = parseInt(time.split(":")[0], 10);
                const slotAppts = myAppointments.filter(
                  a => new Date(a.dateTime).getHours() === hourNum
                );

                return (
                  <div key={time} className="flex gap-4 group">
                    <div className="w-16 text-right shrink-0 py-3">
                      <span className="text-sm font-semibold text-slate-400 group-hover:text-slate-600 transition-colors">{time}</span>
                    </div>
                    <div className="flex-1 relative">
                      {/* Timeline line */}
                      <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-100 group-hover:bg-slate-200 transition-colors" />
                      
                      {slotAppts.length > 0 ? slotAppts.map(slotAppt => (
                        <div key={slotAppt.appointmentId} className="ml-4 my-1 p-4 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 transition-colors relative">
                          {/* CSS Indicator shape */}
                          <div className="absolute -left-[21px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-blue-500 shadow-[0_0_0_4px_white]" 
                            style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
                          
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-slate-900">{slotAppt.patientName}</h4>
                            <StatusPill status={slotAppt.status} />
                          </div>
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            {slotAppt.session && <SessionBadge session={slotAppt.session} ticketNumber={slotAppt.ticketNumber} variant="full" />}
                            <span className="text-xs text-slate-500">{slotAppt.visitType}</span>
                          </div>
                          <div className="flex gap-2">
                            <Link
                              href={`/doctor/consultations/${slotAppt.appointmentId}`}
                              onClick={() => {
                                if (slotAppt.status !== "In-Progress")
                                  updateAppointment(slotAppt.appointmentId, { status: "In-Progress" });
                              }}
                              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] px-3 py-1.5 rounded-lg"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              {slotAppt.status === "In-Progress" ? "Resume Consult" : "Start Consult"}
                            </Link>
                          </div>
                        </div>
                      )) : (
                        <div className="ml-4 h-full border-t border-slate-50 flex items-center">
                          {/* CSS Indicator shape for empty slot */}
                          <div className="absolute -left-[19px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-slate-200 shadow-[0_0_0_4px_white]" 
                            style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}