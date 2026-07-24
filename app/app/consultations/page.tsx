"use client";

import React, { useState } from "react";
import { useClinicalStore } from "@/lib/stores/clinicalStore";
import { useAppointmentStore } from "@/lib/stores/appointmentStore";
import { usePatientStore } from "@/lib/stores/patientStore";
import { useRole, useCurrentUser } from "@/lib/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/catms/StatusPill";
import { EmptyState } from "@/components/catms/EmptyState";
import { SafetyInfoBanner } from "@/components/catms/SafetyInfoBanner";
import { FileText, Edit, ClipboardPlus, Calendar, ArrowRight } from "lucide-react";
import { AvatarWithName } from "@/components/catms/AvatarWithName";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function ConsultationsPage() {
  const { consultations } = useClinicalStore();
  const { appointments } = useAppointmentStore();
  const { patients, allergies, conditions } = usePatientStore();
  const role = useRole();
  const user = useCurrentUser();
  const [activeTab, setActiveTab] = useState("queue");

  if (!role || !user) return null;

  // For doctors, show their scheduled appointments today
  const todaysQueue = appointments.filter(
    a => a.doctorId === user.userId && (a.status === "Checked-in" || a.status === "Confirmed")
  );

  const myConsultations = consultations.filter(c => c.doctorId === user.userId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical Consultations</h2>
          <p className="text-slate-500">Manage your patient queue and consultation records.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100/50 p-1 rounded-xl">
          <TabsTrigger value="queue" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Calendar className="w-4 h-4 mr-2" /> Today's Queue ({todaysQueue.length})
          </TabsTrigger>
          <TabsTrigger value="records" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <FileText className="w-4 h-4 mr-2" /> Past Records
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-6 space-y-6">
          {todaysQueue.map(appt => {
            const patientAllergies = allergies.filter(a => a.patientId === appt.patientId);
            const patientConditions = conditions.filter(c => c.patientId === appt.patientId);

            return (
              <Card key={appt.appointmentId} className="border-l-4 border-l-[var(--brand-primary)] shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">{appt.patientName}</h3>
                      <p className="text-sm text-slate-500 flex items-center gap-2">
                        {new Date(appt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        {appt.visitType}
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <StatusPill status={appt.status} />
                      </p>
                    </div>
                    <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl px-6">
                      <ClipboardPlus className="w-4 h-4 mr-2" /> Start Consultation
                    </Button>
                  </div>

                  <SafetyInfoBanner 
                    patientName={appt.patientName} 
                    allergies={patientAllergies} 
                    conditions={patientConditions} 
                  />

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-sm font-semibold text-slate-900 mb-2">Chief Complaint / Reason for Visit</p>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {appt.notes || "No notes provided by reception."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {todaysQueue.length === 0 && (
            <Card className="border-slate-200 shadow-sm">
              <EmptyState icon={Calendar} title="No patients in queue" description="You have no pending checked-in patients for today." />
            </Card>
          )}
        </TabsContent>

        <TabsContent value="records" className="mt-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Patient</th>
                    <th className="px-6 py-4">Diagnosis</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {myConsultations.map(record => (
                    <tr key={record.consultationId} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-semibold text-slate-900">{record.date}</td>
                      <td className="px-6 py-4 font-medium text-[var(--brand-primary)]">{record.patientName}</td>
                      <td className="px-6 py-4">{record.diagnosis || "Pending Diagnosis"}</td>
                      <td className="px-6 py-4"><StatusPill status={record.followUpRequired ? "In-Progress" : "Completed"} /></td>
                      <td className="px-6 py-4 text-right">
                        <Button size="sm" variant="outline" className="rounded-lg h-8">
                          <Edit className="w-4 h-4 mr-2" /> View/Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
