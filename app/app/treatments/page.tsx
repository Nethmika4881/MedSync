"use client";

import React, { useState } from "react";
import { useClinicalStore } from "@/lib/stores/clinicalStore";
import { useRole, useCurrentUser } from "@/lib/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/catms/StatusPill";
import { Activity, Syringe, ClipboardCheck, Clock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TreatmentsPage() {
  const { treatments, markTreatmentPerformed } = useClinicalStore();
  const role = useRole();
  const user = useCurrentUser();
  const [activeTab, setActiveTab] = useState("pending");

  if (!role || (role !== "nurse" && role !== "doctor")) return null;

  // Filter out non-nursing tasks if possible, but for demo we just show all treatments not completed
  const pendingTreatments = treatments.filter(t => t.status !== "Completed");
  const completedTreatments = treatments.filter(t => t.status === "Completed");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical Treatments & Tasks</h2>
          <p className="text-slate-500">Administer patient treatments, vitals, and pending clinical orders.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button onClick={() => setActiveTab("pending")}
          className={cn("px-4 py-3 text-sm font-bold border-b-2 transition-colors", activeTab === "pending" ? "border-[var(--brand-primary)] text-[var(--brand-primary)]" : "border-transparent text-slate-500 hover:text-slate-900")}>
          Pending Tasks ({pendingTreatments.length})
        </button>
        <button onClick={() => setActiveTab("completed")}
          className={cn("px-4 py-3 text-sm font-bold border-b-2 transition-colors", activeTab === "completed" ? "border-[var(--brand-primary)] text-[var(--brand-primary)]" : "border-transparent text-slate-500 hover:text-slate-900")}>
          Completed
        </button>
      </div>

      {activeTab === "pending" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingTreatments.map(treatment => (
            <Card key={treatment.treatmentId} className="border-l-4 border-l-amber-400 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    {/* CSS cross/plus shape indicator */}
                    <div className="w-8 h-8 bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"
                      style={{ clipPath: "polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)" }}>
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{treatment.patientName}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Ordered {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="font-semibold text-[var(--brand-primary)] text-sm">{treatment.treatmentName}</p>
                  <p className="text-sm text-slate-600 mt-1">{treatment.description || "No additional instructions."}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-xs font-semibold px-2 py-1 bg-amber-50 text-amber-700 rounded border border-amber-200">
                    Awaiting Action
                  </span>
                  <Button 
                    onClick={() => markTreatmentPerformed(treatment.treatmentId, user?.name || "Nurse")}
                    className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-lg h-9 px-4 text-xs font-bold"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" /> Mark Administered
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {pendingTreatments.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Activity className="w-8 h-8 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold">All caught up!</p>
              <p className="text-sm">There are no pending treatments or tasks.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "completed" && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Time Administered</th>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Treatment / Task</th>
                  <th className="px-6 py-4">Administered By</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {completedTreatments.map(t => (
                  <tr key={t.treatmentId} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">{t.performedAt ? new Date(t.performedAt).toLocaleString() : 'N/A'}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{t.patientName}</td>
                    <td className="px-6 py-4 text-[var(--brand-primary)] font-medium">{t.treatmentName}</td>
                    <td className="px-6 py-4 text-slate-500">{t.performedBy}</td>
                    <td className="px-6 py-4 text-right">
                      <StatusPill status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
