"use client";
// lib/stores/billingStore.ts
// Temporary Zustand store — will be replaced by Server Action calls once DB is connected.

import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Invoice, Payment, Claim, ClaimStatus, InsurancePolicy } from "@/lib/types";

interface BillingStore {
  invoices: Invoice[];
  payments: Payment[];
  claims: Claim[];
  insurances: InsurancePolicy[];

  setInvoices: (invoices: Invoice[]) => void;
  setPayments: (payments: Payment[]) => void;
  setClaims: (claims: Claim[]) => void;
  setInsurances: (insurances: InsurancePolicy[]) => void;

  payInvoice: (invoiceId: string, method: Payment["method"]) => void;
  updateInvoiceStatus: (invoiceId: string, status: Invoice["status"]) => void;
  updateClaimStatus: (claimId: string, status: ClaimStatus) => void;
  addInvoice: (invoice: Invoice) => void;
}

export const useBillingStore = create<BillingStore>((set) => ({
  invoices: [],
  payments: [],
  claims: [],
  insurances: [],

  setInvoices: (invoices) => set({ invoices }),
  setPayments: (payments) => set({ payments }),
  setClaims: (claims) => set({ claims }),
  setInsurances: (insurances) => set({ insurances }),

  payInvoice: (invoiceId, method) =>
    set((state) => {
      const invoice = state.invoices.find((i) => i.invoiceId === invoiceId);
      if (!invoice) return state;
      const newPayment: Payment = {
        paymentId: `PAY-${nanoid(4)}`,
        invoiceId,
        patientId: invoice.patientId,
        patientName: invoice.patientName,
        amount: invoice.balanceDue,
        method,
        paidAt: new Date().toISOString(),
        reference: `TXN-${nanoid(6).toUpperCase()}`,
        status: "Successful",
      };
      return {
        invoices: state.invoices.map((i) =>
          i.invoiceId === invoiceId
            ? { ...i, status: "Paid" as const, paidAmount: i.totalAmount, balanceDue: 0 }
            : i
        ),
        payments: [newPayment, ...state.payments],
      };
    }),

  updateInvoiceStatus: (invoiceId, status) =>
    set((state) => ({
      invoices: state.invoices.map((i) =>
        i.invoiceId === invoiceId ? { ...i, status } : i
      ),
    })),

  updateClaimStatus: (claimId, status) =>
    set((state) => ({
      claims: state.claims.map((c) =>
        c.claimId === claimId
          ? { ...c, status, reviewedDate: new Date().toISOString().split("T")[0] }
          : c
      ),
    })),

  addInvoice: (invoice) =>
    set((state) => ({ invoices: [invoice, ...state.invoices] })),
}));
