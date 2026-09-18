"use client";

import React, { useState, useEffect } from "react";
import { useBillingStore } from "@/lib/stores/billingStore";
import { useRole } from "@/lib/stores/authStore";
import { Card } from "@/components/ui/card";
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
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import type { Invoice, Claim, RefundTask } from "@/lib/types";
import { PaymentModal } from "@/components/catms/PaymentModal";
import { SubmitClaimModal } from "@/components/catms/SubmitClaimModal";
import { ClaimDetailModal } from "@/components/catms/ClaimDetailModal";
import { RefundTaskModal } from "@/components/catms/RefundTaskModal";
import {
  getInvoices,
  getPayments,
  getClaims,
  getRefundTasks,
} from "@/lib/actions/billing";

export default function BillingPage() {
  const { invoices, payments, claims, refundTasks, setInvoices, setPayments, setClaims, setRefundTasks } =
    useBillingStore();
  const role = useRole();
  const [activeTab, setActiveTab] = useState("invoices");
  const [searchTerm, setSearchTerm] = useState("");

  const [payInvoiceTarget, setPayInvoiceTarget] = useState<Invoice | null>(null);
  const [claimSubmitTarget, setClaimSubmitTarget] = useState<Invoice | null>(null);
  const [claimDetailTarget, setClaimDetailTarget] = useState<Claim | null>(null);
  const [refundTaskTarget, setRefundTaskTarget] = useState<RefundTask | null>(null);

  // Sync DB rows on mount if available
  useEffect(() => {
    async function loadDbData() {
      try {
        const [invRows, payRows, clmRows, refRows] = await Promise.all([
          getInvoices(),
          getPayments(),
          getClaims(),
          getRefundTasks(),
        ]);
        if (invRows && invRows.length > 0) setInvoices(invRows);
        if (payRows && payRows.length > 0) setPayments(payRows);
        if (clmRows && clmRows.length > 0) setClaims(clmRows);
        if (refRows && refRows.length > 0) setRefundTasks(refRows);
      } catch (err) {
        console.error("Failed loading billing DB data:", err);
      }
    }
    loadDbData();
  }, [setInvoices, setPayments, setClaims, setRefundTasks]);

  if (!role) return null;

  const pendingRefunds = refundTasks.filter((r) => r.status === "Pending");

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
  const filteredRefunds = refundTasks.filter(
    (r) =>
      r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.taskId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Billing &amp; Finance</h2>
          <p className="text-slate-500 text-sm">
            Process collection payments, manage insurance overpayment refunds (REQ-32), and track claims.
          </p>
        </div>
        <div className="relative group">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice, patient, claim, task..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-72 h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-xs focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none transition-all bg-white"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100/50 p-1 rounded-xl flex flex-wrap">
          <TabsTrigger
            value="invoices"
            className="rounded-lg px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-semibold"
          >
            <Receipt className="w-4 h-4 mr-2 text-teal-600" /> Invoices ({invoices.length})
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="rounded-lg px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-semibold"
          >
            <CreditCard className="w-4 h-4 mr-2 text-emerald-600" /> Payments ({payments.length})
          </TabsTrigger>
          <TabsTrigger
            value="claims"
            className="rounded-lg px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-semibold"
          >
            <FileCheck className="w-4 h-4 mr-2 text-purple-600" /> Insurance Claims ({claims.length})
          </TabsTrigger>
          <TabsTrigger
            value="refunds"
            className="rounded-lg px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-semibold relative"
          >
            <RotateCcw className="w-4 h-4 mr-2 text-amber-600" /> Refund Tasks Queue
            {pendingRefunds.length > 0 && (
              <span className="ml-2 bg-amber-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                {pendingRefunds.length} Pending
              </span>
            )}
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
                    <th className="px-6 py-4">Balance / Credit</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredInvoices.map((inv) => {
                    const isUnsettled = inv.balanceDue > 0 && inv.status !== "Paid" && inv.status !== "Overpaid";
                    const isOverpaid = inv.status === "Overpaid" || (inv.creditBalance && inv.creditBalance > 0);
                    const matchingRefundTask = refundTasks.find((t) => t.invoiceId === inv.invoiceId);

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
                        <td className="px-6 py-4">
                          {isOverpaid ? (
                            <span className="font-extrabold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-[11px] inline-flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              Credit: LKR {(inv.creditBalance ?? 0).toLocaleString()}
                            </span>
                          ) : (
                            <span className="font-extrabold text-teal-700">
                              LKR {inv.balanceDue?.toLocaleString() ?? inv.balanceDue}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <StatusPill status={inv.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            {isOverpaid && role !== "patient" && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (matchingRefundTask) {
                                    setRefundTaskTarget(matchingRefundTask);
                                  } else {
                                    setRefundTaskTarget({
                                      taskId: `REF-${inv.invoiceId}`,
                                      invoiceId: inv.invoiceId,
                                      patientId: inv.patientId,
                                      patientName: inv.patientName,
                                      refundAmount: inv.creditBalance ?? 0,
                                      reason: "Insurance Overpayment Refund (REQ-32)",
                                      status: "Pending",
                                      createdAt: new Date().toISOString(),
                                    });
                                  }
                                }}
                                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-8 px-3 text-xs font-semibold shadow-2xs gap-1"
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> Process Refund
                              </Button>
                            )}
                            {isUnsettled && role !== "patient" && (
                              <Button
                                size="sm"
                                onClick={() => setPayInvoiceTarget(inv)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-8 px-3 text-xs font-semibold shadow-2xs gap-1"
                              >
                                <DollarSign className="w-3.5 h-3.5" /> Record Pay
                              </Button>
                            )}
                            {role !== "patient" && !isOverpaid && (
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
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4">Reference</th>
                    <th className="px-6 py-4">Date &amp; Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredPayments.map((pay) => {
                    const isRefund = pay.amount < 0;
                    return (
                      <tr key={pay.paymentId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{pay.paymentId}</td>
                        <td className="px-6 py-4 text-slate-500 font-medium">{pay.invoiceId}</td>
                        <td className="px-6 py-4 font-semibold text-[var(--brand-primary)]">
                          {pay.patientName}
                        </td>
                        <td className="px-6 py-4 font-extrabold">
                          {isRefund ? (
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              - LKR {Math.abs(pay.amount).toLocaleString()} (Refund)
                            </span>
                          ) : (
                            <span className="text-emerald-600">
                              LKR {pay.amount?.toLocaleString() ?? pay.amount}
                            </span>
                          )}
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
                    );
                  })}
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

        {/* ── Tab 4: Refund Tasks Queue (REQ-32) ────────────────────────────── */}
        <TabsContent value="refunds" className="mt-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-600">
                <thead className="text-[11px] font-bold text-slate-500 uppercase bg-slate-50 border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Task ID</th>
                    <th className="px-6 py-4">Invoice #</th>
                    <th className="px-6 py-4">Patient Name</th>
                    <th className="px-6 py-4">Refund Amount</th>
                    <th className="px-6 py-4">Overpayment Reason</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredRefunds.map((task) => {
                    const isPending = task.status === "Pending";
                    return (
                      <tr key={task.taskId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">{task.taskId}</td>
                        <td className="px-6 py-4 font-semibold text-slate-700">{task.invoiceId}</td>
                        <td className="px-6 py-4 font-bold text-[var(--brand-primary)]">
                          {task.patientName}
                        </td>
                        <td className="px-6 py-4 font-extrabold text-amber-700">
                          LKR {task.refundAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate text-slate-600" title={task.reason}>
                          {task.reason}
                        </td>
                        <td className="px-6 py-4">
                          {isPending ? (
                            <span className="font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[11px] inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" /> Pending Action
                            </span>
                          ) : (
                            <span className="font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Processed
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isPending && role !== "patient" ? (
                            <Button
                              size="sm"
                              onClick={() => setRefundTaskTarget(task)}
                              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-8 px-3 text-xs font-semibold shadow-2xs gap-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Issue Refund
                            </Button>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Completed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRefunds.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 italic">
                        No overpayment refund tasks found in queue.
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

      {/* Refund Task Processing Modal (REQ-32) */}
      {refundTaskTarget && (
        <RefundTaskModal
          task={refundTaskTarget}
          onClose={() => setRefundTaskTarget(null)}
          onSuccess={() => setRefundTaskTarget(null)}
        />
      )}
    </div>
  );
}

