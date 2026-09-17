"use client";

import React, { useState } from "react";
import { useBillingStore } from "@/lib/stores/billingStore";
import { useRole } from "@/lib/stores/authStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/catms/StatusPill";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Receipt,
  CreditCard,
  FileCheck,
  Search,
  DollarSign,
  ShieldCheck,
  Eye,
  Plus,
} from "lucide-react";
import type { Invoice, Claim } from "@/lib/types";
import { PaymentModal } from "@/components/catms/PaymentModal";
import { SubmitClaimModal } from "@/components/catms/SubmitClaimModal";
import { ClaimDetailModal } from "@/components/catms/ClaimDetailModal";

export default function BillingPage() {
  const { invoices, payments, claims } = useBillingStore();
  const role = useRole();
  const [activeTab, setActiveTab] = useState("invoices");
  const [searchTerm, setSearchTerm] = useState("");

  const [payInvoiceTarget, setPayInvoiceTarget] = useState<Invoice | null>(null);
  const [claimSubmitTarget, setClaimSubmitTarget] = useState<Invoice | null>(null);
  const [claimDetailTarget, setClaimDetailTarget] = useState<Claim | null>(null);

  if (!role) return null;

  const filteredInvoices = invoices.filter(
    (i) =>
      i.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.invoiceId.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredPayments = payments.filter(
    (p) =>
      p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredClaims = claims.filter(
    (c) =>
      c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.claimId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Billing &amp; Finance</h2>
          <p className="text-slate-500 text-sm">
            Process collection payments with zero-balance validation and manage insurance claims.
          </p>
        </div>
        <div className="relative group">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice, patient, claim..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-72 h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-xs focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none transition-all bg-white"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100/50 p-1 rounded-xl">
          <TabsTrigger
            value="invoices"
            className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-semibold"
          >
            <Receipt className="w-4 h-4 mr-2 text-teal-600" /> Invoices ({invoices.length})
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-semibold"
          >
            <CreditCard className="w-4 h-4 mr-2 text-emerald-600" /> Payments ({payments.length})
          </TabsTrigger>
          <TabsTrigger
            value="claims"
            className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-semibold"
          >
            <FileCheck className="w-4 h-4 mr-2 text-purple-600" /> Insurance Claims ({claims.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Invoices ──────────────────────────────────────────────── */}
        <TabsContent value="invoices" className="mt-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-600">
                <thead className="text-[11px] font-bold text-slate-500 uppercase bg-slate-50 border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Invoice #</th>
                    <th className="px-6 py-4">Patient</th>
                    <th className="px-6 py-4">Issue Date</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Balance Due</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredInvoices.map((inv) => {
                    const isUnsettled = inv.balanceDue > 0 && inv.status !== "Paid";
                    return (
                      <tr key={inv.invoiceId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{inv.invoiceId}</td>
                        <td className="px-6 py-4 font-semibold text-[var(--brand-primary)]">
                          {inv.patientName}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-500">
                          {inv.issueDate ?? new Date(inv.issuedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">
                          LKR {inv.totalAmount?.toLocaleString() ?? inv.totalAmount}
                        </td>
                        <td className="px-6 py-4 font-extrabold text-teal-700">
                          LKR {inv.balanceDue?.toLocaleString() ?? inv.balanceDue}
                        </td>
                        <td className="px-6 py-4">
                          <StatusPill status={inv.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            {isUnsettled && role !== "patient" && (
                              <Button
                                size="sm"
                                onClick={() => setPayInvoiceTarget(inv)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-8 px-3 text-xs font-semibold shadow-2xs gap-1"
                              >
                                <DollarSign className="w-3.5 h-3.5" /> Record Pay
                              </Button>
                            )}
                            {role !== "patient" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setClaimSubmitTarget(inv)}
                                className="rounded-xl h-8 px-3 text-xs font-semibold border-slate-200 text-blue-700 hover:bg-blue-50 gap-1"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" /> Submit Claim
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 italic">
                        No invoice records found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Payments ──────────────────────────────────────────────── */}
        <TabsContent value="payments" className="mt-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-600">
                <thead className="text-[11px] font-bold text-slate-500 uppercase bg-slate-50 border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Payment ID</th>
                    <th className="px-6 py-4">Invoice #</th>
                    <th className="px-6 py-4">Patient</th>
                    <th className="px-6 py-4">Amount Collected</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4">Reference</th>
                    <th className="px-6 py-4">Date &amp; Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredPayments.map((pay) => (
                    <tr key={pay.paymentId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{pay.paymentId}</td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{pay.invoiceId}</td>
                      <td className="px-6 py-4 font-semibold text-[var(--brand-primary)]">
                        {pay.patientName}
                      </td>
                      <td className="px-6 py-4 font-extrabold text-emerald-600">
                        LKR {pay.amount?.toLocaleString() ?? pay.amount}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                          {pay.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500">{pay.reference}</td>
                      <td className="px-6 py-4 font-medium text-slate-500">
                        {new Date(pay.paidAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 italic">
                        No payment collection records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Insurance Claims ──────────────────────────────────────── */}
        <TabsContent value="claims" className="mt-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-600">
                <thead className="text-[11px] font-bold text-slate-500 uppercase bg-slate-50 border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Claim ID</th>
                    <th className="px-6 py-4">Patient</th>
                    <th className="px-6 py-4">Insurance Provider</th>
                    <th className="px-6 py-4">Policy #</th>
                    <th className="px-6 py-4">Claimed</th>
                    <th className="px-6 py-4">Approved</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredClaims.map((claim) => (
                    <tr key={claim.claimId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{claim.claimId}</td>
                      <td className="px-6 py-4 font-semibold text-[var(--brand-primary)]">
                        {claim.patientName}
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">
                        {claim.providerName}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500">{claim.policyNumber}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        LKR {claim.claimedAmount?.toLocaleString() ?? claim.claimedAmount}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600">
                        LKR {claim.approvedAmount?.toLocaleString() ?? claim.approvedAmount}
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill status={claim.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setClaimDetailTarget(claim)}
                          className="rounded-xl h-8 px-3 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-100 gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect / Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredClaims.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-400 italic">
                        No insurance claim records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Processing Modal */}
      {payInvoiceTarget && (
        <PaymentModal
          invoice={payInvoiceTarget}
          onClose={() => setPayInvoiceTarget(null)}
          onSuccess={() => setPayInvoiceTarget(null)}
        />
      )}

      {/* Submit Insurance Claim Modal */}
      {claimSubmitTarget && (
        <SubmitClaimModal
          invoice={claimSubmitTarget}
          onClose={() => setClaimSubmitTarget(null)}
          onSuccess={() => setClaimSubmitTarget(null)}
        />
      )}

      {/* Claim Detail & Review Modal */}
      {claimDetailTarget && (
        <ClaimDetailModal
          claim={claimDetailTarget}
          onClose={() => setClaimDetailTarget(null)}
        />
      )}
    </div>
  );
}
