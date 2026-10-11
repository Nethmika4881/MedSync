"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/catms/StatusPill";
import { EmptyState } from "@/components/catms/EmptyState";
import { AvatarWithName } from "@/components/catms/AvatarWithName";
import {
  Calendar,
  Search,
  MoreHorizontal,
  UserCheck,
  XCircle,
  Clock,
  Plus,
  Ticket,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  checkInPatientAppointment,
  cancelAppointmentByReception,
  type FrontDeskAppointment,
} from "@/lib/actions/frontdesk-appointments";

export default function AppointmentsPage({
  user,
  initialAppointments = [],
}: {
  user: any;
  initialAppointments: FrontDeskAppointment[];
}) {
  const router = useRouter();
  const [appointments, setAppointments] = useState<FrontDeskAppointment[]>(initialAppointments);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "upcoming" | "past">("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Check In Mutation
  const handleCheckIn = async (appointmentId: string) => {
    setActionLoadingId(appointmentId);
    try {
      const res = await checkInPatientAppointment(appointmentId);
      if (res.success) {
        toast.success(res.message || "Patient checked in successfully!");
        // Update local status optimistically
        setAppointments((prev) =>
          prev.map((a) =>
            a.appointmentId === appointmentId
              ? { ...a, status: "CheckedIn", checkedInAt: new Date().toISOString() }
              : a
          )
        );
      } else {
        toast.error(res.error || "Failed to check in patient.");
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred while checking in.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Cancel Mutation
  const handleCancel = async (appointmentId: string) => {
    setActionLoadingId(appointmentId);
    try {
      const res = await cancelAppointmentByReception(appointmentId, "Cancelled by receptionist at front desk");
      if (res.success) {
        toast.success("Appointment cancelled successfully.");
        setAppointments((prev) =>
          prev.map((a) =>
            a.appointmentId === appointmentId
              ? { ...a, status: "Cancelled" }
              : a
          )
        );
      } else {
        toast.error(res.error || "Failed to cancel appointment.");
      }
    } catch (err: any) {
      toast.error(err?.message || "An error occurred while cancelling appointment.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Search filter
  const filtered = appointments.filter((a) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      a.patientName.toLowerCase().includes(q) ||
      a.doctorName.toLowerCase().includes(q) ||
      a.appointmentId.toLowerCase().includes(q) ||
      String(a.queueNumber).includes(q)
    );
  });

  const upcoming = filtered.filter((a) =>
    ["Scheduled", "Confirmed", "CheckedIn", "Pending", "Rescheduled"].includes(a.status)
  );
  const past = filtered.filter((a) =>
    ["Completed", "Cancelled", "CheckedOut", "NoShow"].includes(a.status)
  );

  const displayedList =
    filterTab === "upcoming" ? upcoming : filterTab === "past" ? past : filtered;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      <Toaster richColors position="top-right" />

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-outfit">
            Branch Appointments &amp; Queue
          </h2>
          <p className="text-slate-500 text-sm">
            Manage clinic bookings, check-in waiting patients, and monitor doctor queues.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by patient, doctor, token..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-sm focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none transition-all bg-white shadow-sm"
            />
          </div>
          <Button
            onClick={() => router.push("/front-desk/appointments/new")}
            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white font-semibold text-xs rounded-xl h-10 px-4 shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setFilterTab("all")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${filterTab === "all"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
            }`}
        >
          All Appointments ({filtered.length})
        </button>
        <button
          onClick={() => setFilterTab("upcoming")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${filterTab === "upcoming"
              ? "bg-[var(--brand-primary)] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
            }`}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          onClick={() => setFilterTab("past")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${filterTab === "past"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
            }`}
        >
          Past / Completed ({past.length})
        </button>
      </div>

      {/* Appointments Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/75 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-6 py-4">Token &amp; Time</th>
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Doctor</th>
                <th className="px-6 py-4">Reason / Visit</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {displayedList.map((appt) => {
                const canCheckIn =
                  appt.status !== "CheckedIn" &&
                  appt.status !== "Completed" &&
                  appt.status !== "Cancelled";
                const isItemLoading = actionLoadingId === appt.appointmentId;

                return (
                  <tr
                    key={appt.appointmentId}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
                          <Ticket className="w-3 h-3 text-teal-600" />
                          #{appt.queueNumber}
                        </span>
                        <span className="text-xs font-semibold text-slate-900">
                          {appt.availableDate}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {appt.startTime} - {appt.endTime}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <AvatarWithName
                        name={appt.patientName}
                        subtitle={`ID: ${appt.patientId.slice(0, 8)}...`}
                        size="sm"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 text-sm">
                        {appt.doctorName}
                      </div>
                      <div className="text-xs text-slate-400">Clinic Session</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-700 font-medium">
                        {appt.reasonForVisit || "General Consultation"}
                      </span>
                      <div className="text-[11px] text-slate-400">
                        Source: {appt.source}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill status={appt.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canCheckIn ? (
                          <Button
                            size="sm"
                            disabled={isItemLoading}
                            onClick={() => handleCheckIn(appt.appointmentId)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-8 px-3 text-xs font-semibold shadow-sm transition-all"
                          >
                            {isItemLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                                Check In
                              </>
                            )}
                          </Button>
                        ) : appt.status === "CheckedIn" ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                            <CheckCircle2 className="w-3 h-3" /> Waiting
                          </span>
                        ) : null}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 rounded-xl"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-slate-200">
                            <DropdownMenuItem
                              onClick={() => router.push(`/front-desk/patients/${appt.patientId}`)}
                              className="cursor-pointer text-xs"
                            >
                              View Patient Profile
                            </DropdownMenuItem>
                            {canCheckIn && (
                              <DropdownMenuItem
                                onClick={() => handleCheckIn(appt.appointmentId)}
                                className="cursor-pointer text-xs font-semibold text-emerald-700 focus:text-emerald-800"
                              >
                                <UserCheck className="w-3.5 h-3.5 mr-2" />
                                Check In Patient
                              </DropdownMenuItem>
                            )}
                            {appt.status !== "Completed" && appt.status !== "Cancelled" && (
                              <DropdownMenuItem
                                onClick={() => handleCancel(appt.appointmentId)}
                                className="cursor-pointer text-xs font-medium text-rose-600 focus:text-rose-700"
                              >
                                <XCircle className="w-3.5 h-3.5 mr-2" />
                                Cancel Appointment
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {displayedList.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12">
                    <EmptyState
                      icon={Calendar}
                      title="No appointments found"
                      description="No appointments in this branch match your current filter."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
