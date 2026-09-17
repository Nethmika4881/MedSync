"use client";

import React from "react";
import { useRole, useCurrentUser } from "@/lib/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Activity, CreditCard, Clock, CheckCircle2 } from "lucide-react";
import { revenueByMonth, appointmentsByMonth } from "@/lib/mockData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { StatusPill } from "@/components/catms/StatusPill";
import { useAppointmentStore } from "@/lib/stores/appointmentStore";
import { AvatarWithName } from "@/components/catms/AvatarWithName";

export default function DashboardPage() {
  const role = useRole();
  const user = useCurrentUser();
  const { appointments } = useAppointmentStore();

  if (!role || !user) return null;

  // Generic metrics based on role
  const getMetrics = () => {
    switch (role) {
      case "doctor":
        return [
          { title: "Today's Patients", value: "12", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
          { title: "Pending Consultations", value: "3", icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
          { title: "Completed Today", value: "8", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
        ];
      case "patient":
        return [
          { title: "Upcoming Appointments", value: "2", icon: Calendar, color: "text-blue-600", bg: "bg-blue-100" },
          { title: "Active Prescriptions", value: "1", icon: Activity, color: "text-purple-600", bg: "bg-purple-100" },
          { title: "Outstanding Bills", value: "$0", icon: CreditCard, color: "text-green-600", bg: "bg-green-100" },
        ];
      default: // admin, manager, etc
        return [
          { title: "Total Patients", value: "2,845", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
          { title: "Today's Appointments", value: "48", icon: Calendar, color: "text-purple-600", bg: "bg-purple-100" },
          { title: "Active Doctors", value: "18", icon: Activity, color: "text-amber-600", bg: "bg-amber-100" },
          { title: "Monthly Revenue", value: "$75.8k", icon: CreditCard, color: "text-green-600", bg: "bg-green-100" },
        ];
    }
  };

  const metrics = getMetrics();

  // Upcoming appointments for the specific role
  const upcomingAppts = appointments
    .filter(a => a.status === "Confirmed" || a.status === "Rescheduled")
    .filter(a => role === "doctor" ? a.doctorId === user.userId : role === "patient" ? a.patientId === user.userId : true)
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back, {user.name.split(' ')[0]}!</h2>
          <p className="text-slate-500">Here's what's happening at your clinic today.</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
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

      {/* Charts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">
              {role === "admin" ? "Revenue & Appointments Overview" : "Activity Overview"}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {role === "admin" ? (
                <LineChart data={revenueByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="var(--brand-primary)" strokeWidth={3} dot={{ r: 4, fill: "var(--brand-primary)", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                </LineChart>
              ) : (
                <BarChart data={appointmentsByMonth.slice(-6)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="completed" fill="var(--brand-primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cancelled" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Upcoming List */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {upcomingAppts.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {upcomingAppts.map(appt => (
                  <div key={appt.appointmentId} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-blue-600 uppercase leading-none">{new Date(appt.dateTime).toLocaleString('en-US', { month: 'short' })}</span>
                        <span className="text-sm font-bold text-blue-700 leading-none mt-0.5">{new Date(appt.dateTime).getDate()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {role === "patient" ? appt.doctorName : appt.patientName}
                        </p>
                        <p className="text-xs text-slate-500">{new Date(appt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {appt.visitType}</p>
                      </div>
                    </div>
                    <StatusPill status={appt.status} className="hidden sm:inline-flex" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm">
                No upcoming appointments.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
