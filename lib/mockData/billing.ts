export interface Invoice {
  invoiceId: string;
  patientId: string;
  patientName: string;
  appointmentId: string;
  consultationId?: string;
  branchId: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  discountAmount: number;
  insuranceCoveredAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: "Paid" | "Unpaid" | "Due" | "Partial" | "Cancelled";
  lineItems: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  itemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// === SEED: INV-2031 is OVERDUE (status "Due", dueDate in the past) ===
export const invoices: Invoice[] = [
  {
    invoiceId: "INV-2028", patientId: "PAT-001", patientName: "Michael Brown", appointmentId: "APT-1001", consultationId: "CON-001", branchId: "BR-001", issueDate: "2026-05-28", dueDate: "2026-06-07", totalAmount: 320, discountAmount: 0, insuranceCoveredAmount: 0, paidAmount: 320, balanceDue: 0, status: "Paid",
    lineItems: [
      { itemId: "LI-001", description: "Cardiology Consultation", quantity: 1, unitPrice: 180, total: 180 },
      { itemId: "LI-002", description: "ECG", quantity: 1, unitPrice: 90, total: 90 },
      { itemId: "LI-003", description: "Blood Panel", quantity: 1, unitPrice: 50, total: 50 },
    ],
  },
  {
    invoiceId: "INV-2029", patientId: "PAT-003", patientName: "Liam Anderson", appointmentId: "APT-1005", consultationId: "CON-002", branchId: "BR-003", issueDate: "2026-06-01", dueDate: "2026-06-11", totalAmount: 185, discountAmount: 0, insuranceCoveredAmount: 0, paidAmount: 0, balanceDue: 185, status: "Due",
    lineItems: [
      { itemId: "LI-004", description: "Dermatology Consultation", quantity: 1, unitPrice: 140, total: 140 },
      { itemId: "LI-005", description: "Skin Biopsy", quantity: 1, unitPrice: 45, total: 45 },
    ],
  },
  // === SEED: INV-2031 — overdue, past due date, tied to patient balance ===
  {
    invoiceId: "INV-2031", patientId: "PAT-007", patientName: "Maria Santos", appointmentId: "APT-1006", consultationId: "CON-003", branchId: "BR-001", issueDate: "2026-06-03", dueDate: "2026-06-13", totalAmount: 450, discountAmount: 0, insuranceCoveredAmount: 200, paidAmount: 0, balanceDue: 250, status: "Due",
    lineItems: [
      { itemId: "LI-006", description: "Cardiology Consultation", quantity: 1, unitPrice: 180, total: 180 },
      { itemId: "LI-007", description: "Stress Test", quantity: 1, unitPrice: 200, total: 200 },
      { itemId: "LI-008", description: "Chest X-Ray", quantity: 1, unitPrice: 70, total: 70 },
    ],
  },
  {
    invoiceId: "INV-2030", patientId: "PAT-005", patientName: "Daniel Martinez", appointmentId: "APT-1010", consultationId: "CON-010", branchId: "BR-002", issueDate: "2026-06-05", dueDate: "2026-06-15", totalAmount: 280, discountAmount: 0, insuranceCoveredAmount: 0, paidAmount: 280, balanceDue: 0, status: "Paid",
    lineItems: [
      { itemId: "LI-009", description: "Neurology Consultation", quantity: 1, unitPrice: 210, total: 210 },
      { itemId: "LI-010", description: "EEG", quantity: 1, unitPrice: 70, total: 70 },
    ],
  },
  {
    invoiceId: "INV-2032", patientId: "PAT-010", patientName: "Noah Garcia", appointmentId: "APT-1007", consultationId: "CON-004", branchId: "BR-001", issueDate: "2026-06-08", dueDate: "2026-06-18", totalAmount: 120, discountAmount: 0, insuranceCoveredAmount: 0, paidAmount: 120, balanceDue: 0, status: "Paid",
    lineItems: [
      { itemId: "LI-011", description: "General Checkup", quantity: 1, unitPrice: 90, total: 90 },
      { itemId: "LI-012", description: "Urinalysis", quantity: 1, unitPrice: 30, total: 30 },
    ],
  },
  {
    invoiceId: "INV-2033", patientId: "PAT-012", patientName: "Ethan Moore", appointmentId: "APT-1008", consultationId: "CON-005", branchId: "BR-001", issueDate: "2026-06-12", dueDate: "2026-06-22", totalAmount: 380, discountAmount: 0, insuranceCoveredAmount: 200, paidAmount: 380, balanceDue: 0, status: "Paid",
    lineItems: [
      { itemId: "LI-013", description: "Orthopedics Consultation", quantity: 1, unitPrice: 190, total: 190 },
      { itemId: "LI-014", description: "Knee X-Ray (Bilateral)", quantity: 2, unitPrice: 55, total: 110 },
      { itemId: "LI-015", description: "Physiotherapy Session", quantity: 1, unitPrice: 80, total: 80 },
    ],
  },
  {
    invoiceId: "INV-2034", patientId: "PAT-014", patientName: "Alexander Jackson", appointmentId: "APT-1009", consultationId: "CON-006", branchId: "BR-001", issueDate: "2026-06-15", dueDate: "2026-06-25", totalAmount: 520, discountAmount: 20, insuranceCoveredAmount: 300, paidAmount: 200, balanceDue: 0, status: "Paid",
    lineItems: [
      { itemId: "LI-016", description: "Cardiology Consultation", quantity: 1, unitPrice: 200, total: 200 },
      { itemId: "LI-017", description: "Echocardiogram", quantity: 1, unitPrice: 250, total: 250 },
      { itemId: "LI-018", description: "Blood Panel (Cardiac)", quantity: 1, unitPrice: 90, total: 90 },
    ],
  },
  {
    invoiceId: "INV-2035", patientId: "PAT-021", patientName: "Abraham Brakering", appointmentId: "APT-1011", consultationId: "CON-007", branchId: "BR-001", issueDate: "2025-12-10", dueDate: "2025-12-20", totalAmount: 250, discountAmount: 0, insuranceCoveredAmount: 0, paidAmount: 250, balanceDue: 0, status: "Paid",
    lineItems: [
      { itemId: "LI-019", description: "Cardiology Consultation", quantity: 1, unitPrice: 200, total: 200 },
      { itemId: "LI-020", description: "Blood Pressure Monitoring", quantity: 1, unitPrice: 50, total: 50 },
    ],
  },
];

export interface Payment {
  paymentId: string;
  invoiceId: string;
  patientId: string;
  patientName: string;
  amount: number;
  method: "Cash" | "Card" | "Online" | "Insurance";
  paidAt: string;
  reference: string;
  status: "Successful" | "Failed" | "Pending";
}

export const payments: Payment[] = [
  { paymentId: "PAY-001", invoiceId: "INV-2028", patientId: "PAT-001", patientName: "Michael Brown", amount: 320, method: "Card", paidAt: "2026-05-28T12:30:00", reference: "TXN-8821", status: "Successful" },
  { paymentId: "PAY-002", invoiceId: "INV-2030", patientId: "PAT-005", patientName: "Daniel Martinez", amount: 280, method: "Online", paidAt: "2026-06-05T11:00:00", reference: "TXN-8830", status: "Successful" },
  { paymentId: "PAY-003", invoiceId: "INV-2032", patientId: "PAT-010", patientName: "Noah Garcia", amount: 120, method: "Cash", paidAt: "2026-06-08T15:00:00", reference: "CASH-114", status: "Successful" },
  { paymentId: "PAY-004", invoiceId: "INV-2033", patientId: "PAT-012", patientName: "Ethan Moore", amount: 380, method: "Card", paidAt: "2026-06-12T10:45:00", reference: "TXN-8855", status: "Successful" },
  { paymentId: "PAY-005", invoiceId: "INV-2034", patientId: "PAT-014", patientName: "Alexander Jackson", amount: 200, method: "Insurance", paidAt: "2026-06-15T14:00:00", reference: "INS-CLM-0039", status: "Successful" },
  { paymentId: "PAY-006", invoiceId: "INV-2035", patientId: "PAT-021", patientName: "Abraham Brakering", amount: 250, method: "Card", paidAt: "2025-12-10T11:30:00", reference: "TXN-7721", status: "Successful" },
];
