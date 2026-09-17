"use client";

import React, { useMemo } from "react";
import { useBranchStore } from "@/hooks/use-branch-store";
import { useAppointmentStore } from "@/lib/stores/appointmentStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CheckCircle2, Ticket } from "lucide-react";
import { AvatarWithName } from "@/components/catms/AvatarWithName";
import { cn } from "@/lib/utils";

export default function FrontDeskDashboard() {
  const activeBranchId = useBranchStore((s) => s.activeBranchId);
  const { appointments } = useAppointmentStore();

  // Filter appointments for the active branch and "today" (ignoring strict date for mock data purposes, just grouping by status)
  const branchAppointments = useMemo(() => {
    if (!activeBranchId) return [];
    return appointments.filter((a) => a.branchId === activeBranchId && a.status !== "Cancelled");
  }, [appointments, activeBranchId]);

  const totalAppointments = branchAppointments.length;
  const waitingPatients = branchAppointments.filter((a) => a.status === "Checked-in");
  const inProgressPatients = branchAppointments.filter((a) => a.status === "In-Progress");
  const completedPatients = branchAppointments.filter((a) => a.status === "Completed");

  if (!activeBranchId) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500">
        <p>Please log in to view the branch dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Branch Dashboard</h2>
        <p className="text-slate-500">Real-time overview of today's queue and serving numbers.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Appointments</CardTitle>
            <Users className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalAppointments}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Waiting (Checked-In)</CardTitle>
            <Clock className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{waitingPatients.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">In Progress</CardTitle>
            <Ticket className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{inProgressPatients.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Completed</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedPatients.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Queue Section */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          Currently Waiting
        </h3>
        
        {waitingPatients.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-slate-500 bg-slate-50">
            No patients are currently checked-in and waiting.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {waitingPatients.map((appt) => (
              <Card key={appt.appointmentId} className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-50 rounded-bl-full flex items-start justify-end p-3 shadow-inner">
                  <div className="text-xl font-bold text-amber-700 tracking-tighter">#{appt.ticketNumber}</div>
                </div>
                <CardContent className="p-5 pt-6">
                  <div className="flex flex-col gap-4">
                    <AvatarWithName 
                      name={appt.patientName} 
                      subtitle={`Patient ID: ${appt.patientId}`} 
                    />
                    
                    <div className="bg-slate-50 rounded-lg p-3 text-sm border border-slate-100 mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-500 text-xs">Seeing Doctor:</span>
                        <span className="font-semibold text-slate-700">{appt.doctorName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-xs">Session:</span>
                        <span className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full mt-1",
                          appt.session === "Morning" ? "bg-amber-100 text-amber-800" :
                          appt.session === "Afternoon" ? "bg-sky-100 text-sky-800" :
                          "bg-indigo-100 text-indigo-800"
                        )}>
                          {appt.session}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
