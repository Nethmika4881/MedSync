"use client";

import React from "react";
import Link from "next/link";
import { Users, Clock, CheckCircle2, Stethoscope, Eye } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/catms/StatusPill";
import { EmptyState } from "@/components/catms/EmptyState";
import { StartConsultationButton } from "@/components/doctor/StartConsultationButton";
import { formatClockTime, formatDay, shiftDay } from "@/lib/doctorFormat";
import type { AuthUser, Appointment } from "@/lib/types";
import { Button } from "@/components/ui/button";const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayLabel(isoDate: string): string {
  return DAY_LABELS[new Date(`${isoDate}T00:00:00Z`).getUTCDay()];
}

interface DashboardProps {
  user: AuthUser;
  today: string;
  appointments: Appointment[]; // today and the following six days
}

export default function DashboardPage({ user, today, appointments }: DashboardProps) {
  const todays = appointments.filter((a) => a.dateTime.slice(0, 10) === today);
  const waiting = todays.filter((a) => a.status === "Confirmed" || a.status === "Checked-in");
  const inProgress = todays.filter((a) => a.status === "In-Progress");
  const completed = todays.filter((a) => a.status === "Completed");
  const queue = todays.filter((a) => a.status !== "Completed");

  const weekChart = Array.from({ length: 7 }, (_, i) => {
    const date = shiftDay(today, i);
    return {
      day: i === 0 ? "Today" : dayLabel(date),
      date,
      patients: appointments.filter((a) => a.dateTime.slice(0, 10) === date).length,
    };
  });

  const metrics = [
    { title: "Today's Patients", value: todays.length, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Waiting", value: waiting.length, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
    { title: "In Consultation", value: inProgress.length, icon: Stethoscope, color: "text-purple-600", bg: "bg-purple-100" },
    { title: "Completed Today", value: completed.length, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back, {user?.name.split(' ')[0]}!</h2>
          <p className="text-slate-500">Here&apos;s what&apos;s happening at your clinic today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m) => (
          <Card key={m.title} className="border-none shadow-sm hover:shadow-md transition-shadow">
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
                        <span className="text-xs font-bold text-blue-600">{formatClockTime(appt.dateTime)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{appt.patientName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-500">#{appt.ticketNumber}</span>
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
                <Link href="/doctor/consultations">
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
