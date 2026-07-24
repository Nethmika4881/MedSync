"use client";

import React, { useState } from "react";
import { usePharmacyStore } from "@/lib/stores/pharmacyStore";
import { usePatientStore } from "@/lib/stores/patientStore";
import { useRole, useCurrentUser } from "@/lib/stores/authStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/catms/StatusPill";
import { EmptyState } from "@/components/catms/EmptyState";
import { Pill, CheckCircle2, AlertCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { checkContraindication } from "@/lib/contraindication";
import { ContraindicationBanner } from "@/components/catms/ContraindicationBanner";
import { AvatarWithName } from "@/components/catms/AvatarWithName";

export default function PharmacyPage() {
  const { prescriptions, medications, stock, dispensePrescription } = usePharmacyStore();
  const { allergies } = usePatientStore();
  const role = useRole();
  const user = useCurrentUser();
  const [activeTab, setActiveTab] = useState("queue");

  if (!role || !user) return null;
  if (role === "patient") {
    // Basic view for patients
    const myPrescriptions = prescriptions.filter(p => p.patientId === user.userId);
    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Prescriptions</h2>
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Medication</th>
                <th className="px-6 py-4">Dosage / Instructions</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {myPrescriptions.map(p => (
                <tr key={p.prescriptionId} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-slate-900">{p.issuedDate}</td>
                  <td className="px-6 py-4 font-semibold text-[var(--brand-primary)]">{p.medicationName}</td>
                  <td className="px-6 py-4">
                    <div>{p.dosage} — {p.frequency}</div>
                    <div className="text-xs text-slate-500 mt-1">{p.instructions}</div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill status={p.dispensed ? "Dispensed" : "Pending"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  }

  // Pharmacist / Admin View
  const pendingQueue = prescriptions.filter(p => !p.dispensed);
  const dispensedQueue = prescriptions.filter(p => p.dispensed);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Pharmacy</h2>
          <p className="text-slate-500">Manage prescriptions, dispense medications, and monitor stock.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100/50 p-1 rounded-xl">
          <TabsTrigger value="queue" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Prescription Queue</TabsTrigger>
          <TabsTrigger value="inventory" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Inventory Stock</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-6 space-y-6">
          {pendingQueue.map(p => {
            const med = medications.find(m => m.medicationId === p.medicationId);
            const patientAllergies = allergies.filter(a => a.patientId === p.patientId);
            let contraindication = null;
            if (med) {
              contraindication = checkContraindication(patientAllergies, med);
            }

            return (
              <Card key={p.prescriptionId} className={`border-l-4 overflow-hidden shadow-sm ${contraindication?.conflict ? 'border-l-red-500' : 'border-l-[var(--brand-primary)]'}`}>
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <AvatarWithName name={p.patientName} subtitle={p.patientId} size="sm" />
                        <span className="text-slate-300">|</span>
                        <span className="text-xs font-semibold text-slate-500">Prescribed by {p.doctorId}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-xs font-semibold text-slate-500">{p.issuedDate}</span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Pill className="w-5 h-5 text-blue-600" />
                        {p.medicationName} ({p.dosage})
                      </h4>
                      <p className="text-sm text-slate-600 mt-2 font-medium">Freq: {p.frequency} <span className="text-slate-300 mx-2">|</span> Duration: {p.duration}</p>
                      <p className="text-sm text-slate-500 mt-1 italic">"{p.instructions}"</p>
                      
                      {contraindication && <ContraindicationBanner result={contraindication} />}
                    </div>
                    <div className="shrink-0 flex md:flex-col items-center md:items-end gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                      <Button 
                        disabled={!!contraindication?.conflict}
                        onClick={() => dispensePrescription(p.prescriptionId, user.name)}
                        className={`w-full md:w-auto h-10 px-6 rounded-xl text-white font-medium ${contraindication?.conflict ? 'bg-slate-300 hover:bg-slate-300' : 'bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)]'}`}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Dispense Now
                      </Button>
                      {contraindication?.conflict && (
                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-wide text-center">Cannot Dispense</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {pendingQueue.length === 0 && (
            <Card className="border-slate-200 shadow-sm">
              <EmptyState icon={CheckCircle2} title="Queue is empty" description="All prescriptions have been dispensed." />
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Medication</th>
                    <th className="px-6 py-4">Stock Level</th>
                    <th className="px-6 py-4">Reorder Level</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Expiry Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {stock.map(s => {
                    const isLow = s.quantityOnHand <= s.reorderLevel;
                    return (
                      <tr key={s.stockId} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-semibold text-slate-900">{s.medicationName}</td>
                        <td className={`px-6 py-4 font-bold ${isLow ? 'text-red-600' : 'text-slate-900'}`}>{s.quantityOnHand} units</td>
                        <td className="px-6 py-4 text-slate-500">{s.reorderLevel} units</td>
                        <td className="px-6 py-4">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                              <AlertCircle className="w-3 h-3" />
                              Low Stock
                            </span>
                          ) : (
                            <StatusPill status="Active" />
                          )}
                        </td>
                        <td className="px-6 py-4">{s.expiryDate}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
