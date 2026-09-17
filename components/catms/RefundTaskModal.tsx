"use client";

import React, { useState } from "react";
import type { RefundTask } from "@/lib/types";
import { useBillingStore } from "@/lib/stores/billingStore";
import { Button } from "@/components/ui/button";
import {
  X,
  CreditCard,
  Banknote,
  Building2,
  RotateCcw,
  AlertTriangle,
  Check,
  Loader2,
  ShieldCheck,
  User,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { processPatientRefund } from "@/lib/actions/billing";

type RefundMethod = "Cash" | "Card Reversal" | "Bank Transfer";

export function RefundTaskModal({
  task,
  onClose,
  onSuccess,
}: {
  task: RefundTask;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { processRefundTask } = useBillingStore();

  const [method, setMethod] = useState<RefundMethod>("Cash");
  const [reference, setReference] = useState<string>(
    `REF-TXN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const res = await processPatientRefund({
      taskId: task.taskId,
      invoiceId: task.invoiceId,
      amount: task.refundAmount,
      method,
      reference,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setError(res.message);
      return;
    }

    // Update Zustand store optimistically
    processRefundTask(task.taskId);

    if (onSuccess) onSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-md">
                  REQ-32 Overpayment Refund
                </span>
              </div>
              <h2 className="text-xl font-bold mt-0.5">Process Credit Refund</h2>
              <p className="text-white/80 text-xs">
                Task ID: {task.taskId} · Invoice: {task.invoiceId}
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Refund Details Banner */}
          <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200/80 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-slate-500 text-xs block font-medium flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-amber-600" /> Patient Name
                </span>
                <span className="font-bold text-slate-900 text-sm">{task.patientName}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 text-xs block font-medium">Refund Amount</span>
                <span className="font-extrabold text-amber-700 text-lg">
                  LKR {task.refundAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200/60 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Reason for Refund Task:</span>
                <span className="text-amber-800">{task.reason}</span>
              </div>
            </div>
          </div>

          {/* Refund Method Selector */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Payout Refund Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "Cash", label: "Cash Payout", icon: Banknote },
                  { id: "Card Reversal", label: "Card Reversal", icon: CreditCard },
                  { id: "Bank Transfer", label: "Bank Transfer", icon: Building2 },
                ] as const
              ).map((m) => {
                const Icon = m.icon;
                const isSelected = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-2xl border-2 text-xs font-bold transition-all gap-1.5",
                      isSelected
                        ? "border-amber-600 bg-amber-50/60 text-amber-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reference Number */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Refund Reference / Receipt No.
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. REF-TXN-984210"
              className="w-full rounded-xl border border-slate-200 text-xs p-3 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 text-slate-800 font-mono"
            />
          </div>

          {/* Notice */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Processing this refund will clear the invoice credit balance and update status to <strong>Paid</strong>.
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
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
              disabled={isSubmitting}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-11 font-semibold disabled:opacity-50 gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Issue Refund
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
