"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { usePatientStore } from "@/lib/stores/patientStore";
import { useAppointmentStore } from "@/lib/stores/appointmentStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AvatarWithName } from "@/components/catms/AvatarWithName";
import { StatusPill } from "@/components/catms/StatusPill";
import { ContraindicationBanner } from "@/components/catms/ContraindicationBanner";
import {
  ArrowLeft,
  Calendar,
  Activity,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  AlertCircle,
  FileText,
  Clock,
} from "lucide-react";

export default function PatientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { patients, allergies, conditions } = usePatientStore();
  const { appointments } = useAppointmentStore();

  const patient = patients.find((p) => p.patientId === id);

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-700">Patient Not Found</h2>
        <Button onClick={() => router.push("/app/patients")} variant="outline">
          Back to Directory
        </Button>
      </div>
    );
  }

  const patientAllergies = allergies.filter((a) => a.patientId === id);
  const patientConditions = conditions.filter((c) => c.patientId === id);
  const patientAppointments = appointments
    .filter((a) => a.patientId === id)
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  const upcomingAppts = patientAppointments.filter((a) =>
    ["Confirmed", "Pending", "Rescheduled"].includes(a.status)
  );
  const pastAppts = patientAppointments.filter((a) =>
    ["Completed", "Cancelled", "Checked-out"].includes(a.status)
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-10">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/app/patients")}
          className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Patients
        </button>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl h-9 text-xs">
            Edit Patient
          </Button>
          <Button
            className="rounded-xl h-9 text-xs bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white"
            onClick={() => router.push("/app/appointments")}
          >
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Book Appointment
          </Button>
        </div>
      </div>

      {/* Severe Allergy Warning */}
      {patientAllergies.some((a) => a.severity === "Severe" || a.severity === "Life-threatening") && (
        <ContraindicationBanner
          patientName={patient.name}
          allergyName={
            patientAllergies.find((a) => a.severity === "Severe" || a.severity === "Life-threatening")
              ?.allergenName || "Multiple Allergens"
          }
        />
      )}

      {/* Main Profile Header */}
      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
        <div className="h-24 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
        <CardContent className="p-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row gap-6 sm:items-end -mt-10 sm:-mt-12 mb-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white bg-white shadow-sm shrink-0 flex items-center justify-center overflow-hidden">
              <div
                className="w-full h-full flex items-center justify-center text-white text-3xl font-bold"
                style={{ background: "linear-gradient(135deg, #16A085, #0F7A66)" }}
              >
                {patient.avatar}
              </div>
            </div>
            <div className="flex-1 pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                    {patient.name}
                  </h1>
                  <p className="text-slate-500 text-sm flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 rounded-md">
                      {patient.patientId}
                    </span>
                    • {patient.gender} • {patient.age} yrs
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg font-semibold flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4" />
                    Blood: {patient.bloodGroup}
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
                  <span className="text-slate-700 font-medium">{patient.phone}</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-700 font-medium">{patient.email}</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-700 leading-tight">{patient.address}, {patient.city}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Emergency Contact</h3>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 text-sm">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500 font-bold text-xs">
                    {patient.emergencyContactName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{patient.emergencyContactName}</p>
                    <p className="text-xs text-slate-500">{patient.emergencyContactRelation} • {patient.emergencyContactPhone}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Additional Info</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Date of Birth</span>
                  <span className="font-medium text-slate-700">{patient.dob}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Insurance ID</span>
                  <span className="font-medium text-slate-700">{patient.insuranceId || "Self-pay"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Registered</span>
                  <span className="font-medium text-slate-700">{patient.registeredAt}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Clinical) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-200 shadow-sm rounded-2xl">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                Allergies
              </h3>
              <span className="text-xs font-semibold text-slate-500 bg-slate-200 px-2 rounded-full">{patientAllergies.length}</span>
            </div>
            <CardContent className="p-0">
              {patientAllergies.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {patientAllergies.map((a) => (
                    <li key={a.allergyId} className="px-5 py-3">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-slate-800 text-sm">{a.allergenName}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                          a.severity === "Severe" || a.severity === "Life-threatening" 
                            ? "bg-rose-100 text-rose-700"
                            : a.severity === "Moderate" 
                            ? "bg-amber-100 text-amber-700" 
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {a.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Reaction: {a.reactionDetails}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-5 py-6 text-center text-slate-400 text-sm italic">
                  No known allergies recorded.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm rounded-2xl">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                Conditions
              </h3>
              <span className="text-xs font-semibold text-slate-500 bg-slate-200 px-2 rounded-full">{patientConditions.length}</span>
            </div>
            <CardContent className="p-0">
              {patientConditions.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {patientConditions.map((c) => (
                    <li key={c.pcId} className="px-5 py-3 flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        c.status === "Active" ? "bg-emerald-500" : "bg-slate-300"
                      }`} />
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{c.conditionName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Diagnosed: {c.diagnosedDate}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-5 py-6 text-center text-slate-400 text-sm italic">
                  No conditions recorded.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Appointments) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm rounded-2xl h-full flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--brand-primary)]" />
                Appointment History
              </h3>
            </div>
            <CardContent className="p-6 flex-1">
              {upcomingAppts.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Upcoming</h4>
                  <div className="space-y-3">
                    {upcomingAppts.map((appt) => (
                      <div key={appt.appointmentId} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-[var(--brand-primary)] bg-[#f2faf8]">
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
                          <p className="text-xs text-slate-500">with <span className="font-medium text-slate-700">{appt.doctorName}</span> ({appt.doctorSpecialization})</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pastAppts.length > 0 ? (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Past</h4>
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
                          <p className="text-xs text-slate-500 mt-1">Dr. {appt.doctorName.replace("Dr. ", "")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                upcomingAppts.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-10">
                    <Calendar className="w-10 h-10 text-slate-200" />
                    <p className="text-slate-500 text-sm">No appointments found for this patient.</p>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
