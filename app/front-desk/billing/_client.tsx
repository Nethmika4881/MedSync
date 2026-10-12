"use client";

import React, { useState, useTransition } from "react";
import { useBillingStore } from "@/lib/stores/billingStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/catms/StatusPill";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast, Toaster } from "sonner";
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
  Loader2,
  Wallet,
  Building2,
  Globe,
  Printer,
  ShieldCheck,
} from "lucide-react";
import type { AuthUser } from "@/lib/types";
import {
  getBranchInvoices,
  getBranchInsuranceClaims,
  recordFrontDeskPayment,
  type FrontDeskInvoice,
  type FrontDeskClaimSummary,
} from "@/lib/actions/frontdesk-billing";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";

interface BillingPageProps {
  user: AuthUser;
  initialInvoices?: FrontDeskInvoice[];
  initialClaims?: FrontDeskClaimSummary[];
}

type PaymentMethodType = "Cash" | "Card" | "BankTransfer" | "OnlinePayment";

const PAYMENT_METHODS: { id: PaymentMethodType; label: string; icon: React.ElementType }[] = [
  { id: "Cash", label: "Cash", icon: Wallet },
  { id: "Card", label: "Credit / Debit Card", icon: CreditCard },
  { id: "BankTransfer", label: "Bank Transfer", icon: Building2 },
  { id: "OnlinePayment", label: "Online Gateway", icon: Globe },
];

export default function BillingPage({
  user,
  initialInvoices = [],
  initialClaims = [],
}: BillingPageProps) {
  const role = user?.role;
  const { payments } = useBillingStore();

  const [invoices, setInvoices] = useState<FrontDeskInvoice[]>(initialInvoices);
  const [liveClaimsData, setLiveClaimsData] = useState<FrontDeskClaimSummary[]>(initialClaims);
  const [activeTab, setActiveTab] = useState("invoices");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();

  // Payment Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<FrontDeskInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("Cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Printable Receipt Modal State
  const [selectedReceiptInvoice, setSelectedReceiptInvoice] = useState<FrontDeskInvoice | null>(null);

  if (!role) return null;

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const [freshInvoices, freshClaims] = await Promise.all([
          getBranchInvoices(user.branchId),
          getBranchInsuranceClaims(user.branchId),
        ]);
        setInvoices(freshInvoices);
        setLiveClaimsData(freshClaims);
      } catch (err) {
        console.error("Failed to refresh billing data:", err);
      }
    });
  };

  const handleOpenPaymentModal = (inv: FrontDeskInvoice) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.dueAmount > 0 ? String(inv.dueAmount) : String(inv.netAmount));
    setPaymentMethod("Cash");
    setReferenceNumber("");
  };

  const handleClosePaymentModal = () => {
    if (isSubmittingPayment) return;
    setSelectedInvoice(null);
    setPaymentAmount("");
    setReferenceNumber("");
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid payment amount greater than zero.");
      return;
    }

    if (amountNum > selectedInvoice.dueAmount) {
      toast.error(
        `Payment amount (LKR ${amountNum.toLocaleString()}) cannot exceed the remaining balance (LKR ${selectedInvoice.dueAmount.toLocaleString()}).`
      );
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const res = await recordFrontDeskPayment({
        invoiceId: selectedInvoice.invoiceId,
        amount: amountNum,
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
      });

      if (res.success) {
        toast.success(res.message || "Payment collected and recorded successfully!");

        // Optimistically update invoice in table
        setInvoices((prev) =>
          prev.map((inv) => {
            if (inv.invoiceId === selectedInvoice.invoiceId) {
              const updatedPaid = (inv.paidAmount || 0) + amountNum;
              const updatedDue = Math.max(0, (inv.dueAmount || 0) - amountNum);
              return {
                ...inv,
                paidAmount: updatedPaid,
                dueAmount: updatedDue,
                status: updatedDue <= 0 ? "Paid" : "PartiallyPaid",
              };
            }
            return inv;
          })
        );

        handleClosePaymentModal();
      } else {
        toast.error(res.error || "Failed to process payment.");
      }
    } catch (err: any) {
      console.error("Payment submission error:", err);
      toast.error(err?.message || "An unexpected error occurred while collecting payment.");
    } finally {
      setIsSubmittingPayment(false);
    }
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

  const filteredClaims = liveClaimsData.filter(
    (c) =>
      c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.claimId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.policyNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <Toaster richColors position="top-right" />

      {/* Print-only CSS stylesheet */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt,
          #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            height: auto;
            margin: 0;
            padding: 32px;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

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
                          <div className="flex items-center justify-end gap-1.5">
                            {inv.status !== "Paid" && (
                              <Button
                                size="sm"
                                onClick={() => handleOpenPaymentModal(inv)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3 h-8 text-xs font-semibold shadow-sm transition-all"
                              >
                                <DollarSign className="w-3.5 h-3.5 mr-1" />
                                Collect Payment
                              </Button>
                            )}
                            {(inv.paidAmount > 0 || inv.status === "Paid") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedReceiptInvoice(inv)}
                                className="rounded-xl text-slate-600 hover:text-slate-900 border-slate-200 h-8 text-xs font-semibold shadow-sm"
                              >
                                <Printer className="w-3.5 h-3.5 mr-1 text-slate-500" />
                                View Receipt
                              </Button>
                            )}
                          </div>
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
        <TabsContent value="claims" className="mt-6 space-y-4">
          {/* Live Claim Status Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Total Claims",
                value: liveClaimsData.length,
                color: "text-slate-900",
                bg: "bg-slate-50",
              },
              {
                label: "Under Review",
                value: liveClaimsData.filter((c) => c.status === "UnderReview").length,
                color: "text-amber-700",
                bg: "bg-amber-50",
              },
              {
                label: "Approved",
                value: liveClaimsData.filter((c) => c.status === "Approved" || c.status === "PartiallyApproved").length,
                color: "text-emerald-700",
                bg: "bg-emerald-50",
              },
              {
                label: "Rejected",
                value: liveClaimsData.filter((c) => c.status === "Rejected").length,
                color: "text-rose-700",
                bg: "bg-rose-50",
              },
            ].map((stat) => (
              <div key={stat.label} className={`${stat.bg} rounded-xl p-3 border border-slate-100 text-center`}>
                <div className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
                <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-4">Claim #</th>
                    <th className="px-5 py-4">Patient</th>
                    <th className="px-5 py-4">Insurance Provider</th>
                    <th className="px-5 py-4">Policy #</th>
                    <th className="px-5 py-4">Claim Date</th>
                    <th className="px-5 py-4">Claimed</th>
                    <th className="px-5 py-4">Approved</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredClaims.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-400">
                        <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        No insurance claims found for this branch.
                      </td>
                    </tr>
                  ) : (
                    filteredClaims.map((claim) => (
                      <tr key={claim.claimId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4 font-mono font-semibold text-xs text-slate-900">
                          #{claim.claimId.substring(0, 8).toUpperCase()}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0",
                                getAvatarColor(claim.patientName)
                              )}
                            >
                              {getInitials(claim.patientName)}
                            </div>
                            <span className="font-semibold text-slate-900">{claim.patientName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-xs">
                            <div className="font-semibold text-slate-800">{claim.providerName}</div>
                            <div className="text-slate-400">{claim.packageName}</div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-slate-600">
                          {claim.policyNumber}
                        </td>
                        <td className="px-5 py-4 text-xs font-mono text-slate-500">
                          {claim.claimDate || "—"}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          LKR {Number(claim.claimedAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-4 font-semibold text-emerald-600">
                          LKR {Number(claim.approvedAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-4">
                          <StatusPill status={claim.status} />
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500 max-w-[120px] truncate">
                          {claim.remarks || <span className="text-slate-300 italic">—</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Collect Payment Dialog Modal ─────────────────────────────────── */}
      <Dialog
        open={!!selectedInvoice}
        onOpenChange={(open) => {
          if (!open) handleClosePaymentModal();
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-white border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 font-outfit flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold shadow-sm">
                <DollarSign className="w-4 h-4" />
              </div>
              Collect Patient Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Record payment receipt for Invoice #{selectedInvoice?.invoiceId.substring(0, 8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <form onSubmit={handleProcessPayment} className="space-y-4 pt-2">
              {/* Patient & Invoice Summary Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Patient:</span>
                  <span className="font-semibold text-slate-900">{selectedInvoice.patientName}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Total Invoiced:</span>
                  <span className="font-semibold text-slate-900">
                    LKR {Number(selectedInvoice.netAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Already Paid:</span>
                  <span className="font-semibold text-emerald-600">
                    LKR {Number(selectedInvoice.paidAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200 font-bold">
                  <span className="text-slate-900">Outstanding Balance:</span>
                  <span className="text-amber-700 font-mono text-sm">
                    LKR {Number(selectedInvoice.dueAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Amount to Collect */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Amount to Collect (LKR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    LKR
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedInvoice.dueAmount}
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full h-11 pl-12 pr-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none transition-all bg-white"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Payment Method *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((pm) => {
                    const Icon = pm.icon;
                    const isSelected = paymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all text-left",
                          isSelected
                            ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600"
                            : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                        )}
                      >
                        <Icon className={cn("w-4 h-4 shrink-0", isSelected ? "text-emerald-600" : "text-slate-400")} />
                        <span>{pm.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reference / Slip Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Reference / Slip # (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Card Auth Code, POS Slip #, Cheque #"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none transition-all bg-white"
                />
              </div>

              <DialogFooter className="pt-2 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClosePaymentModal}
                  disabled={isSubmittingPayment}
                  className="rounded-xl border-slate-200 text-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingPayment || !paymentAmount}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 shadow-sm"
                >
                  {isSubmittingPayment ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Recording Payment...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Confirm &amp; Record Payment
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Printable Receipt Dialog Modal ───────────────────────────────── */}
      <Dialog
        open={!!selectedReceiptInvoice}
        onOpenChange={(open) => {
          if (!open) setSelectedReceiptInvoice(null);
        }}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl p-0 bg-white border-slate-200 shadow-2xl overflow-hidden">
          <div id="printable-receipt" className="p-8 space-y-6 bg-white text-slate-900">
            {/* Receipt Clinic Branding */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-[var(--brand-primary)] text-white flex items-center justify-center font-bold text-sm">
                    M
                  </div>
                  <h3 className="text-xl font-bold font-outfit tracking-tight text-slate-900">
                    MedSync Health
                  </h3>
                </div>
                <p className="text-xs text-slate-500">Official Clinical Payment Receipt</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Branch ID: {user.branchId || "Central Branch"}
                </p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {selectedReceiptInvoice?.status === "Paid" ? "PAID IN FULL" : "PARTIAL PAYMENT"}
                </div>
                <p className="text-xs font-mono font-semibold text-slate-700 mt-2">
                  Receipt #{selectedReceiptInvoice?.invoiceId.substring(0, 8).toUpperCase()}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  {selectedReceiptInvoice?.invoiceDate || new Date().toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Patient Information Section */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Patient Name</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {selectedReceiptInvoice?.patientName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Patient ID</span>
                <span className="font-mono text-slate-700">
                  {selectedReceiptInvoice?.patientId.substring(0, 8).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Line Item Breakdown */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Service / Description</th>
                    <th className="p-3 text-right">Amount (LKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-medium text-slate-900">
                      Medical Consultation &amp; Clinical Services
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-slate-900">
                      {Number(selectedReceiptInvoice?.grossAmount || selectedReceiptInvoice?.netAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  {Number(selectedReceiptInvoice?.discountAmount || 0) > 0 && (
                    <tr>
                      <td className="p-3 text-slate-500">Promotional / Insurance Discount</td>
                      <td className="p-3 text-right font-mono text-emerald-600">
                        - {Number(selectedReceiptInvoice?.discountAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                  {Number(selectedReceiptInvoice?.taxAmount || 0) > 0 && (
                    <tr>
                      <td className="p-3 text-slate-500">Government Medical Tax</td>
                      <td className="p-3 text-right font-mono text-slate-700">
                        + {Number(selectedReceiptInvoice?.taxAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Totals */}
            <div className="space-y-1.5 text-xs border-t border-slate-200 pt-3">
              <div className="flex justify-between text-slate-600">
                <span>Net Total:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  LKR {Number(selectedReceiptInvoice?.netAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Amount Paid:</span>
                <span className="font-bold text-emerald-600 font-mono text-sm">
                  LKR {Number(selectedReceiptInvoice?.paidAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Outstanding Balance:</span>
                <span className="font-semibold text-amber-700 font-mono">
                  LKR {Number(selectedReceiptInvoice?.dueAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Receptionist Sign-Off Footer */}
            <div className="border-t border-dashed border-slate-200 pt-4 text-center space-y-1">
              <p className="text-[11px] text-slate-500">
                Issued by Receptionist: <span className="font-semibold text-slate-700">{user.name || "Front Desk Staff"}</span>
              </p>
              <p className="text-[10px] text-slate-400">
                Thank you for choosing MedSync. This document serves as an official electronic receipt.
              </p>
            </div>
          </div>

          <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 flex sm:justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedReceiptInvoice(null)}
              className="rounded-xl border-slate-200 text-slate-600 h-9 text-xs"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={handlePrintReceipt}
              className="rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white font-semibold text-xs h-9 px-4 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
