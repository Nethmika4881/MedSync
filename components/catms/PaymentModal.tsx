"use client";

import React, { useState, useMemo } from "react";
import type { Invoice, Payment } from "@/lib/types";
import { useBillingStore } from "@/lib/stores/billingStore";
import { Button } from "@/components/ui/button";
import {
  X,
  CreditCard,
  Banknote,
  Building2,
  DollarSign,
  AlertCircle,
  Check,
  Loader2,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { processPayment } from "@/lib/actions/billing";

type PaymentMethod = "Cash" | "Card" | "Bank Transfer";

export function PaymentModal({
  invoice,
  onClose,
  onSuccess,
}: {
  invoice: Invoice;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { payInvoice } = useBillingStore();

  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [amountInput, setAmountInput] = useState<string>(invoice.balanceDue.toString());
  const [reference, setReference] = useState<string>(`TXN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNumber = useMemo(() => {
    const val = parseFloat(amountInput);
    return isNaN(val) ? 0 : val;
  }, [amountInput]);

  const remainingBalance = useMemo(() => {
    return Math.max(0, invoice.balanceDue - amountNumber);
  }, [invoice.balanceDue, amountNumber]);

  const isOverpaid = amountNumber > invoice.balanceDue;
  const isInvalidAmount = amountNumber <= 0 || isOverpaid;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isInvalidAmount) return;

    setIsSubmitting(true);
    setError(null);

    const res = await processPayment({
      invoiceId: invoice.invoiceId,
      amount: amountNumber,
      method,
      reference,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setError(res.message);
      return;
    }

    // Update Zustand store optimistically
    payInvoice(invoice.invoiceId, method);

    if (onSuccess) onSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Process Collection Payment</h2>
              <p className="text-white/80 text-xs">
                Invoice: {invoice.invoiceId} · Patient: {invoice.patientName}
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Invoice Balance Banner */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Total Invoice Amount</span>
              <span className="font-bold text-slate-900 text-base">
                LKR {invoice.totalAmount?.toLocaleString() ?? invoice.totalAmount}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block font-medium">Current Balance Due</span>
              <span className="font-extrabold text-teal-700 text-base">
                LKR {invoice.balanceDue?.toLocaleString() ?? invoice.balanceDue}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Payment Collection Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "Cash", label: "Cash", icon: Banknote },
                  { id: "Card", label: "Credit/Debit", icon: CreditCard },
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
                        ? "border-[var(--brand-primary)] bg-teal-50/50 text-[var(--brand-primary)] shadow-sm"
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

          {/* Amount Input & Zero-Balance Validation */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Payment Amount (LKR)
              </label>
              <button
                type="button"
                onClick={() => setAmountInput(invoice.balanceDue.toString())}
                className="text-xs text-[var(--brand-primary)] font-bold hover:underline"
              >
                Pay Full Balance
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="1"
                max={invoice.balanceDue}
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className={cn(
                  "w-full rounded-xl border text-base font-bold p-3 focus:outline-none transition-all",
                  isOverpaid
                    ? "border-rose-400 focus:ring-1 focus:ring-rose-500 bg-rose-50/30 text-rose-900"
                    : "border-slate-200 focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] text-slate-900"
                )}
              />
            </div>

            {/* Overpayment Warning */}
            {isOverpaid && (
              <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                SAFE-5 Rule: Payment cannot exceed balance due (LKR {invoice.balanceDue}).
              </p>
            )}
          </div>

          {/* Reference Number */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Transaction / Reference Number
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. TXN-984210"
              className="w-full rounded-xl border border-slate-200 text-xs p-3 focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] text-slate-800 font-mono"
            />
          </div>

          {/* Dynamic Balance Preview Badge */}
          <div className="bg-slate-100 p-3.5 rounded-2xl flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600">Calculated Remaining Balance:</span>
            <span
              className={cn(
                "font-extrabold px-2.5 py-0.5 rounded-full text-xs",
                remainingBalance === 0
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              )}
            >
              {remainingBalance === 0 ? "LKR 0 (Zero Balance · Fully Settled)" : `LKR ${remainingBalance.toLocaleString()}`}
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
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
              disabled={isInvalidAmount || isSubmitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 font-semibold disabled:opacity-50 gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Record Collection
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
