"use client";

import React from "react";
import { useCurrentUser, useRole } from "@/lib/stores/authStore";
import { useClinicalStore } from "@/lib/stores/clinicalStore";
import { usePatientStore } from "@/lib/stores/patientStore";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Download, CheckCircle2, ShieldAlert } from "lucide-react";


export default function MedicalRecordsPage() {
  const user = useCurrentUser();
  const role = useRole();
  const { consultations, treatments } = useClinicalStore();
  const { allergies, conditions } = usePatientStore();
  
  if (!user || role !== "patient") return null;


  const myConsultations = consultations.filter(c => c.patientId === user.userId);
  const myTreatments = treatments.filter(t => t.patientId === user.userId);
  const myAllergies = allergies.filter(a => a.patientId === user.userId);
  const myConditions = conditions.filter(c => c.patientId === user.userId);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Medical Records</h2>
        <p className="text-slate-500">View your clinical history, diagnoses, and test results.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <Card className="border-slate-200 shadow-sm overflow-hidden md:col-span-2">
          <div className="h-3 bg-gradient-to-r from-blue-500 to-indigo-600" />
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">

              <div className="w-8 h-8 bg-blue-100 text-blue-600 flex items-center justify-center" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                <FileText className="w-4 h-4" />
              </div>
              Health Summary
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Active Conditions</p>
                {myConditions.length > 0 ? (
                  <div className="space-y-2">
                    {myConditions.map(c => (
                      <div key={c.conditionId} className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{c.conditionName}</p>
                          <p className="text-xs text-slate-500">Diagnosed: {c.diagnosedDate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No active conditions recorded.</p>
                )}
              </div>
              
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Allergies</p>
                {myAllergies.length > 0 ? (
                  <div className="space-y-2">
                    {myAllergies.map(a => (
                      <div key={a.allergyId} className="flex items-start gap-2 bg-red-50 p-3 rounded-xl border border-red-100">
                        <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-red-900">{a.allergenName}</p>
                          <p className="text-xs text-red-700 font-medium">{a.severity} Severity</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No known allergies.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>


        <div className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Consultation History</h3>
          {myConsultations.map(consult => (
            <Card key={consult.consultationId} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{consult.doctorName}</h4>
                    <p className="text-sm text-[var(--brand-primary)] font-medium">{new Date(consult.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <button className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors">
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Diagnosis</p>
                    <p className="text-sm text-slate-900 font-medium">{consult.diagnosis || "No diagnosis recorded"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Symptoms Reported</p>
                    <p className="text-sm text-slate-700">{consult.symptoms}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Doctor's Notes</p>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">{consult.notes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {myConsultations.length === 0 && (
            <p className="text-sm text-slate-500 p-6 text-center border rounded-xl border-dashed">No past consultations found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
