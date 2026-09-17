"use client";

import React, { useState, useMemo } from "react";
import { useCurrentUser } from "@/lib/stores/authStore";
import { useAppointmentStore } from "@/lib/stores/appointmentStore";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Stethoscope,
  MapPin,
  Ticket,
  Lock,
  RotateCcw,
  XCircle,
  Plus,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { RescheduleModal } from "@/components/catms/RescheduleModal";
import { cancelAppointment } from "@/lib/actions/appointments";

type TabType = "all" | "upcoming" | "completed" | "cancelled";

const statusColors: Record<AppointmentStatus, string> = {
  Confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  "Checked-in": "bg-amber-100 text-amber-700 border-amber-200",
  "In-Progress": "bg-purple-100 text-purple-700 border-purple-200",
  "Checked-out": "bg-teal-100 text-teal-700 border-teal-200",
  Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Cancelled: "bg-rose-100 text-rose-700 border-rose-200",
  Rescheduled: "bg-indigo-100 text-indigo-700 border-indigo-200",
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
};

export default function PatientAppointmentsPage() {
  const user = useCurrentUser();
  const { appointments, cancelAppointment: cancelStoreAppointment } = useAppointmentStore();

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Filter appointments for current patient
  const myAppointments = useMemo(() => {
    if (!user) return [];
    return appointments
      .filter((a) => a.patientId === user.userId)
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }, [appointments, user]);

  const filteredAppointments = useMemo(() => {
    switch (activeTab) {
      case "upcoming":
        return myAppointments.filter((a) =>
          ["Pending", "Confirmed", "Rescheduled", "Checked-in"].includes(a.status)
        );
      case "completed":
        return myAppointments.filter((a) =>
          ["Completed", "Checked-out"].includes(a.status)
        );
      case "cancelled":
        return myAppointments.filter((a) => a.status === "Cancelled");
      default:
        return myAppointments;
    }
  }, [myAppointments, activeTab]);

  async function handleConfirmCancel() {
    if (!cancelTarget) return;
    setIsCancelling(true);
    setCancelError(null);

    const res = await cancelAppointment({
      appointmentId: cancelTarget.appointmentId,
      cancelReason: "Cancelled by patient",
    });

    setIsCancelling(false);

    if (!res.success) {
      setCancelError(res.message);
      return;
    }

    // Update store state
    cancelStoreAppointment(cancelTarget.appointmentId, "Cancelled by patient");
    setCancelTarget(null);
  }

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Appointments</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage your scheduled visits, reschedule sessions, or review appointment history.
          </p>
        </div>
        <Link href="/find-doctors">
          <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl h-11 font-semibold gap-2 shadow-sm">
            <Plus className="w-4 h-4" />
            Book New Appointment
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {(
          [
            { id: "all", label: "All Appointments", count: myAppointments.length },
            {
              id: "upcoming",
              label: "Upcoming",
              count: myAppointments.filter((a) =>
                ["Pending", "Confirmed", "Rescheduled", "Checked-in"].includes(a.status)
              ).length,
            },
            {
              id: "completed",
              label: "Completed",
              count: myAppointments.filter((a) =>
                ["Completed", "Checked-out"].includes(a.status)
              ).length,
            },
            {
              id: "cancelled",
              label: "Cancelled",
              count: myAppointments.filter((a) => a.status === "Cancelled").length,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0",
              activeTab === tab.id
                ? "bg-[var(--brand-primary)] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-bold",
                activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Appointments Found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            {activeTab === "all"
              ? "You haven't booked any appointments yet."
              : `No ${activeTab} appointments found.`}
          </p>
          <Link href="/find-doctors" className="inline-block mt-4">
            <Button variant="outline" className="rounded-xl border-slate-200">
              Browse Doctor Directory
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAppointments.map((appt) => {
            const apptTime = new Date(appt.dateTime).getTime();
            const hoursRemaining = (apptTime - Date.now()) / (1000 * 60 * 60);
            const isCanModify =
              ["Pending", "Confirmed", "Rescheduled"].includes(appt.status) && hoursRemaining >= 24;
            const isLocked =
              ["Pending", "Confirmed", "Rescheduled"].includes(appt.status) && hoursRemaining < 24 && hoursRemaining > 0;

            return (
              <Card
                key={appt.appointmentId}
                className="border border-slate-200 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden"
              >
                <CardContent className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Left Column: Details */}
                  <div className="flex items-start gap-4">
                    {/* Ticket Badge */}
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex flex-col items-center justify-center shrink-0 text-teal-700">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                        Ticket
                      </span>
                      <span className="text-xl font-black leading-none mt-0.5">
                        #{appt.ticketNumber ?? "—"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900">{appt.doctorName}</h3>
                        <span
                          className={cn(
                            "text-xs font-bold px-2.5 py-0.5 rounded-full border",
                            statusColors[appt.status as AppointmentStatus] ?? "bg-slate-100 text-slate-600"
                          )}
                        >
                          {appt.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                        <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                        {appt.doctorSpecialization ?? appt.visitType}
                        <span className="text-slate-300">•</span>
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {appt.branchName ?? "Main Branch"}
                      </p>

                      <p className="text-xs text-slate-600 flex items-center gap-1.5 pt-1">
                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                        <span className="font-semibold">
                          {new Date(appt.dateTime).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span>· {appt.session ?? "Morning"} Session</span>
                      </p>

                      {appt.notes && (
                        <p className="text-xs text-slate-500 italic pt-0.5">
                          Note: "{appt.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions & Reschedule Guard */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <p className="text-xs text-slate-400">Consultation Fee</p>
                      <p className="text-base font-bold text-slate-900">
                        LKR {appt.fee?.toLocaleString() ?? 2500}
                      </p>
                    </div>

                    {isLocked && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        <span>Reschedule locked (&lt;24h prior)</span>
                      </div>
                    )}

                    {isCanModify && (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRescheduleTarget(appt)}
                          className="flex-1 sm:flex-initial rounded-xl text-xs font-semibold h-9 border-slate-200 hover:border-slate-300 text-slate-700"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1 text-teal-600" />
                          Reschedule
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCancelTarget(appt)}
                          className="flex-1 sm:flex-initial rounded-xl text-xs font-semibold h-9 border-rose-200 text-rose-600 hover:bg-rose-50"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <RescheduleModal
          appointment={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onSuccess={() => {
            setRescheduleTarget(null);
          }}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCancelTarget(null)} />
          <div className="relative bg-white rounded-3xl p-6 shadow-2xl w-full max-w-md space-y-4 animate-fade-in-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Cancel Appointment?</h3>
              <p className="text-sm text-slate-500 mt-1">
                Are you sure you want to cancel your appointment with{" "}
                <span className="font-semibold text-slate-700">{cancelTarget.doctorName}</span> on{" "}
                {new Date(cancelTarget.dateTime).toLocaleDateString()}?
              </p>
            </div>

            {cancelError && (
              <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
                {cancelError}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                disabled={isCancelling}
                onClick={() => setCancelTarget(null)}
                className="flex-1 rounded-xl h-11 border-slate-200"
              >
                Keep Booking
              </Button>
              <Button
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-11 font-semibold"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Yes, Cancel"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
