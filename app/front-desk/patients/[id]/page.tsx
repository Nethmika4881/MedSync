"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/catms/StatusPill";
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  AlertCircle,
  FileText,
  Clock,
  Loader2,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { getBranchPatientById, type FrontDeskPatientSummary } from "@/lib/actions/frontdesk-patients";
import { getBranchAppointments, type FrontDeskAppointment } from "@/lib/actions/frontdesk-appointments";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";

export default function PatientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [patient, setPatient] = useState<FrontDeskPatientSummary | null>(null);
  const [appointments, setAppointments] = useState<FrontDeskAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!id) return;

    startTransition(async () => {
      setIsLoading(true);
      try {
        const [patientData, allAppointments] = await Promise.all([
          getBranchPatientById(id),
          getBranchAppointments(),
        ]);
        setPatient(patientData);
        // Filter appointments belonging to this patient
        const patientAppts = allAppointments.filter((a) => a.patientId === id);
        setAppointments(patientAppts);
      } catch (err) {
        console.error("Failed to load patient records:", err);
      } finally {
        setIsLoading(false);
      }
    });
  }, [id]);

  const getAge = (dobString?: string) => {
    if (!dobString) return "--";
    const birth = new Date(dobString);
    if (isNaN(birth.getTime())) return "--";
    return Math.max(0, new Date().getFullYear() - birth.getFullYear());
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
        <p className="text-sm text-slate-500 font-medium">Loading patient clinical profile...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 max-w-md mx-auto text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Patient Not Found</h2>
        <p className="text-sm text-slate-500">
          Unable to locate a patient with ID <code className="font-mono text-xs">{id}</code> in this branch.
        </p>
        <Button onClick={() => router.push("/front-desk/patients")} variant="outline" className="rounded-xl">
          Back to Patient Directory
        </Button>
      </div>
    );
  }

  const upcomingAppts = appointments.filter((a) =>
    ["Scheduled", "Confirmed", "CheckedIn", "Pending", "Rescheduled"].includes(a.status)
  );
  const pastAppts = appointments.filter((a) =>
    ["Completed", "Cancelled", "CheckedOut", "NoShow"].includes(a.status)
  );

  const avatarColorClass = getAvatarColor(patient.fullName);

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-10">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/front-desk/patients")}
          className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Patients
        </button>
        <div className="flex gap-2">
          <Button
            className="rounded-xl h-9 text-xs bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white shadow-sm font-semibold"
            onClick={() => router.push("/front-desk/appointments")}
          >
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Book Appointment
          </Button>
        </div>
      </div>

      {/* Main Profile Header */}
      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
        <div className="h-24 bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700"></div>
        <CardContent className="p-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row gap-6 sm:items-end -mt-10 sm:-mt-12 mb-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white bg-white shadow-md shrink-0 flex items-center justify-center overflow-hidden">
              <div
                className={cn("w-full h-full flex items-center justify-center text-white text-3xl font-black", avatarColorClass)}
              >
                {getInitials(patient.fullName)}
              </div>
            </div>
            <div className="flex-1 pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                    {patient.fullName}
                  </h1>
                  <p className="text-slate-500 text-sm flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 rounded-md text-slate-700 font-semibold">
                      NIC: {patient.nic}
                    </span>
                    • {patient.gender} • {getAge(patient.dob)} yrs
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-xl font-semibold flex items-center gap-1.5 border border-rose-200">
                    <HeartPulse className="w-4 h-4 text-rose-600" />
                    Blood: {patient.bloodGroup || "Unknown"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact Details</h3>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 text-sm">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-700 font-medium">{patient.phone || "No phone registered"}</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-700 font-medium">{patient.email || "No email"}</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-700 leading-tight">{patient.city || "Sri Lanka"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Emergency Contact</h3>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 text-sm">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-600 font-bold text-xs">
                    {patient.emergencyContactName?.charAt(0) || "E"}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      {patient.emergencyContactName || "Not specified"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {patient.emergencyContactPhone || "No contact number"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Information</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Date of Birth</span>
                  <span className="font-medium text-slate-700">{patient.dob}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">System ID</span>
                  <span className="font-mono text-xs text-slate-700 truncate max-w-[150px]">{patient.patientId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Registered Branch</span>
                  <span className="font-mono text-xs text-slate-700 truncate max-w-[150px]">
                    {patient.registeredBranchId}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointment History */}
      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--brand-primary)]" />
            Branch Visit & Appointment History
          </h3>
          <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
            {appointments.length} Total
          </span>
        </div>
        <CardContent className="p-6">
          {upcomingAppts.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Upcoming Appointments</h4>
              <div className="space-y-3">
                {upcomingAppts.map((appt) => (
                  <div
                    key={appt.appointmentId}
                    className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-teal-200 bg-teal-50/40"
                  >
                    <div className="shrink-0 flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-1 sm:w-28 border-b sm:border-b-0 sm:border-r border-teal-200 pb-3 sm:pb-0 sm:pr-4">
                      <div className="text-sm font-bold text-slate-800">{appt.availableDate}</div>
                      <div className="text-xs font-semibold text-teal-700 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {appt.startTime}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h5 className="font-bold text-slate-800 text-sm truncate">
                          {appt.reasonForVisit || "General Consultation"}
                        </h5>
                        <StatusPill status={appt.status} />
                      </div>
                      <p className="text-xs text-slate-500">
                        Doctor: <span className="font-semibold text-slate-700">{appt.doctorName}</span> • Token:{" "}
                        <span className="font-mono font-bold text-teal-800">#{appt.queueNumber}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pastAppts.length > 0 ? (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Completed & Past Visits</h4>
              <div className="space-y-3">
                {pastAppts.map((appt) => (
                  <div
                    key={appt.appointmentId}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {appt.availableDate} • {appt.startTime}
                      </span>
                      <StatusPill status={appt.status} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-semibold text-slate-800 text-sm">
                          {appt.reasonForVisit || "Clinical Consultation"}
                        </h5>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Seen by: <span className="font-medium text-slate-700">{appt.doctorName}</span>
                        </p>
                      </div>
                      <span className="font-mono text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">
                        Token #{appt.queueNumber}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            upcomingAppts.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center space-y-3 py-12">
                <Calendar className="w-10 h-10 text-slate-200" />
                <p className="text-slate-500 text-sm">No appointment history found for this patient.</p>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
