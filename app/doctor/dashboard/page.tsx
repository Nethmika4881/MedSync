"use client";

import React from "react";
import Link from "next/link";
import { useCurrentUser } from "@/lib/stores/authStore";
import { useAppointmentStore } from "@/lib/stores/appointmentStore";
import { useClinicalStore } from "@/lib/stores/clinicalStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/catms/StatusPill";
import { AvatarWithName } from "@/components/catms/AvatarWithName";
import { EmptyState } from "@/components/catms/EmptyState";
import {
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  ClipboardPlus,
  Stethoscope,
} from "lucide-react";

export default function DoctorDashboardPage() {
  const user = useCurrentUser();
  const { appointments } = useAppointmentStore();
  const { consultations } = useClinicalStore();

  if (!user) return null;

  const todayStr = new Date().toDateString();

  const myAppointmentsToday = appointments.filter(
    (a) => a.doctorId === user.userId && new Date(a.dateTime).toDateString() === todayStr
  );

  const checkedInQueue = myAppointmentsToday.filter(
    (a) => a.status === "Checked-in" || a.status === "Confirmed"
  );

  const completedToday = myAppointmentsToday.filter((a) => a.status === "Completed");

  const myConsultationsAllTime = consultations.filter((c) => c.doctorId === user.userId);

  const pendingFollowUps = myConsultationsAllTime.filter((c) => c.followUpRequired);

  const kpis = [
    {
      label: "Today's Appointments",
      value: myAppointmentsToday.length,
      icon: Calendar,
      accent: "bg-blue-50 text-[var(--brand-primary)]",
    },
    {
      label: "Waiting in Queue",
      value: checkedInQueue.length,
      icon: Users,
      accent: "bg-amber-50 text-amber-600",
    },
    {
      label: "Completed Today",
      value: completedToday.length,
      icon: CheckCircle2,
      accent: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Pending Follow-ups",
      value: pendingFollowUps.length,
      icon: Clock,
      accent: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Welcome back, {user.name}
        </h2>
        <p className="text-slate-500">Here's what's happening with your patients today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-slate-200 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">{kpi.label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{kpi.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${kpi.accent}`}>
                <kpi.icon className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's queue */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200 shadow-sm h-full">
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-slate-400" /> Today's Schedule Queue
              </CardTitle>
              <Link href="/doctor/schedule">
                <Button variant="outline" size="sm" className="rounded-lg h-8">
                  View Full Schedule <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {myAppointmentsToday.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No appointments today"
                  description="You have a clear schedule for today."
                  className="py-12"
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {myAppointmentsToday.map((appt) => (
                    <div
                      key={appt.appointmentId}
                      className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
                    >
                      <AvatarWithName
                        name={appt.patientName}
                        subtitle={`${appt.visitType} • ${new Date(appt.dateTime).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" }
                        )}`}
                      />
                      <div className="flex items-center gap-3">
                        <StatusPill status={appt.status} />
                        {(appt.status === "Checked-in" || appt.status === "Confirmed") && (
                          <Link href={`/doctor/consultations/${appt.appointmentId}`}>
                            <Button size="sm" className="rounded-lg h-8 bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)]">
                              <ClipboardPlus className="w-4 h-4 mr-1.5" /> Start
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Follow-ups needed */}
        <div>
          <Card className="border-slate-200 shadow-sm h-full">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" /> Follow-ups Needed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {pendingFollowUps.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="All caught up"
                  description="No pending follow-ups."
                  className="py-10"
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingFollowUps.slice(0, 6).map((c) => (
                    <div key={c.consultationId} className="p-4">
                      <p className="font-semibold text-slate-900 text-sm">{c.patientName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Follow-up due {c.followUpDate || "soon"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}