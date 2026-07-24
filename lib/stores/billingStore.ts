"use client";
import { create } from "zustand";
import { invoices as initialInvoices, payments as initialPayments, type Invoice, type Payment } from "@/lib/mockData/billing";
import { claims as initialClaims, type Claim, type ClaimStatus } from "@/lib/mockData/claims";
import { insurances as initialInsurances } from "@/lib/mockData/insurance";
import { nanoid } from "nanoid";

interface BillingStore {
  invoices: Invoice[];
  payments: Payment[];
  claims: Claim[];
  insurances: typeof initialInsurances;

  payInvoice: (invoiceId: string, method: "Cash" | "Card" | "Online") => void;
  updateInvoiceStatus: (invoiceId: string, status: Invoice["status"]) => void;
  updateClaimStatus: (claimId: string, status: ClaimStatus) => void;
  addInvoice: (invoice: Invoice) => void;
}

export const useBillingStore = create<BillingStore>((set) => ({
  invoices: initialInvoices,
  payments: initialPayments,
  claims: initialClaims,
  insurances: initialInsurances,

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
    set((state) => {
      const claim = state.claims.find((c) => c.claimId === claimId);
      if (!claim) return state;

      let newInsurances = state.insurances;
      // On Approved/Settled — update insurance used coverage
      if ((status === "Approved" || status === "Settled") && claim.approvedAmount > 0) {
        newInsurances = state.insurances.map((ins) =>
          ins.patientId === claim.patientId
            ? { ...ins, usedCoverageAmount: ins.usedCoverageAmount + claim.approvedAmount }
            : ins
        );
      }

      return {
        claims: state.claims.map((c) =>
          c.claimId === claimId
            ? { ...c, status, reviewedDate: new Date().toISOString().split("T")[0] }
            : c
        ),
        insurances: newInsurances,
      };
    }),

  addInvoice: (invoice) =>
    set((state) => ({ invoices: [invoice, ...state.invoices] })),
}));
