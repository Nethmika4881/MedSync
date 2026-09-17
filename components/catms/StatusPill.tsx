"use client";

import React from "react";
import { cn } from "@/lib/utils";

type StatusType =
  | "Confirmed" | "Paid" | "Completed" | "Approved" | "Settled" | "Dispensed" | "Performed"
  | "Cancelled" | "Rejected" | "Failed" | "Overdue"
  | "Pending" | "Due" | "Unpaid" | "Submitted" | "UnderReview" | "Low Stock" | "Rescheduled"
  | "Checked-in" | "Checked-out" | "In-Progress" | "Active" | "Managed" | "Resolved"
  | "Partial" | "PartiallyApproved" | "Ordered" | "Insurance" | "Expired" | "Suspended"
  | string;

function getStatusClass(status: StatusType): string {
  switch (status) {
    case "Confirmed":
    case "Paid":
    case "Completed":
    case "Approved":
    case "Settled":
    case "Dispensed":
    case "Performed":
    case "Active":
    case "Managed":
      return "pill-success";
    case "Cancelled":
    case "Rejected":
    case "Failed":
    case "Overdue":
    case "Expired":
    case "Suspended":
      return "pill-danger";
    case "Pending":
    case "Due":
    case "Unpaid":
    case "Submitted":
    case "UnderReview":
    case "Low Stock":
    case "Rescheduled":
    case "Ordered":
    case "Partial":
    case "PartiallyApproved":
    case "Overpaid":
      return "pill-warning";
    case "Checked-in":
    case "Checked-out":
    case "In-Progress":
    case "Insurance":
      return "pill-info";
    default:
      return "pill-info";
  }
}

interface StatusPillProps {
  status: StatusType;
  className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
  return (
    <span className={cn(getStatusClass(status), className)}>
      {status}
    </span>
  );
}
