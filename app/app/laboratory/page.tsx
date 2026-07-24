"use client";

import React, { useState } from "react";
import { useClinicalStore } from "@/lib/stores/clinicalStore";
import { useRole } from "@/lib/stores/authStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/catms/StatusPill";
import { EmptyState } from "@/components/catms/EmptyState";
import { FlaskConical, Search, CheckCircle2, FileUp, AlertTriangle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function LaboratoryPage() {
  const { treatments, markTreatmentPerformed } = useClinicalStore();
  const role = useRole();
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");

  if (!role) return null;

  // Filter only lab tests (treating treatments with Lab-related names or any treatment as mock lab orders)
  // For mock purposes, we will treat all treatments that aren't "Surgery" as Lab/Clinical tests
  const labOrders = treatments.filter(t => !t.treatmentName.toLowerCase().includes("surgery"));
  
  const pendingOrders = labOrders.filter(t => t.status !== "Completed" && (t.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || t.treatmentName.toLowerCase().includes(searchTerm.toLowerCase())));
  const completedOrders = labOrders.filter(t => t.status === "Completed" && (t.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || t.treatmentName.toLowerCase().includes(searchTerm.toLowerCase())));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Laboratory & Diagnostics</h2>
          <p className="text-slate-500">Manage pending lab orders and upload test results.</p>
        </div>
        <div className="relative group">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-sm focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none transition-all bg-white"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100/50 p-1 rounded-xl">
          <TabsTrigger value="pending" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Pending Orders ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Completed Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Date Ordered</th>
                    <th className="px-6 py-4">Patient</th>
                    <th className="px-6 py-4">Test Name</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {pendingOrders.map(order => (
                    <tr key={order.treatmentId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{order.treatmentId}</td>
                      <td className="px-6 py-4">{new Date().toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-medium text-[var(--brand-primary)]">{order.patientName}</td>
                      <td className="px-6 py-4 font-semibold">{order.treatmentName}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          <AlertTriangle className="w-3 h-3" /> Routine
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(role === "lab_technician" || role === "nurse" || role === "admin") ? (
                          <Button 
                            onClick={() => markTreatmentPerformed(order.treatmentId, "Lab Tech", "results.pdf")}
                            size="sm" 
                            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-lg h-8"
                          >
                            <FileUp className="w-4 h-4 mr-1.5" /> Upload Results
                          </Button>
                        ) : (
                          <StatusPill status={order.status} />
                        )}
                      </td>
                    </tr>
                  ))}
                  {pendingOrders.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState icon={FlaskConical} title="No pending lab orders" description="All requested tests have been processed." />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Patient</th>
                    <th className="px-6 py-4">Test Name</th>
                    <th className="px-6 py-4">Processed Date</th>
                    <th className="px-6 py-4">Processed By</th>
                    <th className="px-6 py-4 text-right">Results</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {completedOrders.map(order => (
                    <tr key={order.treatmentId} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-semibold text-slate-900">{order.treatmentId}</td>
                      <td className="px-6 py-4 font-medium text-[var(--brand-primary)]">{order.patientName}</td>
                      <td className="px-6 py-4">{order.treatmentName}</td>
                      <td className="px-6 py-4">{order.performedAt ? new Date(order.performedAt).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-500">{order.performedBy}</td>
                      <td className="px-6 py-4 text-right">
                        <Button size="sm" variant="outline" className="rounded-lg h-8 text-[var(--brand-primary)] border-[var(--brand-primary)] hover:bg-blue-50">
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> View PDF
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
