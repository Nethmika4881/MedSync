"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calendar, Edit, Eye, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/catms/StatusPill";
import { EmptyState } from "@/components/catms/EmptyState";
import { StartConsultationButton } from "@/components/doctor/StartConsultationButton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatClockTime, formatDay } from "@/lib/doctorFormat";
import type { ConsultationHistoryItem } from "@/lib/doctorTypes";
import type { Appointment } from "@/lib/types";

interface ConsultationsProps {
  queue: Appointment[];            // today's appointments
  records: ConsultationHistoryItem[];
}

const RECORD_PILL: Record<ConsultationHistoryItem["status"], string> = {
  Draft: "In-Progress",
  "Follow-up": "Pending",
  Completed: "Completed",
};

export default function ConsultationsPage({ queue, records }: ConsultationsProps) {
  const [activeTab, setActiveTab] = useState("queue");
  const todaysQueue = queue.filter((a) => a.status !== "Completed");

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical Consultations</h2>
        <p className="text-slate-500">Manage your patient queue and consultation records.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100/50 p-1 rounded-xl">
          <TabsTrigger value="queue" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Calendar className="w-4 h-4 mr-2" /> Today&apos;s Queue ({todaysQueue.length})
          </TabsTrigger>
          <TabsTrigger value="records" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <FileText className="w-4 h-4 mr-2" /> Past Records ({records.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-6 space-y-6">
          {todaysQueue.map((appt) => (
            <Card key={appt.appointmentId} className="border-l-4 border-l-[var(--brand-primary)] shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{appt.patientName}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-2 flex-wrap">
                      {formatClockTime(appt.dateTime)}
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      Ticket #{appt.ticketNumber}
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      {appt.visitType}
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <StatusPill status={appt.status} />
                    </p>
                  </div>
                  <StartConsultationButton
                    appointmentId={appt.appointmentId}
                    status={appt.status}
                    size="default"
                    startLabel="Start Consultation"
                    resumeLabel="Resume Consultation"
                  />
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-sm font-semibold text-slate-900 mb-2">Reason for Visit</p>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {appt.notes || "No reason provided at booking."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}

          {todaysQueue.length === 0 && (
            <Card className="border-slate-200 shadow-sm">
              <EmptyState icon={Calendar} title="No patients in queue" description="You have no pending patients for today." />
            </Card>
          )}
        </TabsContent>

        <TabsContent value="records" className="mt-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            {records.length === 0 ? (
              <EmptyState icon={FileText} title="No records yet" description="Saved and completed consultations appear here." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Patient</th>
                      <th className="px-6 py-4">Diagnosis</th>
                      <th className="px-6 py-4">Orders</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {records.map((record) => (
                      <tr key={record.consultationId} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-semibold text-slate-900">{formatDay(record.date)}</td>
                        <td className="px-6 py-4 font-medium text-[var(--brand-primary)]">{record.patientName}</td>
                        <td className="px-6 py-4">{record.diagnosis || "Pending Diagnosis"}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {record.treatmentCount} treatment{record.treatmentCount === 1 ? "" : "s"} • {record.prescriptionCount} Rx
                        </td>
                        <td className="px-6 py-4">
                          <StatusPill status={RECORD_PILL[record.status]} />
                          {record.status === "Follow-up" && record.followUpDate && (
                            <p className="text-xs text-slate-400 mt-1">Follow-up {formatDay(record.followUpDate)}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/doctor/consultations/${record.appointmentId}`}>
                            <Button size="sm" variant="outline" className="rounded-lg h-8">
                              {record.status === "Draft" ? (
                                <><Edit className="w-4 h-4 mr-2" /> Edit</>
                              ) : (
                                <><Eye className="w-4 h-4 mr-2" /> View</>
                              )}
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
