"use client";
// lib/stores/billingStore.ts
// Temporary Zustand store — will be replaced by Server Action calls once DB is connected.

import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Invoice, Payment, Claim, ClaimStatus, InsurancePolicy, RefundTask } from "@/lib/types";

interface BillingStore {
  invoices: Invoice[];
  payments: Payment[];
  claims: Claim[];
  insurances: InsurancePolicy[];
  refundTasks: RefundTask[];

  setInvoices: (invoices: Invoice[]) => void;
  setPayments: (payments: Payment[]) => void;
  setClaims: (claims: Claim[]) => void;
  setInsurances: (insurances: InsurancePolicy[]) => void;
  setRefundTasks: (refundTasks: RefundTask[]) => void;

  payInvoice: (invoiceId: string, method: Payment["method"]) => void;
  updateInvoiceStatus: (invoiceId: string, status: Invoice["status"]) => void;
  updateClaimStatus: (claimId: string, status: ClaimStatus) => void;
  addInvoice: (invoice: Invoice) => void;
  processRefundTask: (taskId: string) => void;
}

const MOCK_INITIAL_INVOICES: Invoice[] = [
  {
    invoiceId: "INV-1001",
    appointmentId: "APT-201",
    patientId: "PAT-001",
    patientName: "Saman Kumara",
    branchId: "BR-COLOMBO",
    totalAmount: 4500,
    paidAmount: 4500,
    balanceDue: 0,
    creditBalance: 0,
    status: "Paid",
    issuedAt: "2026-09-15T09:00:00Z",
    issueDate: "2026-09-15",
    dueDate: "2026-10-15",
  },
  {
    invoiceId: "INV-1002",
    appointmentId: "APT-202",
    patientId: "PAT-002",
    patientName: "Nimali Fernando",
    branchId: "BR-COLOMBO",
    totalAmount: 8000,
    paidAmount: 3000,
    balanceDue: 5000,
    creditBalance: 0,
    status: "Partial",
    issuedAt: "2026-09-16T11:30:00Z",
    issueDate: "2026-09-16",
    dueDate: "2026-10-16",
  },
  {
    invoiceId: "INV-1004",
    appointmentId: "APT-204",
    patientId: "PAT-004",
    patientName: "Kavinda Perera",
    branchId: "BR-COLOMBO",
    totalAmount: 12000,
    paidAmount: 12000,
    balanceDue: 0,
    creditBalance: 2500,
    status: "Overpaid",
    issuedAt: "2026-09-17T14:00:00Z",
    issueDate: "2026-09-17",
    dueDate: "2026-10-17",
  },
];

const MOCK_INITIAL_PAYMENTS: Payment[] = [
  {
    paymentId: "PAY-901",
    invoiceId: "INV-1001",
    patientId: "PAT-001",
    patientName: "Saman Kumara",
    amount: 4500,
    method: "Cash",
    paidAt: "2026-09-15T09:15:00Z",
    reference: "TXN-881290",
    status: "Successful",
  },
  {
    paymentId: "PAY-902",
    invoiceId: "INV-1002",
    patientId: "PAT-002",
    patientName: "Nimali Fernando",
    amount: 3000,
    method: "Card",
    paidAt: "2026-09-16T11:45:00Z",
    reference: "TXN-881295",
    status: "Successful",
  },
];

const MOCK_INITIAL_CLAIMS: Claim[] = [
  {
    claimId: "CLM-801",
    invoiceId: "INV-1002",
    patientId: "PAT-002",
    patientName: "Nimali Fernando",
    insuranceProviderId: "PRV-01",
    providerName: "Ceylinco Life Healthcare",
    policyNumber: "POL-77218",
    claimedAmount: 5000,
    approvedAmount: 0,
    status: "Submitted",
    submittedDate: "2026-09-16",
    notes: "Awaiting claim verification",
  },
  {
    claimId: "CLM-802",
    invoiceId: "INV-1004",
    patientId: "PAT-004",
    patientName: "Kavinda Perera",
    insuranceProviderId: "PRV-02",
    providerName: "SLIC MediClaim",
    policyNumber: "POL-99341",
    claimedAmount: 5000,
    approvedAmount: 5000,
    status: "Approved",
    submittedDate: "2026-09-17",
    notes: "Overpayment generated: LKR 2,500 credit balance recorded.",
  },
];

const MOCK_INITIAL_REFUND_TASKS: RefundTask[] = [
  {
    taskId: "REF-TASK-101",
    invoiceId: "INV-1004",
    patientId: "PAT-004",
    patientName: "Kavinda Perera",
    refundAmount: 2500,
    reason: "Insurance claim CLM-802 approved LKR 5,000 after patient already paid LKR 9,500.",
    status: "Pending",
    createdAt: "2026-09-17 15:30",
  },
];

export const useBillingStore = create<BillingStore>((set) => ({
  invoices: MOCK_INITIAL_INVOICES,
  payments: MOCK_INITIAL_PAYMENTS,
  claims: MOCK_INITIAL_CLAIMS,
  insurances: [],
  refundTasks: MOCK_INITIAL_REFUND_TASKS,

  setInvoices: (invoices) => set({ invoices }),
  setPayments: (payments) => set({ payments }),
  setClaims: (claims) => set({ claims }),
  setInsurances: (insurances) => set({ insurances }),
  setRefundTasks: (refundTasks) => set({ refundTasks }),

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

  processRefundTask: (taskId) =>
    set((state) => {
      const task = state.refundTasks.find((t) => t.taskId === taskId);
      if (!task) return state;
      return {
        refundTasks: state.refundTasks.map((t) =>
          t.taskId === taskId
            ? { ...t, status: "Processed" as const, processedAt: new Date().toISOString(), processedBy: "Front Desk" }
            : t
        ),
        invoices: state.invoices.map((inv) =>
          inv.invoiceId === task.invoiceId
            ? { ...inv, status: "Paid" as const, creditBalance: 0 }
            : inv
        ),
      };
    }),
}));

