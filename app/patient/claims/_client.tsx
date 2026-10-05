"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldCheck,
  Loader2,
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  FileText,
  Building,
  CheckCircle2,
  Clock3,
  XCircle,
  FileCheck,
  Receipt,
  BadgeAlert,
} from "lucide-react";
import {
  getPatientClaims,
  type PatientClaimRecord,
  type PatientInsurancePolicy,
  type PatientClaimItemLine,
  type ClaimStatus,
} from "@/lib/actions/patient-claims";

type Tab = "all" | "in-review" | "approved" | "rejected";

function fmt(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "Rs. 0.00";
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(n)) return "Rs. 0.00";
  return `Rs. ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PatientClaimsClient({ user }: { user: any }) {
  const [claims, setClaims] = useState<PatientClaimRecord[]>([]);
  const [policies, setPolicies] = useState<PatientInsurancePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getPatientClaims();
        if (!cancelled) {
          setClaims(data.claims);
          setPolicies(data.policies);
        }
      } catch {
        if (!cancelled) setError("Failed to load claims information. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user || user.role !== "patient") return null;

  // Filter lists based on exact claim status enums
  const inReviewClaims = claims.filter(
    (c) => c.status === "Submitted" || c.status === "UnderReview"
  );
  const approvedClaims = claims.filter(
    (c) =>
      c.status === "Approved" ||
      c.status === "PartiallyApproved" ||
      c.status === "Settled"
  );
  const rejectedClaims = claims.filter((c) => c.status === "Rejected");

  const displayedClaims =
    tab === "in-review"
      ? inReviewClaims
      : tab === "approved"
      ? approvedClaims
      : tab === "rejected"
      ? rejectedClaims
      : claims;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All Claims", count: claims.length },
    { key: "in-review", label: "In Review", count: inReviewClaims.length },
    { key: "approved", label: "Approved / Settled", count: approvedClaims.length },
    { key: "rejected", label: "Rejected", count: rejectedClaims.length },
  ];

  // Financial totals
  const totalClaimed = claims.reduce((s, c) => s + parseFloat(c.claimedAmount || "0"), 0);
  const totalApproved = claims.reduce((s, c) => s + parseFloat(c.approvedAmount || "0"), 0);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-in">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
        <p className="text-sm text-slate-500">Loading your insurance claims…</p>
      </div>
    );
  }

  // Error state
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
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Insurance Claims</h2>
        <p className="text-slate-500">
          Track the status, approval amounts, and settlement details of claims filed against your invoices.
        </p>
      </div>

      {/* Active Policies Banner */}
      {policies.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider text-xs">
            <ShieldCheck className="w-4 h-4 text-[var(--brand-primary)]" />
            Your Insurance Coverage
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policies.map((p) => (
              <PolicyCard key={p.insuranceId} policy={p} />
            ))}
          </div>
        </div>
      )}

      {/* Summary card */}
      {claims.length > 0 && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500" />
          <CardContent className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-slate-900">{claims.length}</p>
                <p className="text-xs text-slate-500 font-medium">Total Claims</p>
              </div>
              <div>
                <p className="text-xl font-bold text-blue-600">{fmt(totalClaimed)}</p>
                <p className="text-xs text-slate-500 font-medium">Total Claimed</p>
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-600">{fmt(totalApproved)}</p>
                <p className="text-xs text-slate-500 font-medium">Approved / Settled</p>
              </div>
              <div>
                <p className="text-xl font-bold text-amber-600">{inReviewClaims.length}</p>
                <p className="text-xs text-slate-500 font-medium">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === t.key
                ? "bg-[var(--brand-primary)] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t.label}
            <span
              className={`ml-1.5 text-xs px-2 py-0.5 rounded-full ${
                tab === t.key ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Empty State */}
      {displayedClaims.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 border rounded-xl border-dashed border-slate-200 bg-white">
          <ShieldCheck className="w-10 h-10 text-slate-300" />
          <p className="text-sm text-slate-500">
            {tab === "in-review"
              ? "No claims currently under review."
              : tab === "approved"
              ? "No approved or settled claims found."
              : tab === "rejected"
              ? "No rejected claims on record."
              : "No insurance claims on record."}
          </p>
        </div>
      )}

      {/* Claims List */}
      <div className="space-y-4">
        {displayedClaims.map((claim) => (
          <ClaimCard key={claim.claimId} claim={claim} />
        ))}
      </div>
    </div>
  );
}

/* ── Policy Summary Card ── */
function PolicyCard({ policy }: { policy: PatientInsurancePolicy }) {
  const isActive = policy.status === "Active";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-900 text-sm">{policy.providerName}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{policy.packageName}</p>
        </div>
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
            isActive
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : policy.status === "Expired"
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-slate-100 text-slate-600 border-slate-200"
          }`}
        >
          {policy.status}
        </span>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-slate-400 block">Policy Number</span>
          <span className="font-mono font-medium text-slate-700">{policy.policyNumber}</span>
        </div>
        <div>
          <span className="text-slate-400 block">Validity</span>
          <span className="text-slate-700">
            {policy.startDate} &rarr; {policy.endDate}
          </span>
        </div>
        {policy.copaymentPercentage && (
          <div>
            <span className="text-slate-400 block">Co-Payment</span>
            <span className="font-medium text-slate-700">{policy.copaymentPercentage}%</span>
          </div>
        )}
        {policy.annualLimit && (
          <div>
            <span className="text-slate-400 block">Annual Limit</span>
            <span className="font-medium text-slate-700">{fmt(policy.annualLimit)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Claim Status Badge ── */
function StatusBadge({ status }: { status: ClaimStatus }) {
  const configs: Record<
    ClaimStatus,
    { label: string; bg: string; text: string; border: string; icon: React.ComponentType<any> }
  > = {
    Submitted: {
      label: "Submitted",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      icon: Clock3,
    },
    UnderReview: {
      label: "Under Review",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      icon: Clock,
    },
    Approved: {
      label: "Approved",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      icon: CheckCircle2,
    },
    PartiallyApproved: {
      label: "Partially Approved",
      bg: "bg-teal-50",
      text: "text-teal-700",
      border: "border-teal-200",
      icon: FileCheck,
    },
    Settled: {
      label: "Settled",
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200",
      icon: CheckCircle2,
    },
    Rejected: {
      label: "Rejected",
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
      icon: XCircle,
    },
  };

  const conf = configs[status] || {
    label: status,
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    icon: Clock3,
  };

  const Icon = conf.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${conf.bg} ${conf.text} ${conf.border}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {conf.label}
    </span>
  );
}

/* ── Individual Claim Card ── */
function ClaimCard({ claim }: { claim: PatientClaimRecord }) {
  const [expanded, setExpanded] = useState(false);

  const claimedNum = parseFloat(claim.claimedAmount || "0");
  const approvedNum = parseFloat(claim.approvedAmount || "0");

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition-colors">
      <CardContent className="p-0">
        {/* Accordion Header */}
        <div
          className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none hover:bg-slate-50/50 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-semibold text-slate-900">{claim.providerName}</span>
              <span className="text-xs text-slate-400 font-mono">({claim.policyNumber})</span>
              <StatusBadge status={claim.status} />
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Filed on {claim.claimDate}
              </span>
              <span className="flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                {claim.doctorName}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {claim.branchName}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
            <div className="text-right">
              <div className="flex items-baseline justify-end gap-1.5">
                <span className="text-xs text-slate-400 font-medium">Claimed:</span>
                <span className="font-bold text-slate-900 text-sm">{fmt(claimedNum)}</span>
              </div>
              <div className="flex items-baseline justify-end gap-1.5">
                <span className="text-xs text-slate-400 font-medium">Approved:</span>
                <span className="font-bold text-emerald-600 text-sm">{fmt(approvedNum)}</span>
              </div>
            </div>

            <div className="text-slate-400">
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </div>

        {/* Accordion Expanded Detail */}
        {expanded && (
          <div className="border-t border-slate-100 p-5 space-y-6 bg-slate-50/30 animate-fade-in">
            {/* Overview Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-2xs">
                <span className="text-slate-400 block mb-1">Claim ID</span>
                <span className="font-mono text-slate-700 break-all">{claim.claimId}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-2xs">
                <span className="text-slate-400 block mb-1">Package</span>
                <span className="font-medium text-slate-700">{claim.packageName}</span>
                {claim.copaymentPercentage && (
                  <span className="text-slate-500 block mt-0.5">
                    Co-pay: {claim.copaymentPercentage}%
                  </span>
                )}
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-2xs">
                <span className="text-slate-400 block mb-1">Settlement Date</span>
                <span className="font-medium text-slate-700">
                  {claim.settlementDate ? claim.settlementDate : "Pending Settlement"}
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-2xs">
                <span className="text-slate-400 block mb-1">Associated Invoice</span>
                <span className="font-medium text-slate-700">
                  Net: {fmt(claim.invoiceNetAmount)}
                </span>
                <span className="text-slate-500 block mt-0.5">
                  Date: {claim.invoiceDate} ({claim.invoiceStatus})
                </span>
              </div>
            </div>

            {/* Visit Context */}
            {claim.reasonForVisit && (
              <div className="bg-white p-3.5 rounded-lg border border-slate-100 shadow-2xs text-xs">
                <span className="font-medium text-slate-600 block mb-0.5">Reason for Visit:</span>
                <p className="text-slate-700">{claim.reasonForVisit}</p>
              </div>
            )}

            {/* Insurer Remarks */}
            {claim.remarks && (
              <div className="bg-amber-50/50 border border-amber-200/60 rounded-lg p-3.5 text-xs text-amber-900">
                <div className="flex items-center gap-1.5 font-semibold text-amber-800 mb-1">
                  <BadgeAlert className="w-4 h-4 text-amber-600" />
                  Insurer / Settlement Remarks
                </div>
                <p>{claim.remarks}</p>
              </div>
            )}

            {/* Itemized Claim Items */}
            {claim.items.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Itemized Treatments Covered
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-left">
                      <tr>
                        <th className="p-3">Treatment</th>
                        <th className="p-3">Category</th>
                        <th className="p-3 text-right">Qty</th>
                        <th className="p-3 text-right">Line Total</th>
                        <th className="p-3 text-right">Claimed</th>
                        <th className="p-3 text-right">Approved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {claim.items.map((item) => (
                        <tr key={item.claimItemId}>
                          <td className="p-3 font-medium text-slate-900">{item.treatmentName}</td>
                          <td className="p-3 text-slate-500">{item.category}</td>
                          <td className="p-3 text-right">{item.quantity}</td>
                          <td className="p-3 text-right">{fmt(item.lineTotal)}</td>
                          <td className="p-3 text-right font-medium text-slate-900">
                            {fmt(item.claimedAmount)}
                          </td>
                          <td className="p-3 text-right font-semibold text-emerald-600">
                            {fmt(item.approvedAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Claim Financial Balance Summary */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <Receipt className="w-4 h-4 text-slate-400" />
                <span>
                  Filed under Invoice <span className="font-mono text-slate-700">{claim.invoiceId.slice(0, 8)}…</span>
                </span>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-slate-400 block text-right">Total Claimed</span>
                  <span className="font-bold text-slate-900">{fmt(claimedNum)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-right">Approved Amount</span>
                  <span className="font-bold text-emerald-600">{fmt(approvedNum)}</span>
                </div>
                {claimedNum > approvedNum && (
                  <div>
                    <span className="text-slate-400 block text-right">Difference / Copay</span>
                    <span className="font-bold text-amber-600">{fmt(claimedNum - approvedNum)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
