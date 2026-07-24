"use client";

import React, { useState } from "react";
import { useAppointmentStore } from "@/lib/stores/appointmentStore";
import { useRole, useCurrentUser } from "@/lib/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/catms/StatusPill";
import { EmptyState } from "@/components/catms/EmptyState";
import { Calendar, Search, MoreHorizontal, UserCheck, XCircle } from "lucide-react";
import { AvatarWithName } from "@/components/catms/AvatarWithName";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function AppointmentsPage() {
  const { appointments, checkInAppointment, cancelAppointment } = useAppointmentStore();
  const role = useRole();
  const user = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState("");

  if (!role || !user) return null;

  // Filter based on role
  let filtered = appointments;
  if (role === "doctor") {
    filtered = filtered.filter(a => a.doctorId === user.userId);
  } else if (role === "patient") {
    filtered = filtered.filter(a => a.patientId === user.userId);
  }

  if (searchTerm) {
    const q = searchTerm.toLowerCase();
    filtered = filtered.filter(a => 
      a.patientName.toLowerCase().includes(q) || 
      a.doctorName.toLowerCase().includes(q) ||
      a.appointmentId.toLowerCase().includes(q)
    );
  }

  const upcoming = filtered.filter(a => ["Confirmed", "Rescheduled", "Pending", "Checked-in"].includes(a.status));
  const past = filtered.filter(a => ["Completed", "Cancelled", "Checked-out"].includes(a.status));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Appointments</h2>
          <p className="text-slate-500">Manage all scheduling and patient visits.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-sm focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none transition-all bg-white"
            />
          </div>
          {(role === "admin" || role === "receptionist" || role === "patient") && (
            <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl h-10 px-4">
              <Calendar className="w-4 h-4 mr-2" />
              New Appointment
            </Button>
          )}
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Date & Time</th>
                {role !== "patient" && <th className="px-6 py-4 font-semibold">Patient</th>}
                {role !== "doctor" && <th className="px-6 py-4 font-semibold">Doctor</th>}
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {upcoming.map(appt => (
                <tr key={appt.appointmentId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{new Date(appt.dateTime).toLocaleDateString()}</div>
                    <div className="text-slate-500 text-xs">{new Date(appt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({appt.duration} min)</div>
                  </td>
                  {role !== "patient" && (
                    <td className="px-6 py-4">
                      <AvatarWithName name={appt.patientName} subtitle={appt.appointmentId} size="sm" />
                    </td>
                  )}
                  {role !== "doctor" && (
                    <td className="px-6 py-4">
                      <AvatarWithName name={appt.doctorName} subtitle={appt.doctorSpecialization} size="sm" />
                    </td>
                  )}
                  <td className="px-6 py-4">{appt.visitType}</td>
                  <td className="px-6 py-4">
                    <StatusPill status={appt.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 rounded-lg">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl">
                        {(role === "receptionist" || role === "admin" || role === "nurse") && appt.status === "Confirmed" && (
                          <DropdownMenuItem onClick={() => checkInAppointment(appt.appointmentId)} className="cursor-pointer">
                            <UserCheck className="w-4 h-4 mr-2 text-green-600" />
                            <span>Check-in Patient</span>
                          </DropdownMenuItem>
                        )}
                        {(appt.status === "Confirmed" || appt.status === "Pending" || appt.status === "Rescheduled") && (
                          <DropdownMenuItem onClick={() => cancelAppointment(appt.appointmentId, "User cancelled")} className="cursor-pointer text-red-600 focus:text-red-700">
                            <XCircle className="w-4 h-4 mr-2" />
                            <span>Cancel Appointment</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {upcoming.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState icon={Calendar} title="No upcoming appointments" description="There are no scheduled appointments matching your criteria." />
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
