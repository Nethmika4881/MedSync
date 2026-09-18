"use client";

import React, { useState } from "react";
import type { Claim, ClaimStatus } from "@/lib/types";
import { useBillingStore } from "@/lib/stores/billingStore";
import { Button } from "@/components/ui/button";
import {
  X,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  DollarSign,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updateClaimStatus } from "@/lib/actions/billing";

const STATUS_STEPS: ClaimStatus[] = ["Submitted", "UnderReview", "Approved", "Settled"];

export function ClaimDetailModal({
  claim,
  onClose,
}: {
  claim: Claim;
  onClose: () => void;
}) {
  const { updateClaimStatus: updateStoreClaimStatus } = useBillingStore();

  const [approvedInput, setApprovedInput] = useState<string>(
    (claim.approvedAmount > 0 ? claim.approvedAmount : claim.claimedAmount).toString()
  );
  const [reviewerNotes, setReviewerNotes] = useState(claim.notes ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approvedNumber = parseFloat(approvedInput) || 0;

  async function handleStatusChange(targetStatus: ClaimStatus) {
    setIsSubmitting(true);
    setError(null);

    const res = await updateClaimStatus({
      claimId: claim.claimId,
      status: targetStatus,
      approvedAmount: targetStatus === "Approved" || targetStatus === "Settled" ? approvedNumber : 0,
      notes: reviewerNotes || undefined,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setError(res.message);
      return;
    }

    updateStoreClaimStatus(claim.claimId, targetStatus);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Insurance Claim Tracking</h2>
              <p className="text-white/80 text-xs">
                Claim: {claim.claimId} · Patient: {claim.patientName}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Status Progression Stepper */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Claim Lifecycle Status
            </p>
            <div className="flex items-center justify-between relative">
              {STATUS_STEPS.map((s, idx) => {
                const isCurrent = claim.status === s;
                const isPassed = STATUS_STEPS.indexOf(claim.status) >= idx;
                const isRejected = claim.status === "Rejected" && idx === 2;

                return (
                  <div key={s} className="flex flex-col items-center relative z-10">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                        isRejected
                          ? "bg-rose-600 text-white"
                          : isCurrent
                          ? "bg-[var(--brand-primary)] text-white shadow-md ring-4 ring-teal-100"
                          : isPassed
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 text-slate-500"
                      )}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 mt-1">
                      {isRejected ? "Rejected" : s}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Insurance Provider</span>
              <span className="font-bold text-slate-900">{claim.providerName || "Standard Insurance"}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Policy Number</span>
              <span className="font-mono font-bold text-slate-800">{claim.policyNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Claimed Amount</span>
              <span className="font-extrabold text-slate-900 text-sm">
                LKR {claim.claimedAmount?.toLocaleString() ?? claim.claimedAmount}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Approved Amount</span>
              <span className="font-extrabold text-emerald-600 text-sm">
                LKR {claim.approvedAmount?.toLocaleString() ?? claim.approvedAmount}
              </span>
            </div>
          </div>

          {/* Reviewer Section */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Claim Evaluation &amp; Approvals
            </h3>

            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1">
                Approved Amount (LKR)
              </label>
              <input
                type="number"
                step="0.01"
                max={claim.claimedAmount}
                value={approvedInput}
                onChange={(e) => setApprovedInput(e.target.value)}
                className="w-full rounded-xl border border-slate-200 text-sm font-bold p-2.5 focus:outline-none focus:border-[var(--brand-primary)]"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1">
                Review Notes / Rejection Reason
              </label>
              <textarea
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                rows={2}
                placeholder="Enter approval details or rejection reasons..."
                className="w-full rounded-xl border border-slate-200 text-xs p-2.5 resize-none focus:outline-none focus:border-[var(--brand-primary)]"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Status Actions */}
          <div className="space-y-2 pt-2">
            <div className="flex gap-2">
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleStatusChange("Approved")}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 text-xs font-semibold gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve Claim
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleStatusChange("Rejected")}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-10 text-xs font-semibold gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject Claim
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleStatusChange("Settled")}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-10 text-xs font-semibold gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> Mark Settled
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl h-10 border-slate-200 text-xs px-4"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
