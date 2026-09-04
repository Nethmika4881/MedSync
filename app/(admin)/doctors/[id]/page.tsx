"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useDoctorStore } from "@/lib/stores/doctorStore";
import { useAppointmentStore } from "@/lib/stores/appointmentStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/catms/StatusPill";
import { getAvatarGradient } from "@/components/catms/BookingModal";
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  Star,
  GraduationCap,
  DollarSign,
  AlertCircle,
  FileText,
} from "lucide-react";

export default function DoctorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { doctors } = useDoctorStore();
  const { appointments } = useAppointmentStore();

  const doctor = doctors.find((d) => d.doctorId === id);

  if (!doctor) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-700">Doctor Not Found</h2>
        <Button onClick={() => router.push("/app/doctors")} variant="outline">
          Back to Directory
        </Button>
      </div>
    );
  }

  const doctorAppointments = appointments
    .filter((a) => a.doctorId === id)
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  const upcomingAppts = doctorAppointments.filter((a) =>
    ["Confirmed", "Pending", "Rescheduled"].includes(a.status)
  );
  const pastAppts = doctorAppointments.filter((a) =>
    ["Completed", "Cancelled", "Checked-out"].includes(a.status)
  );

  const gradient = getAvatarGradient(doctor.avatar);

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-10">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/app/doctors")}
          className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Doctors
        </button>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl h-9 text-xs">
            Edit Doctor
          </Button>
        </div>
      </div>

      {/* Main Profile Header */}
      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
        <div className={`h-32 bg-gradient-to-r ${gradient}`}></div>
        <CardContent className="p-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row gap-6 sm:items-end -mt-12 sm:-mt-16 mb-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border-4 border-white bg-white shadow-sm shrink-0 flex items-center justify-center overflow-hidden">
              <div
                className={`w-full h-full flex items-center justify-center text-white text-4xl font-bold bg-gradient-to-br ${gradient}`}
              >
                {doctor.avatar.replace(/[0-9]/g, "")}
              </div>
            </div>
            <div className="flex-1 pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight flex items-center gap-2">
                    Dr. {doctor.name}
                  </h1>
                  <p className="text-slate-500 text-sm flex items-center gap-2 mt-1 font-medium">
                    <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 rounded-md text-slate-600">
                      {doctor.doctorId}
                    </span>
                    • <span className="text-[var(--brand-primary)] font-semibold">{doctor.specialization}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg font-semibold flex items-center gap-1.5 border border-amber-100">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    {doctor.rating} <span className="text-amber-600/70 text-xs ml-0.5">({doctor.reviewCount})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-2 mb-6">
            <p className="text-slate-600 text-sm leading-relaxed max-w-4xl">{doctor.bio}</p>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact & Location</h3>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 text-sm">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-700 font-medium">{doctor.phone}</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-700 font-medium">{doctor.email}</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-700 font-medium">{doctor.branchName}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Professional Info</h3>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 text-sm">
                  <GraduationCap className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-700">{doctor.education}</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-700">{doctor.experience} Years Experience</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm">
                  <DollarSign className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-700">${doctor.consultationFee} per visit</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Availability</h3>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${doctor.isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className="text-sm font-medium text-slate-700">
                    {doctor.isAvailable ? "Currently Accepting Appointments" : "Not Available"}
                  </span>
                </div>
                {doctor.fullyBookedDate && (
                  <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Fully booked on {new Date(doctor.fullyBookedDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card className="border-slate-200 shadow-sm rounded-2xl h-full flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--brand-primary)]" />
            Doctor's Schedule & History
          </h3>
        </div>
        <CardContent className="p-6 flex-1">
          {upcomingAppts.length > 0 && (
            <div className="mb-8">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Upcoming Visits</h4>
              <div className="space-y-3">
                {upcomingAppts.map((appt) => (
                  <div key={appt.appointmentId} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-[var(--brand-primary)] bg-[#f2faf8] hover:shadow-md transition-shadow">
                    <div className="shrink-0 flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-1 sm:w-28 border-b sm:border-b-0 sm:border-r border-[#16A085]/20 pb-3 sm:pb-0 sm:pr-4">
                      <div className="text-sm font-bold text-slate-800">{new Date(appt.dateTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                      <div className="text-xs font-semibold text-[var(--brand-primary)] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(appt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h5 className="font-bold text-slate-800 text-sm truncate">{appt.visitType}</h5>
                        <StatusPill status={appt.status} />
                      </div>
                      <p className="text-xs text-slate-500">Patient: <span className="font-medium text-slate-700">{appt.patientName}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pastAppts.length > 0 ? (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Past Visits</h4>
              <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent hidden-before">
                {pastAppts.map((appt) => (
                  <div key={appt.appointmentId} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white bg-slate-100 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-400">{new Date(appt.dateTime).toLocaleDateString()}</span>
                        <StatusPill status={appt.status} />
                      </div>
                      <h5 className="font-semibold text-slate-800 text-sm">{appt.visitType}</h5>
                      <p className="text-xs text-slate-500 mt-1">Patient: {appt.patientName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            upcomingAppts.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center space-y-3 py-16">
                <Calendar className="w-12 h-12 text-slate-200" />
                <p className="text-slate-500 text-sm">No appointment history found for this doctor.</p>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
