"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Calendar,
  Activity,
  CreditCard,
  Clock,
  CheckCircle2,
  Building2,
  Stethoscope,
  AlertCircle,
  ArrowUpRight,
  MapPin,
  ClipboardPlus,
} from "lucide-react";
import {
  getDashboardData,
  type DashboardData,
} from "@/lib/actions/admin-dashboard";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StatusPill } from "@/components/catms/StatusPill";
import { SessionBadge } from "@/components/catms/SessionBadge";
import { useAppointmentStore } from "@/lib/stores/appointmentStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminDashboardData = DashboardData;

export default function DashboardPage({ user }: { user: any }) {
  const role = user?.role?.toLowerCase();
  const { appointments } = useAppointmentStore();

  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null);
  const [loadingAdminData, setLoadingAdminData] = useState(role === "admin");

  useEffect(() => {
    if (role === "admin") {
      async function loadAdminMetrics() {
        try {
          setAdminData(await getDashboardData());
        } catch (err) {
          console.error("Failed to load admin dashboard data:", err);
        } finally {
          setLoadingAdminData(false);
        }
      }
      void loadAdminMetrics();
    }
  }, [role]);

  // Doctor's appointment queue logic
  const doctorQueue = appointments
    .filter(
      (a) =>
        a.doctorId === user?.userId &&
        (a.status === "Confirmed" || a.status === "Checked-in"),
    )
    .sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
    );
  const doctorCheckedIn = appointments.filter(
    (a) => a.doctorId === user?.userId && a.status === "Checked-in",
  );
  const doctorCompleted = appointments.filter(
    (a) => a.doctorId === user?.userId && a.status === "Completed",
  );

  // Role-specific metrics
  const getMetrics = () => {
    switch (role) {
      case "doctor":
        return [
          {
            title: "Today's Patients",
            value: String(doctorQueue.length),
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-100",
          },
          {
            title: "Pending Consultations",
            value: String(doctorCheckedIn.length),
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-100",
          },
          {
            title: "Completed Today",
            value: String(doctorCompleted.length),
            icon: CheckCircle2,
            color: "text-green-600",
            bg: "bg-green-100",
          },
        ];
      case "patient":
        return [
          {
            title: "Upcoming Appointments",
            value: "2",
            icon: Calendar,
            color: "text-blue-600",
            bg: "bg-blue-100",
          },
          {
            title: "Active Prescriptions",
            value: "1",
            icon: Activity,
            color: "text-purple-600",
            bg: "bg-purple-100",
          },
          {
            title: "Outstanding Bills",
            value: "Rs. 0",
            icon: CreditCard,
            color: "text-green-600",
            bg: "bg-green-100",
          },
        ];
      case "admin":
      default:
        return [
          {
            title: "Active Branches",
            value: `${adminData?.totals?.activeBranches ?? 0} / ${adminData?.totals?.totalBranches ?? 0}`,
            icon: Building2,
            color: "text-teal-600",
            bg: "bg-teal-100",
          },
          {
            title: "Network Doctors",
            value: String(adminData?.totals?.totalDoctors ?? 0),
            icon: Stethoscope,
            color: "text-blue-600",
            bg: "bg-blue-100",
          },
          {
            title: "Total Patients",
            value: (adminData?.totals?.totalPatients ?? 0).toLocaleString(),
            icon: Users,
            color: "text-purple-600",
            bg: "bg-purple-100",
          },
          {
            title: "Support Staff",
            value: String(
              (adminData?.totals?.totalFrontdesk ?? 0) +
                (adminData?.totals?.totalAdmins ?? 0),
            ),
            icon: Activity,
            color: "text-amber-600",
            bg: "bg-amber-100",
          },
        ];
    }
  };

  const metrics = getMetrics();

  // Upcoming appointments for patients/other staff
  const upcomingAppts = appointments
    .filter((a) => a.status === "Confirmed" || a.status === "Rescheduled")
    .filter((a) =>
      role === "doctor"
        ? a.doctorId === user?.userId
        : role === "patient"
          ? a.patientId === user?.userId
          : true,
    )
    .slice(0, 5);

  // Loading state while admin data is being fetched
  if (loadingAdminData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-sm font-medium text-slate-400 tracking-wide">
          Loading dashboard…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}

      {/* Welcome Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.name?.split(" ")[0] || "User"}!
          </h2>

          <p className="text-slate-500">
            {role === "admin"
              ? "Performance overview."
              : "Here's what's happening at your clinic today."}
          </p>
        </div>

        {role === "admin" && (
          <Link href="/admin/patients">
            <Button variant="outline" className="w-full rounded-xl sm:w-auto">
              <Users className="mr-2 h-4 w-4" />
              Patient Directory
            </Button>
          </Link>
        )}
      </div>

      {/* Floating Staff Alert for Admins */}
      {role === "admin" && (adminData?.totals?.unassignedStaff ?? 0) > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <span className="text-sm font-medium">
              You have{" "}
              <strong>
                {adminData?.totals?.unassignedStaff} unassigned staff member(s)
              </strong>{" "}
              available in the network staffing pool.
            </span>
          </div>
          <Link href="/admin/branches">
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-900 hover:bg-amber-100"
            >
              Assign to Branch
            </Button>
          </Link>
        </div>
      )}

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <Card
            key={i}
            className="border-none shadow-sm hover:shadow-md transition-shadow"
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl ${m.bg} flex items-center justify-center shrink-0`}
              >
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

      {/* Middle Row: Trend Chart & Upcoming / Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Revenue & Appointments Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={adminData?.monthlyTrend ?? []}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                {/* Subtle grid lines in both light and dark modes */}
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#64748b"
                  strokeOpacity={0.2}
                />

                {/* Shared X-Axis */}
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                />

                {/* Left Y-Axis: Revenue (Rs. in Thousands) */}
                <YAxis
                  yAxisId="revenue"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#0d9488" }}
                  tickFormatter={(val) => `Rs. ${val / 1000}k`}
                />

                {/* Right Y-Axis: Appointments (Count) */}
                <YAxis
                  yAxisId="appointments"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#8b5cf6" }}
                  allowDecimals={false}
                />

                {/* Theme-Aware Tooltip */}
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid var(--border-subtle, #1e293b)",
                    backgroundColor: "var(--surface, #0f172a)",
                    color: "var(--text-primary, #f8fafc)",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                  }}
                  formatter={(value: number, name: string) => [
                    name === "revenue"
                      ? `Rs. ${value.toLocaleString()}`
                      : value.toLocaleString(),
                    name === "revenue" ? "Revenue" : "Appointments",
                  ]}
                />

                {/* Revenue Line (Scaled to Left Axis) */}
                <Line
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--brand-primary)"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "var(--brand-primary)",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 6 }}
                />

                {/* Appointments Line (Scaled to Right Axis) */}
                <Line
                  yAxisId="appointments"
                  type="monotone"
                  dataKey="appointments"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{
                    r: 3,
                    fill: "#8B5CF6",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Doctor Queue or Recent Appointments */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">
              {role === "doctor"
                ? "Today's Schedule Queue"
                : "Upcoming Appointments"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {role === "doctor" ? (
              doctorQueue.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {doctorQueue.map((appt) => (
                    <div
                      key={appt.appointmentId}
                      className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-blue-600 uppercase leading-none">
                            {new Date(appt.dateTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {appt.patientName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500">
                              {appt.visitType}
                            </span>
                            <StatusPill status={appt.status} />
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/doctor/consultations/${appt.appointmentId}`}
                        className="shrink-0"
                      >
                        <Button
                          size="sm"
                          className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-lg h-8"
                        >
                          <ClipboardPlus className="w-3.5 h-3.5 mr-1.5" /> Start
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No patients queued for today.
                </div>
              )
            ) : upcomingAppts.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {upcomingAppts.map((appt) => (
                  <div
                    key={appt.appointmentId}
                    className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-blue-600 uppercase leading-none">
                          {new Date(appt.dateTime).toLocaleString("en-US", {
                            month: "short",
                          })}
                        </span>
                        <span className="text-sm font-bold text-blue-700 leading-none mt-0.5">
                          {new Date(appt.dateTime).getDate()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {role === "patient"
                            ? appt.doctorName
                            : appt.patientName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {appt.session && (
                            <SessionBadge
                              session={appt.session}
                              ticketNumber={appt.ticketNumber}
                              variant="compact"
                            />
                          )}
                          <span className="text-xs text-slate-400">
                            {appt.visitType}
                          </span>
                        </div>
                      </div>
                    </div>
                    <StatusPill
                      status={appt.status}
                      className="hidden sm:inline-flex"
                    />
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

      {/* Admin Multi-Branch Operational Matrix */}
      {role === "admin" && adminData && adminData.branches?.length > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Branch Overview
              </CardTitle>
              <p className="text-xs text-slate-500">Live</p>
            </div>
            <Link href="/admin/branches">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Manage Branches <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Branch Manager</th>
                    <th className="py-3 px-4 text-center">Doctors</th>
                    <th className="py-3 px-4 text-center">Support Staff</th>
                    <th className="py-3 px-4 text-center">
                      Registered Patients
                    </th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminData.branches.map((b) => (
                    <tr
                      key={b.branchId}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {b.branchName}
                        </div>
                        <div className="flex items-center text-xs text-slate-400 mt-0.5">
                          <MapPin className="h-3 w-3 mr-1" />
                          {b.city}, {b.province}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                            b.isActive
                              ? "bg-teal-50 text-teal-700 border border-teal-100"
                              : "bg-slate-100 text-slate-600",
                          )}
                        >
                          {b.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {b.managerName}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-900">
                        {b.doctorCount}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-900">
                        {b.staffCount}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-900">
                        {b.patientCount}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/admin/branches/${b.branchId}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-medium"
                          >
                            Manage
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
