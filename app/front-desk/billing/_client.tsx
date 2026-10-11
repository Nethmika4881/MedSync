"use client";

import React, { useState, useTransition } from "react";
import { useBillingStore } from "@/lib/stores/billingStore";
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
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import type { AuthUser } from "@/lib/types";
import {
  getBranchInvoices,
  type FrontDeskInvoice,
} from "@/lib/actions/frontdesk-billing";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";

interface BillingPageProps {
  user: AuthUser;
  initialInvoices?: FrontDeskInvoice[];
}

export default function BillingPage({
  user,
  initialInvoices = [],
}: BillingPageProps) {
  const role = user?.role;
  const { payments, claims, updateClaimStatus } = useBillingStore();

  const [invoices, setInvoices] = useState<FrontDeskInvoice[]>(initialInvoices);
  const [activeTab, setActiveTab] = useState("invoices");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();

  if (!role) return null;

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const fresh = await getBranchInvoices(user.branchId);
        setInvoices(fresh);
      } catch (err) {
        console.error("Failed to refresh branch invoices:", err);
      }
    });
  };

  // Metrics
  const totalBilled = invoices.reduce((acc, inv) => acc + (inv.netAmount || 0), 0);
  const totalCollected = invoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
  const totalOutstanding = invoices.reduce((acc, inv) => acc + (inv.dueAmount || 0), 0);
  const unpaidCount = invoices.filter((i) => i.status === "Unpaid").length;

  // Filtered Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      inv.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-outfit">
            Billing &amp; Revenue Portal
          </h2>
          <p className="text-slate-500 text-sm">
            Live branch invoicing, patient payment collection, and insurance reconciliation.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isPending}
            className="rounded-xl border-slate-200 h-10 px-3.5 text-slate-600 hover:text-slate-900 shadow-sm"
          >
            <RefreshCw className={cn("w-4 h-4 mr-1.5", isPending && "animate-spin")} />
            Refresh
          </Button>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search invoices, patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-sm focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none transition-all bg-white shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Billed
              </p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                LKR {totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Collected Revenue
              </p>
              <h3 className="text-xl font-bold text-emerald-600 mt-1">
                LKR {totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Outstanding Due
              </p>
              <h3 className="text-xl font-bold text-amber-600 mt-1">
                LKR {totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Unpaid Invoices
              </p>
              <h3 className="text-xl font-bold text-rose-600 mt-1">
                {unpaidCount} <span className="text-xs font-normal text-slate-400">pending</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100/80 p-1 rounded-xl">
          <TabsTrigger
            value="invoices"
            className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold"
          >
            <Receipt className="w-4 h-4 mr-2" /> Invoices ({invoices.length})
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold"
          >
            <CreditCard className="w-4 h-4 mr-2" /> Payments
          </TabsTrigger>
          <TabsTrigger
            value="claims"
            className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold"
          >
            <FileCheck className="w-4 h-4 mr-2" /> Insurance Claims
          </TabsTrigger>
        </TabsList>

        {/* ─── Invoices Tab Content ────────────────────────────────────────── */}
        <TabsContent value="invoices" className="mt-6 space-y-4">
          {/* Status Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: "ALL", label: "All Invoices", count: invoices.length },
              {
                id: "Unpaid",
                label: "Unpaid",
                count: invoices.filter((i) => i.status === "Unpaid").length,
              },
              {
                id: "PartiallyPaid",
                label: "Partially Paid",
                count: invoices.filter((i) => i.status === "PartiallyPaid").length,
              },
              {
                id: "Paid",
                label: "Paid",
                count: invoices.filter((i) => i.status === "Paid").length,
              },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setStatusFilter(chip.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
                  statusFilter === chip.id
                    ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                {chip.label}{" "}
                <span
                  className={cn(
                    "ml-1.5 px-1.5 py-0.2 rounded-full text-[10px]",
                    statusFilter === chip.id
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  {chip.count}
                </span>
              </button>
            ))}
          </div>

          <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Invoice #</th>
                    <th className="px-6 py-4">Patient</th>
                    <th className="px-6 py-4">Issue Date</th>
                    <th className="px-6 py-4">Net Total</th>
                    <th className="px-6 py-4">Paid</th>
                    <th className="px-6 py-4">Balance Due</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400">
                        <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        No invoices found for this search or filter.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.invoiceId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-mono font-semibold text-xs text-slate-900">
                          #{inv.invoiceId.substring(0, 8).toUpperCase()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0",
                                getAvatarColor(inv.patientName || "Patient")
                              )}
                            >
                              {getInitials(inv.patientName || "P")}
                            </div>
                            <span className="font-semibold text-slate-900">
                              {inv.patientName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                          {inv.invoiceDate || "N/A"}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          LKR {Number(inv.netAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 font-semibold text-emerald-600">
                          LKR {Number(inv.paidAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 font-semibold text-amber-600">
                          LKR {Number(inv.dueAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4">
                          <StatusPill status={inv.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          {inv.status !== "Paid" ? (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3.5 h-8 text-xs font-semibold shadow-sm"
                            >
                              <DollarSign className="w-3.5 h-3.5 mr-1" />
                              Collect Payment
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl text-slate-600 hover:text-slate-900 border-slate-200 h-8 text-xs font-semibold"
                            >
                              View Receipt
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ─── Payments Tab Content ────────────────────────────────────────── */}
        <TabsContent value="payments" className="mt-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Payment ID</th>
                    <th className="px-6 py-4">Invoice #</th>
                    <th className="px-6 py-4">Patient</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4">Date &amp; Time</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredPayments.map((pay) => (
                    <tr key={pay.paymentId} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-semibold text-slate-900 font-mono text-xs">
                        {pay.paymentId}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                        {pay.invoiceId}
                      </td>
                      <td className="px-6 py-4 font-medium text-[var(--brand-primary)]">
                        {pay.patientName}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600">
                        LKR {pay.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">{pay.method}</td>
                      <td className="px-6 py-4 text-xs font-mono">
                        {new Date(pay.paidAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill status={pay.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ─── Claims Tab Content ─────────────────────────────────────────── */}
        <TabsContent value="claims" className="mt-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
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
                  {filteredClaims.map((claim) => (
                    <tr key={claim.claimId} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-semibold text-slate-900 font-mono text-xs">
                        {claim.claimId}
                      </td>
                      <td className="px-6 py-4 font-medium text-[var(--brand-primary)]">
                        {claim.patientName}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{claim.providerName}</td>
                      <td className="px-6 py-4 font-semibold">
                        LKR {claim.claimedAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-emerald-600">
                        LKR {claim.approvedAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill status={claim.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {claim.status === "UnderReview" && role === "admin" ? (
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              onClick={() => updateClaimStatus(claim.claimId, "Approved")}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-8"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => updateClaimStatus(claim.claimId, "Rejected")}
                              className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg h-8"
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" className="rounded-lg h-8">
                            Details
                          </Button>
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
