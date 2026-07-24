"use client";

import React, { useState } from "react";
import { useBillingStore } from "@/lib/stores/billingStore";
import { useRole } from "@/lib/stores/authStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/catms/StatusPill";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Receipt, CreditCard, FileCheck, Search, DollarSign } from "lucide-react";

export default function BillingPage() {
  const { invoices, payments, claims, payInvoice, updateClaimStatus } = useBillingStore();
  const role = useRole();
  const [activeTab, setActiveTab] = useState("invoices");
  const [searchTerm, setSearchTerm] = useState("");

  if (!role) return null;

  const filteredInvoices = invoices.filter(i => i.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || i.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredPayments = payments.filter(p => p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || p.reference.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredClaims = claims.filter(c => c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || c.claimId.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Billing & Finance</h2>
          <p className="text-slate-500">Manage invoices, process payments, and track insurance claims.</p>
        </div>
        <div className="relative group">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-sm focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none transition-all bg-white"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100/50 p-1 rounded-xl">
          <TabsTrigger value="invoices" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Receipt className="w-4 h-4 mr-2" /> Invoices
          </TabsTrigger>
          <TabsTrigger value="payments" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <CreditCard className="w-4 h-4 mr-2" /> Payments
          </TabsTrigger>
          <TabsTrigger value="claims" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <FileCheck className="w-4 h-4 mr-2" /> Insurance Claims
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Invoice #</th>
                    <th className="px-6 py-4">Patient</th>
                    <th className="px-6 py-4">Issue Date</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredInvoices.map(inv => (
                    <tr key={inv.invoiceId} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-semibold text-slate-900">{inv.invoiceId}</td>
                      <td className="px-6 py-4 font-medium text-[var(--brand-primary)]">{inv.patientName}</td>
                      <td className="px-6 py-4">{inv.issueDate}</td>
                      <td className="px-6 py-4 font-semibold">${inv.totalAmount.toFixed(2)}</td>
                      <td className="px-6 py-4"><StatusPill status={inv.status} /></td>
                      <td className="px-6 py-4 text-right">
                        {inv.status === "Due" && role !== "patient" && (
                          <Button size="sm" onClick={() => payInvoice(inv.invoiceId, "Card")} className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4">
                            <DollarSign className="w-4 h-4 mr-1" /> Pay Now
                          </Button>
                        )}
                        {inv.status === "Paid" && (
                          <Button size="sm" variant="outline" className="rounded-lg text-slate-600">View Receipt</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Payment ID</th>
                    <th className="px-6 py-4">Invoice #</th>
                    <th className="px-6 py-4">Patient</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredPayments.map(pay => (
                    <tr key={pay.paymentId} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-semibold text-slate-900">{pay.paymentId}</td>
                      <td className="px-6 py-4 text-slate-500">{pay.invoiceId}</td>
                      <td className="px-6 py-4 font-medium text-[var(--brand-primary)]">{pay.patientName}</td>
                      <td className="px-6 py-4 font-bold text-green-600">${pay.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">{pay.method}</td>
                      <td className="px-6 py-4">{new Date(pay.paidAt).toLocaleString()}</td>
                      <td className="px-6 py-4"><StatusPill status={pay.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="claims" className="mt-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Claim ID</th>
                    <th className="px-6 py-4">Patient</th>
                    <th className="px-6 py-4">Provider</th>
                    <th className="px-6 py-4">Claimed</th>
                    <th className="px-6 py-4">Approved</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredClaims.map(claim => (
                    <tr key={claim.claimId} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-semibold text-slate-900">{claim.claimId}</td>
                      <td className="px-6 py-4 font-medium text-[var(--brand-primary)]">{claim.patientName}</td>
                      <td className="px-6 py-4 text-slate-500">{claim.providerName}</td>
                      <td className="px-6 py-4 font-semibold">${claim.claimedAmount.toFixed(2)}</td>
                      <td className="px-6 py-4 font-semibold text-green-600">${claim.approvedAmount.toFixed(2)}</td>
                      <td className="px-6 py-4"><StatusPill status={claim.status} /></td>
                      <td className="px-6 py-4 text-right">
                        {claim.status === "UnderReview" && (role === "admin" || role === "branch_manager") ? (
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" onClick={() => updateClaimStatus(claim.claimId, "Approved")} className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-8">Approve</Button>
                            <Button size="sm" onClick={() => updateClaimStatus(claim.claimId, "Rejected")} className="bg-red-600 hover:bg-red-700 text-white rounded-lg h-8">Reject</Button>
                          </div>
                        ) : (
                           <Button size="sm" variant="outline" className="rounded-lg h-8">Details</Button>
                        )}
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
