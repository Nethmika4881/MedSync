"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Users, Clock, CheckCircle2, Stethoscope, Eye } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/catms/StatusPill";
import { EmptyState } from "@/components/catms/EmptyState";
import { StartConsultationButton } from "@/components/doctor/StartConsultationButton";
import { formatClockTime, formatDay, shiftDay } from "@/lib/doctorFormat";
import type { AuthUser, Appointment } from "@/lib/types";
import { Button } from "@/components/ui/button";

type MetricKey = "today" | "waiting" | "inProgress" | "completed";

interface DashboardProps {
  user: AuthUser;
  today: string;
  appointments: Appointment[]; // today and the following six days
  unfinished: Appointment[]; // started on an earlier day and never completed
}

export default function DashboardPage({ user, today, appointments, unfinished }: DashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey | null>(null);
  const todays = appointments.filter((a) => a.dateTime.slice(0, 10) === today);
  const waiting = todays.filter((a) => a.status === "Confirmed" || a.status === "Checked-in");
  // Open consultations: started today, plus any from earlier days that were never completed.
  const inProgress = [...unfinished, ...todays.filter((a) => a.status === "In-Progress")];
  const completed = todays.filter((a) => a.status === "Completed");
  const queue = [...unfinished, ...todays.filter((a) => a.status !== "Completed")];

  const weekChart = Array.from({ length: 7 }, (_, i) => {
    const date = shiftDay(today, i);
    return {
      day: i === 0 ? "Today" : new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
      date,
      patients: appointments.filter((a) => a.dateTime.slice(0, 10) === date).length,
    };
  });

  const metrics: { key: MetricKey; title: string; value: number; icon: typeof Users; color: string; bg: string }[] = [
    { key: "today", title: "Today's Patients", value: todays.length, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { key: "waiting", title: "Waiting", value: waiting.length, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
    { key: "inProgress", title: "In Consultation", value: inProgress.length, icon: Stethoscope, color: "text-purple-600", bg: "bg-purple-100" },
    { key: "completed", title: "Completed Today", value: completed.length, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
  ];
  const selectedPatients = selectedMetric === "today" ? todays
    : selectedMetric === "waiting" ? waiting
    : selectedMetric === "inProgress" ? inProgress
    : selectedMetric === "completed" ? completed : [];
  const selectedTitle = metrics.find((metric) => metric.key === selectedMetric)?.title;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back, {user?.name}!</h2>
          <p className="text-slate-500">Here&apos;s what&apos;s happening at your clinic today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m) => (
          <Card
            key={m.title}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedMetric(m.key)}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedMetric(m.key); }}
            className={`border-none shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer ${selectedMetric === m.key ? "ring-2 ring-[var(--brand-primary)]" : ""}`}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${m.bg} flex items-center justify-center shrink-0`}>
                <m.icon className={`w-6 h-6 ${m.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{m.title}</p>
                <h3 className="text-2xl font-bold text-slate-900">{m.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedMetric && (
        <Card className="border-slate-200 shadow-sm animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">{selectedTitle}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setSelectedMetric(null)}>Close</Button>
          </CardHeader>
          <CardContent className="p-0">
            {selectedPatients.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-slate-500">No patients in this category.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {selectedPatients.map((patient) => (
                  <div key={patient.appointmentId} className="flex items-center justify-between gap-4 px-6 py-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{patient.patientName}</p>
                      <p className="text-xs text-slate-500">{formatClockTime(patient.dateTime)} · Ticket #{patient.ticketNumber}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/doctor/patients/${patient.patientId}`} className="text-xs font-semibold text-[var(--brand-primary)] hover:underline">View patient</Link>
                      {patient.status !== "Completed" && <Link href={`/doctor/consultations/${patient.appointmentId}`} className="text-xs font-semibold text-slate-700 hover:underline">Consultation</Link>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Patients — Next 7 Days</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} />
                <Tooltip
                  cursor={{ fill: "#F1F5F9" }}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                  labelFormatter={(_, payload) => (payload?.[0]?.payload?.date ? formatDay(payload[0].payload.date) : "")}
                />
                <Bar dataKey="patients" name="Patients" fill="var(--brand-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Today&apos;s Queue</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {queue.length > 0 ? (
              <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto custom-scrollbar">
                {queue.map((appt) => (
                  <div key={appt.appointmentId} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-blue-600">
                          {appt.dateTime.slice(0, 10) < today
                            ? formatDay(appt.dateTime.slice(0, 10)).split(" ").slice(0, 2).join(" ")
                            : formatClockTime(appt.dateTime)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{appt.patientName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {appt.dateTime.slice(0, 10) < today ? (
                            <span className="text-xs font-semibold text-amber-600">Unfinished</span>
                          ) : (
                            <span className="text-xs text-slate-500">#{appt.ticketNumber}</span>
                          )}
                          <StatusPill status={appt.status} />
                        </div>
                      </div>
                    </div>
                    <StartConsultationButton appointmentId={appt.appointmentId} status={appt.status} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Users} title="Queue is clear" description="No patients waiting for today." className="py-10" />
            )}
            {completed.length > 0 && (
              <div className="px-4 pt-3 border-t border-slate-100">
                <Link href="/doctor/consultations?tab=records&date=today">
                  <Button variant="ghost" size="sm" className="w-full text-slate-600">
                    <Eye className="w-4 h-4 mr-2" /> View {completed.length} completed
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
