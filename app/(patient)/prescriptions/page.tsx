"use client";

import React from "react";
import { useCurrentUser, useRole } from "@/lib/stores/authStore";
import { usePharmacyStore } from "@/lib/stores/pharmacyStore";
import { Card, CardContent } from "@/components/ui/card";
import { Pill, AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";


import { doctors } from "@/lib/constants";

export default function MyPrescriptionsPage() {
  const user = useCurrentUser();
  const role = useRole();
  const { prescriptions } = usePharmacyStore();
  
  if (!user || role !== "patient") return null;



  const myPrescriptions = prescriptions.filter(p => p.patientId === user.userId).map(p => ({
    ...p,
    status: p.pickedUp ? "Completed" : p.dispensed ? "Dispensed" : "Pending",
    doctorName: doctors.find((d: any) => d.doctorId === p.doctorId)?.name || "Unknown Doctor"
  }));
  const activePrescriptions = myPrescriptions.filter(p => p.status === "Dispensed" || p.status === "Pending");
  const pastPrescriptions = myPrescriptions.filter(p => p.status === "Completed" || p.status === "Cancelled");

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Prescriptions</h2>
        <p className="text-slate-500">View active medications and request refills.</p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Active Medications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePrescriptions.map(presc => (
              <Card key={presc.prescriptionId} className="border-[var(--brand-primary)] shadow-sm shadow-blue-500/10">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">

                    <div className="w-12 h-12 bg-blue-100 text-[var(--brand-primary)] flex flex-col items-center justify-center shrink-0"
                      style={{ borderRadius: "24px", clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}>
                      <Pill className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-900">{presc.medicationName}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          {presc.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 font-medium mb-2">{presc.dosage} — {presc.frequency}</p>
                      
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-600 mb-3">
                        <span className="font-semibold text-slate-700">Instructions:</span> {presc.instructions}
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Duration: <strong className="text-slate-900">{presc.duration}</strong></span>
                        <button className="flex items-center gap-1 font-semibold text-[var(--brand-primary)] hover:underline">
                          <RotateCcw className="w-3.5 h-3.5" /> Request Refill
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {activePrescriptions.length === 0 && (
              <p className="text-sm text-slate-500 p-6 text-center border rounded-xl border-dashed col-span-full">You have no active prescriptions.</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Past Prescriptions</h3>
          <div className="space-y-3">
            {pastPrescriptions.map(presc => (
              <Card key={presc.prescriptionId} className="border-slate-200 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-10 h-10 bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 rounded-full">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-700">{presc.medicationName}</h4>
                      <p className="text-xs text-slate-500">{presc.dosage} • Prescribed by {presc.doctorName}</p>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto text-left sm:text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 mb-1">
                      {presc.status === "Completed" ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <AlertCircle className="w-3 h-3" />}
                      {presc.status}
                    </span>
                    <p className="text-xs text-slate-400">{presc.issuedDate}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
