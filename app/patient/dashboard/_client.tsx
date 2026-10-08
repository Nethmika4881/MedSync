"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Pill,
  CreditCard,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight,
  Loader2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Search,
  PlusCircle,
  Ticket,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  getPatientDashboardData,
  type PatientDashboardMetrics,
} from "@/lib/actions/patient-dashboard";
import type { AuthUser } from "@/lib/types";

export default function PatientDashboardClient({ user }: { user: AuthUser }) {
  const [data, setData] = useState<PatientDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const metrics = await getPatientDashboardData();
        if (!cancelled) {
          if (metrics) {
            setData(metrics);
          } else {
            setError("Unable to load patient dashboard metrics.");
          }
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load dashboard data. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = user?.firstName || user?.name?.split(" ")[0] || "Patient";

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-in">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
        <p className="text-sm text-slate-500">Loading your personal health dashboard…</p>
      </div>
    );
  }

  // ── Error state ──
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-in">
        <AlertTriangle className="w-8 h-8 text-amber-500" />
        <p className="text-sm text-slate-600">{error || "Something went wrong."}</p>
        <button
          className="text-sm font-semibold text-[var(--brand-primary)] hover:underline"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  const hasOutstanding = data.totalDueRaw > 0;
  const nextAppt = data.upcomingAppointments[0];

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* ── Welcome Banner ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold font-outfit tracking-tight">
            Welcome back, {firstName}!
          </h2>
          <p className="text-slate-300 text-sm max-w-xl">
            Here is your real-time health summary, upcoming consultations, and clinical records.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/patient/appointments">
            <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl shadow-md gap-2 font-medium">
              <PlusCircle className="w-4 h-4" />
              Book Appointment
            </Button>
          </Link>
          <Link href="/patient/find-doctors">
            <Button
              variant="outline"
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white rounded-xl gap-2 font-medium"
            >
              <Search className="w-4 h-4" />
              Find Doctors
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Metrics Grid (Derived from real PostgreSQL data) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Upcoming Appointments */}
        <Link href="/patient/appointments" className="block group">
          <Card className="border-slate-200 shadow-xs hover:border-[var(--brand-primary)] hover:shadow-md transition-all h-full">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Upcoming Visits
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                  {data.upcomingAppointmentsCount}
                </h3>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  {data.upcomingAppointmentsCount > 0
                    ? nextAppt
                      ? `Next: ${nextAppt.appointmentDate}`
                      : "Visits scheduled"
                    : "No visits scheduled"}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Metric 2: Active Prescriptions */}
        <Link href="/patient/prescriptions" className="block group">
          <Card className="border-slate-200 shadow-xs hover:border-[var(--brand-primary)] hover:shadow-md transition-all h-full">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Pill className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Active Prescriptions
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                  {data.activePrescriptionsCount}
                </h3>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  {data.activePrescriptionsCount > 0
                    ? `${data.activePrescriptionsCount} active course(s)`
                    : "No active medications"}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Metric 3: Outstanding Balance */}
        <Link href="/patient/billing" className="block group">
          <Card className="border-slate-200 shadow-xs hover:border-[var(--brand-primary)] hover:shadow-md transition-all h-full">
            <CardContent className="p-5 flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                  hasOutstanding
                    ? "bg-amber-50 text-amber-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Outstanding Bills
                </p>
                <h3
                  className={`text-2xl font-bold mt-0.5 ${
                    hasOutstanding ? "text-amber-600" : "text-slate-900"
                  }`}
                >
                  {data.outstandingBalance}
                </h3>
                <p className="text-xs mt-1 truncate">
                  {hasOutstanding ? (
                    <span className="text-amber-600 font-medium">
                      {data.unpaidInvoicesCount} invoice(s) pending
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-medium">All invoices settled</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Metric 4: Completed Consultations */}
        <Link href="/patient/records" className="block group">
          <Card className="border-slate-200 shadow-xs hover:border-[var(--brand-primary)] hover:shadow-md transition-all h-full">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Consultation History
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                  {data.completedVisitsCount}
                </h3>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  {data.completedVisitsCount > 0
                    ? `${data.completedVisitsCount} completed visit(s)`
                    : "No completed visits yet"}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ── Main Dashboard Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Monthly Activity Chart & Health Shortcuts (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Monthly Activity Chart */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    Visit Activity (Last 6 Months)
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Monthly appointment history recorded in your health profile.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-[var(--brand-primary)] inline-block" />
                    <span className="text-slate-600">Completed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-slate-200 inline-block" />
                    <span className="text-slate-600">Cancelled</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[260px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.monthlyActivity}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748B" }}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748B" }}
                  />
                  <Tooltip
                    cursor={{ fill: "#F8FAFC" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #E2E8F0",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }}
                  />
                  <Bar
                    dataKey="completed"
                    name="Completed"
                    fill="var(--brand-primary)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="cancelled"
                    name="Cancelled"
                    fill="#E2E8F0"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick Health Shortcuts */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider text-xs mb-3">
              Patient Care Portals
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/patient/appointments"
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 group-hover:text-[var(--brand-primary)] transition-colors">
                      Book &amp; Reschedule
                    </h4>
                    <p className="text-xs text-slate-500">View schedule and manage bookings</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/patient/records"
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 group-hover:text-[var(--brand-primary)] transition-colors">
                      Medical Records
                    </h4>
                    <p className="text-xs text-slate-500">Diagnosis, notes, and treatments</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/patient/billing"
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 group-hover:text-[var(--brand-primary)] transition-colors">
                      Billing &amp; Invoices
                    </h4>
                    <p className="text-xs text-slate-500">Payments and invoice history</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/patient/claims"
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 group-hover:text-[var(--brand-primary)] transition-colors">
                      Insurance Claims
                    </h4>
                    <p className="text-xs text-slate-500">Coverage and claim tracking</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Appointments with Zero-Data State */}
        <div className="space-y-4">
          <Card className="border-slate-200 shadow-xs flex flex-col h-full">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Upcoming Consultations
                </CardTitle>
                <Link
                  href="/patient/appointments"
                  className="text-xs font-semibold text-[var(--brand-primary)] hover:underline"
                >
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              {data.upcomingAppointments.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {data.upcomingAppointments.map((appt) => (
                    <div
                      key={appt.appointmentId}
                      className="p-4 hover:bg-slate-50/70 transition-colors space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex flex-col items-center justify-center shrink-0 font-outfit">
                            <span className="text-[10px] font-bold uppercase leading-none">
                              {new Date(appt.appointmentDate).toLocaleString("en-US", {
                                month: "short",
                              })}
                            </span>
                            <span className="text-sm font-bold leading-none mt-1">
                              {new Date(appt.appointmentDate).getDate()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                              {appt.doctorName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {appt.specialization || "General Practice"}
                            </p>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                          {appt.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {appt.startTime} - {appt.endTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{appt.branchName}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Ticket className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                          Queue Ticket #{appt.queueNumber}
                        </span>
                        {appt.reasonForVisit && (
                          <span className="text-slate-400 truncate max-w-[140px]">
                            {appt.reasonForVisit}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* ── Zero-Data State for Appointments ── */
                <div className="p-8 text-center flex-1 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      No upcoming appointments
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
                      You have no upcoming consultations scheduled. Book a session with our specialists anytime.
                    </p>
                  </div>
                  <Link href="/patient/appointments" className="mt-2">
                    <Button
                      size="sm"
                      className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-lg h-9 px-4 text-xs font-medium"
                    >
                      Book an Appointment
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
