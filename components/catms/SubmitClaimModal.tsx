"use client";

import React, { useState, useMemo } from "react";
import type { Invoice, Claim } from "@/lib/types";
import { useBillingStore } from "@/lib/stores/billingStore";
import { Button } from "@/components/ui/button";
import {
  X,
  ShieldCheck,
  Building2,
  FileText,
  AlertCircle,
  Loader2,
  Check,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { submitInsuranceClaim } from "@/lib/actions/billing";

const SAMPLE_PROVIDERS = [
  { providerId: "INS-001", name: "Ceylinco Insurance PLC" },
  { providerId: "INS-002", name: "Softlogic Life Insurance" },
  { providerId: "INS-003", name: "Allianz Insurance Lanka" },
  { providerId: "INS-004", name: "AIA Insurance Sri Lanka" },
  { providerId: "INS-005", name: "Janashakthi Insurance" },
];

export function SubmitClaimModal({
  invoice,
  onClose,
  onSuccess,
}: {
  invoice: Invoice;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { setClaims, claims } = useBillingStore();

  const [providerId, setProviderId] = useState(SAMPLE_PROVIDERS[0].providerId);
  const [policyNumber, setPolicyNumber] = useState(`POL-${Math.floor(100000 + Math.random() * 900000)}`);
  const [claimedAmountInput, setClaimedAmountInput] = useState<string>(
    (invoice.balanceDue > 0 ? invoice.balanceDue : invoice.totalAmount).toString()
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const claimedAmount = useMemo(() => {
    const val = parseFloat(claimedAmountInput);
    return isNaN(val) ? 0 : val;
  }, [claimedAmountInput]);

  const selectedProvider = SAMPLE_PROVIDERS.find((p) => p.providerId === providerId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (claimedAmount <= 0 || !policyNumber.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const res = await submitInsuranceClaim({
      invoiceId: invoice.invoiceId,
      providerId,
      policyNumber,
      claimedAmount,
      notes: notes || undefined,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setError(res.message);
      return;
    }

    // Add claim to Zustand store optimistically
    const newClaim: Claim = {
      claimId: res.claimId,
      invoiceId: invoice.invoiceId,
      patientId: invoice.patientId,
      patientName: invoice.patientName,
      insuranceProviderId: providerId,
      providerName: selectedProvider?.name ?? "Insurance Provider",
      policyNumber,
      claimedAmount,
      approvedAmount: 0,
      status: "Submitted",
      submittedDate: new Date().toISOString().split("T")[0],
      notes: notes || undefined,
    };

    setClaims([newClaim, ...claims]);

    if (onSuccess) onSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Submit Insurance Claim</h2>
              <p className="text-white/80 text-xs">
                Patient: {invoice.patientName} · Invoice: {invoice.invoiceId}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Invoice Info */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1 text-xs">
            <p className="text-slate-400 font-medium uppercase tracking-wider">Target Invoice</p>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">{invoice.invoiceId}</span>
              <span className="font-bold text-blue-700">
                Total: LKR {invoice.totalAmount?.toLocaleString() ?? invoice.totalAmount}
              </span>
            </div>
          </div>

          {/* Provider Selection */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Insurance Provider
            </label>
            <select
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 text-xs p-3 focus:outline-none focus:border-[var(--brand-primary)] bg-white font-medium text-slate-800"
            >
              {SAMPLE_PROVIDERS.map((p) => (
                <option key={p.providerId} value={p.providerId}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Policy Number */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Policy / Membership Number
            </label>
            <input
              type="text"
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
              placeholder="e.g. POL-842910"
              required
              className="w-full rounded-xl border border-slate-200 text-xs p-3 focus:outline-none focus:border-[var(--brand-primary)] text-slate-900 font-mono"
            />
          </div>

          {/* Claimed Amount */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Claimed Amount (LKR)
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={claimedAmountInput}
              onChange={(e) => setClaimedAmountInput(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 text-sm font-bold p-3 focus:outline-none focus:border-[var(--brand-primary)] text-slate-900"
            />
          </div>

          {/* Pre-approval Notes */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Authorization Code / Pre-Approval Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Enter pre-authorization reference or guarantee letter details..."
              className="w-full rounded-xl border border-slate-200 text-xs p-3 resize-none focus:outline-none focus:border-[var(--brand-primary)]"
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-xl h-11 border-slate-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={claimedAmount <= 0 || isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 font-semibold disabled:opacity-50 gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Submit Claim
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
