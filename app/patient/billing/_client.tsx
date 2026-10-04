"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Receipt,
  Loader2,
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ShieldCheck,
  DollarSign,
  CheckCircle2,
  CircleDashed,
  AlertCircle,
  FlaskConical,
} from "lucide-react";
import {
  getPatientBilling,
  type PatientInvoiceItem,
  type PatientPaymentItem,
  type PatientClaimSummary,
  type InvoiceTreatmentItem,
} from "@/lib/actions/patient-billing";

type Tab = "all" | "unpaid" | "paid";

export default function BillingPage({ user }: { user: any }) {
  const [invoices, setInvoices] = useState<PatientInvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getPatientBilling();
        if (!cancelled) setInvoices(data);
      } catch {
        if (!cancelled) setError("Failed to load billing information. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (!user || user.role !== "patient") return null;

  // Filter by tab
  const unpaid = invoices.filter((i) => i.status === "Unpaid" || i.status === "PartiallyPaid");
  const paid = invoices.filter((i) => i.status === "Paid");
  const displayed = tab === "unpaid" ? unpaid : tab === "paid" ? paid : invoices;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All", count: invoices.length },
    { key: "unpaid", label: "Outstanding", count: unpaid.length },
    { key: "paid", label: "Paid", count: paid.length },
  ];

  // Summary totals
  const totalNet = invoices.reduce((s, i) => s + parseFloat(i.netAmount || "0"), 0);
  const totalPaid = invoices.reduce((s, i) => s + parseFloat(i.paidAmount || "0"), 0);
  const totalDue = invoices.reduce((s, i) => s + parseFloat(i.dueAmount || "0"), 0);
  const totalInsurance = invoices.reduce((s, i) => s + parseFloat(i.insuranceCoveredAmount || "0"), 0);

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-in">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
        <p className="text-sm text-slate-500">Loading your billing history…</p>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-in">
        <AlertTriangle className="w-8 h-8 text-amber-500" />
        <p className="text-sm text-slate-600">{error}</p>
        <button
          className="text-sm font-semibold text-[var(--brand-primary)] hover:underline"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Billing &amp; Invoices</h2>
        <p className="text-slate-500">View your invoices, payments, and insurance claims.</p>
      </div>

      {/* Summary card */}
      {invoices.length > 0 && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-600" />
          <CardContent className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-slate-900">{fmt(totalNet)}</p>
                <p className="text-xs text-slate-500 font-medium">Total Billed</p>
              </div>
              <div>
                <p className="text-xl font-bold text-green-600">{fmt(totalPaid)}</p>
                <p className="text-xs text-slate-500 font-medium">Total Paid</p>
              </div>
              <div>
                <p className="text-xl font-bold text-amber-600">{fmt(totalDue)}</p>
                <p className="text-xs text-slate-500 font-medium">Outstanding</p>
              </div>
              {totalInsurance > 0 && (
                <div>
                  <p className="text-xl font-bold text-blue-600">{fmt(totalInsurance)}</p>
                  <p className="text-xs text-slate-500 font-medium">Insurance Covered</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === t.key
                ? "bg-[var(--brand-primary)] text-white shadow"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t.label}
            <span
              className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                tab === t.key ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Empty */}
      {displayed.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 border rounded-xl border-dashed border-slate-200">
          <Receipt className="w-8 h-8 text-slate-300" />
          <p className="text-sm text-slate-500">
            {tab === "unpaid"
              ? "No outstanding invoices."
              : tab === "paid"
              ? "No paid invoices yet."
              : "No invoices on record."}
          </p>
        </div>
      )}

      {/* Invoice list */}
      <div className="space-y-4">
        {displayed.map((inv) => (
          <InvoiceCard key={inv.invoiceId} invoice={inv} />
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────── */
/*  Invoice card (expandable)                     */
/* ────────────────────────────────────────────── */
function InvoiceCard({ invoice }: { invoice: PatientInvoiceItem }) {
  const [expanded, setExpanded] = useState(false);

  const dateDisplay = new Date(invoice.appointmentDate + "T00:00:00").toLocaleDateString(
    undefined,
    { year: "numeric", month: "long", day: "numeric" }
  );

  const statusStyle = invoiceStatusStyle(invoice.status);

  return (
    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        {/* ── Header row ── */}
        <button
          className="w-full p-5 text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer hover:bg-slate-50/50 transition-colors rounded-xl"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-start gap-4">
            <div className={`w-11 h-11 flex items-center justify-center shrink-0 rounded-2xl ${statusStyle.iconBg}`}>
              <Receipt className={`w-5 h-5 ${statusStyle.iconColor}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-bold text-slate-900">{fmt(parseFloat(invoice.netAmount))}</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusStyle.badge}`}>
                  {statusStyle.icon} {invoice.status === "PartiallyPaid" ? "Partially Paid" : invoice.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {dateDisplay}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {invoice.startTime} – {invoice.endTime}
                </span>
                <span className="flex items-center gap-1">
                  <Stethoscope className="w-3 h-3" /> {invoice.doctorName}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {invoice.branchName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {parseFloat(invoice.dueAmount) > 0 && (
              <span className="text-xs font-semibold text-amber-700 whitespace-nowrap">
                Due: {fmt(parseFloat(invoice.dueAmount))}
              </span>
            )}
            {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>
        </button>

        {/* ── Expanded details ── */}
        {expanded && (
          <div className="px-5 pb-5 pt-0 space-y-5 border-t border-slate-100 animate-fade-in">
            {/* Amount breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
              <AmountCell label="Gross" value={invoice.grossAmount} />
              {parseFloat(invoice.discountAmount) > 0 && (
                <AmountCell label="Discount" value={`-${invoice.discountAmount}`} color="text-green-600" />
              )}
              {parseFloat(invoice.taxAmount) > 0 && (
                <AmountCell label="Tax" value={invoice.taxAmount} />
              )}
              <AmountCell label="Net Total" value={invoice.netAmount} bold />
              <AmountCell label="Paid" value={invoice.paidAmount} color="text-green-600" />
              <AmountCell label="Due" value={invoice.dueAmount} color={parseFloat(invoice.dueAmount) > 0 ? "text-amber-600" : "text-green-600"} />
              {parseFloat(invoice.insuranceCoveredAmount) > 0 && (
                <AmountCell label="Insurance Covered" value={invoice.insuranceCoveredAmount} color="text-blue-600" />
              )}
            </div>

            {/* Reason for visit */}
            {invoice.reasonForVisit && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Reason for Visit</p>
                <p className="text-sm text-slate-700">{invoice.reasonForVisit}</p>
              </div>
            )}

            {/* Treatment line items */}
            {invoice.treatments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1">
                  <FlaskConical className="w-3.5 h-3.5" /> Treatment Items
                </p>
                <div className="border border-slate-100 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold">Treatment</th>
                        <th className="text-center px-3 py-2 font-semibold">Qty</th>
                        <th className="text-right px-3 py-2 font-semibold">Unit</th>
                        <th className="text-right px-3 py-2 font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.treatments.map((t, i) => (
                        <TreatmentRow key={i} treatment={t} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Payments */}
            {invoice.payments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" /> Payment History
                </p>
                <div className="space-y-2">
                  {invoice.payments.map((p) => (
                    <PaymentRow key={p.paymentId} payment={p} />
                  ))}
                </div>
              </div>
            )}

            {/* Insurance claim */}
            {invoice.claim && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Insurance Claim
                </p>
                <ClaimCard claim={invoice.claim} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Helpers ── */

function AmountCell({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
      <p className="text-[10px] font-semibold text-slate-400 uppercase">{label}</p>
      <p className={`text-sm ${bold ? "font-bold" : "font-semibold"} ${color || "text-slate-900"}`}>
        {fmt(parseFloat(value))}
      </p>
    </div>
  );
}

function TreatmentRow({ treatment }: { treatment: InvoiceTreatmentItem }) {
  return (
    <tr className="border-t border-slate-50 hover:bg-slate-50/50">
      <td className="px-3 py-2 text-slate-800">
        <span className="font-medium">{treatment.treatmentName}</span>
        <span className="text-xs text-slate-400 ml-1">({treatment.category})</span>
      </td>
      <td className="px-3 py-2 text-center text-slate-600">{treatment.quantity}</td>
      <td className="px-3 py-2 text-right text-slate-600">{fmt(parseFloat(treatment.unitPrice))}</td>
      <td className="px-3 py-2 text-right font-medium text-slate-900">{fmt(parseFloat(treatment.lineTotal))}</td>
    </tr>
  );
}

function PaymentRow({ payment }: { payment: PatientPaymentItem }) {
  return (
    <div className="flex items-center justify-between bg-green-50/60 p-3 rounded-lg border border-green-100 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-green-800">{fmt(parseFloat(payment.amount))}</p>
          <p className="text-xs text-green-600">
            {payment.paymentMethod} • {payment.paymentDate}
            {payment.referenceNumber ? ` • Ref: ${payment.referenceNumber}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

function ClaimCard({ claim }: { claim: PatientClaimSummary }) {
  const claimStatusColors: Record<string, string> = {
    Submitted: "bg-slate-100 text-slate-600",
    UnderReview: "bg-blue-100 text-blue-700",
    Approved: "bg-green-100 text-green-700",
    PartiallyApproved: "bg-amber-100 text-amber-700",
    Rejected: "bg-red-100 text-red-700",
    Settled: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${claimStatusColors[claim.status] || "bg-slate-100 text-slate-600"}`}>
          {claim.status}
        </span>
        <span className="text-xs text-slate-500">Filed: {claim.claimDate}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase">Claimed</p>
          <p className="font-semibold text-slate-800">{fmt(parseFloat(claim.claimedAmount))}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase">Approved</p>
          <p className="font-semibold text-green-700">{fmt(parseFloat(claim.approvedAmount))}</p>
        </div>
      </div>
      {claim.settlementDate && (
        <p className="text-xs text-slate-500 mt-2">Settled: {claim.settlementDate}</p>
      )}
      {claim.remarks && (
        <p className="text-xs text-slate-500 mt-1 italic">{claim.remarks}</p>
      )}
    </div>
  );
}

function invoiceStatusStyle(status: string) {
  switch (status) {
    case "Paid":
      return {
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
        badge: "bg-green-100 text-green-700",
        icon: <CheckCircle2 className="w-3 h-3 inline" />,
      };
    case "PartiallyPaid":
      return {
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
        badge: "bg-amber-100 text-amber-700",
        icon: <CircleDashed className="w-3 h-3 inline" />,
      };
    default:
      return {
        iconBg: "bg-red-50",
        iconColor: "text-red-500",
        badge: "bg-red-100 text-red-700",
        icon: <AlertCircle className="w-3 h-3 inline" />,
      };
  }
}

/** Format a number as currency (2 decimal places) */
function fmt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
