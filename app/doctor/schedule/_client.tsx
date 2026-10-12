"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/catms/StatusPill";
import { EmptyState } from "@/components/catms/EmptyState";
import { StartConsultationButton } from "@/components/doctor/StartConsultationButton";
import { formatClockTime, formatDay, shiftDay } from "@/lib/doctorFormat";
import type { Appointment, DayOfWeek, DoctorScheduleSlot } from "@/lib/types";
import { Clock, User, ChevronLeft, ChevronRight, CalendarX, MapPin } from "lucide-react";
import Link from "next/link";

const DAY_NAMES: DayOfWeek[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface ScheduleProps {
  date: string;  // the day being viewed, "YYYY-MM-DD"
  today: string;
  appointments: Appointment[];
  weeklyHours: DoctorScheduleSlot[];
}
export default function MySchedulePage({ date, today, appointments, weeklyHours }: ScheduleProps) {
  const weekday = DAY_NAMES[new Date(`${date}T00:00:00Z`).getUTCDay()];
  const workingHours = weeklyHours
    .filter((s) => s.dayOfWeek === weekday)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const [dayNumber, monthName] = [Number(date.slice(8, 10)), formatDay(date).split(" ")[1]];

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Schedule</h2>
          <p className="text-slate-500">Your daily agenda and booked appointments.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/doctor/schedule?date=${shiftDay(date, -1)}`} aria-label="Previous day">
            <Button variant="outline" size="sm" className="rounded-lg h-9 w-9 p-0">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/doctor/schedule">
            <Button variant="outline" size="sm" className="rounded-lg h-9" disabled={date === today}>
              Today
            </Button>
          </Link>
          <Link href={`/doctor/schedule?date=${shiftDay(date, 1)}`} aria-label="Next day">
            <Button variant="outline" size="sm" className="rounded-lg h-9 w-9 p-0">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-slate-200 shadow-sm bg-blue-50/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 bg-[var(--brand-primary)] text-white flex flex-col items-center justify-center shrink-0 shadow-md"
                  style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
                >
                  <span className="text-xl font-black leading-none mt-1">{dayNumber}</span>
                  <span className="text-[10px] font-semibold uppercase">{monthName}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{weekday}</h3>
                  <p className="text-sm text-slate-600">
                    {appointments.length} scheduled visit{appointments.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-sm font-semibold text-slate-900">Working Hours</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {workingHours.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">
                  No working hours set for {weekday}.{" "}
                  <Link href="/doctor/settings" className="font-semibold text-[var(--brand-primary)]">
                    Add hours
                  </Link>
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {workingHours.map((s) => (
                    <div key={s.scheduleId} className="p-4 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {s.startTime} – {s.endTime}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                        <MapPin className="w-3 h-3" /> {s.branchName}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-slate-200 shadow-sm h-full">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" /> Agenda — {formatDay(date)}
              </CardTitle>
            </CardHeader>
            {appointments.length === 0 ? (
              <EmptyState icon={CalendarX} title="No appointments" description="Nothing is booked for this day." className="py-16" />
            ) : (
              <div className="p-4 space-y-2">
                {appointments.map((appt) => (
                  <div key={appt.appointmentId} className="flex gap-4 group">
                    <div className="w-14 text-right shrink-0 py-4">
                      <span className="text-sm font-semibold text-slate-400 group-hover:text-slate-600 transition-colors">
                        {formatClockTime(appt.dateTime)}
                      </span>
                    </div>
                    <div className="flex-1 relative">
                      <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-100 group-hover:bg-slate-200 transition-colors" />
                      <div className="ml-4 my-1 p-4 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 transition-colors relative">
                        <div
                          className="absolute -left-[21px] top-6 w-2.5 h-2.5 bg-blue-500 shadow-[0_0_0_4px_white]"
                          style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
                        />
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 truncate">{appt.patientName}</h4>
                            <p className="text-xs text-slate-500">
                              Ticket #{appt.ticketNumber} • {appt.branchName} • {appt.visitType}
                            </p>
                          </div>
                          <StatusPill status={appt.status} />
                        </div>
                        {appt.notes && <p className="text-sm text-slate-600 mb-3">{appt.notes}</p>}
                        <div className="flex gap-2 items-start">
                          <Link
                            href={`/doctor/patients/${appt.patientId}`}
                            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-primary)] bg-white border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50"
                          >
                            <User className="w-3.5 h-3.5" /> View Patient
                          </Link>
                          {appt.status === "Completed" ? (
                            <Link
                              href={`/doctor/consultations/${appt.appointmentId}`}
                              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50"
                            >
                              View Record
                            </Link>
                          ) : appt.dateTime.slice(0, 10) > today ? (
                            <span className="text-xs font-semibold text-slate-400 px-3 py-1.5">
                              Consultation available on {formatDay(appt.dateTime.slice(0, 10))}
                            </span>
                          ) : (
                            <StartConsultationButton appointmentId={appt.appointmentId} status={appt.status} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
