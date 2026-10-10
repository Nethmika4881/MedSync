"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import type { AuthUser } from "@/lib/types";
import { useRouter, usePathname } from "next/navigation";

// CSV Export
const downloadCSV = (data: Record<string, unknown>[], filename: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]).join(",");
  const rows = data
    .map((obj) =>
      Object.values(obj)
        .map((val) => `"${val}"`)
        .join(","),
    )
    .join("\n");
  const csv = `${headers}\n${rows}`;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("hidden", "");
  a.setAttribute("href", url);
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

type OutstandingBalanceRow = {
  patientID: string;
  patientName: string;
  lastVisit: string;
  totalBilled: number;
  amountPaid: number;
  outstanding: number;
  unpaidInvoices: number;
};

const treatmentCategoryData = [
  { category: "General Consultation", count: 1240, revenue: 62000 },
  { category: "Diagnostic Imaging", count: 450, revenue: 112500 },
  { category: "Laboratory Tests", count: 890, revenue: 44500 },
  { category: "Minor Surgery", count: 120, revenue: 96000 },
  { category: "Physical Therapy", count: 320, revenue: 25600 },
];

const insuranceVsOutofPocketData = [
  {
    month: "September 2026",
    totalRevenue: 125000,
    insuranceCovered: 85000,
    outOfPocket: 40000,
    insuranceRatio: "68%",
  },
  {
    month: "August 2026",
    totalRevenue: 118000,
    insuranceCovered: 78000,
    outOfPocket: 40000,
    insuranceRatio: "66%",
  },
  {
    month: "July 2026",
    totalRevenue: 132000,
    insuranceCovered: 92000,
    outOfPocket: 40000,
    insuranceRatio: "70%",
  },
  {
    month: "June 2026",
    totalRevenue: 110000,
    insuranceCovered: 71000,
    outOfPocket: 39000,
    insuranceRatio: "65%",
  },
];

export default function ReportsPage({
  user,
  reportDetails,
  branchDetails,
  branchID,
  startDate,
  endDate,
  doctorRevenueDetails,
  outstandingBalanceDetails,
}: {
  user: AuthUser;
  reportDetails: any[];
  branchDetails: any[];
  branchID?: string;
  startDate: string;
  endDate: string;
  doctorRevenueDetails: any[];
  outstandingBalanceDetails: OutstandingBalanceRow[];
}) {
  const role = user?.role;
  if (!role || role !== "admin") {
    return (
      <div className="flex items-center justify-center h-96 text-slate-500">
        You do not have permission to view reports.
      </div>
    );
  }

  const router = useRouter();
  const pathname = usePathname();
  const branchAppointmentsData = reportDetails;
  const doctorRevenueData = doctorRevenueDetails;
  const outstandingBalancesData = outstandingBalanceDetails;
  function handleFilterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const selectedStartDate = String(formData.get("startDate") || "");
    const selectedEndDate = String(formData.get("endDate") || "");
    const selectedBranch = String(formData.get("branchID") || "");

    const params = new URLSearchParams();

    params.set("startDate", selectedStartDate);
    params.set("endDate", selectedEndDate);

    if (selectedBranch) {
      params.set("branchID", selectedBranch);
    }

    router.push(`${pathname}?${params.toString()}`);
  }
  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* ─── Top Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Data Reports
          </h2>
          <p className="text-slate-500">
            Exportable data tables for management analysis.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleFilterSubmit}
        className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4"
      >
        <div>
          <label
            htmlFor="report-start-date"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Start Date
          </label>

          <input
            id="report-start-date"
            name="startDate"
            type="date"
            defaultValue={startDate}
            required
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[var(--brand-primary)]"
          />
        </div>

        <div>
          <label
            htmlFor="report-end-date"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            End Date
          </label>

          <input
            id="report-end-date"
            name="endDate"
            type="date"
            defaultValue={endDate}
            required
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[var(--brand-primary)]"
          />
        </div>

        <div>
          <label
            htmlFor="report-branch"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Branch
          </label>

          <select
            id="report-branch"
            name="branchID"
            defaultValue={branchID || ""}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[var(--brand-primary)]"
          >
            <option value="">All branches</option>

            {branchDetails.map((branch) => (
              <option key={branch.branch_id} value={branch.branch_id}>
                {branch.branch_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <Button
            type="submit"
            className="h-10 w-full bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-secondary)]"
          >
            Apply Filters
          </Button>
        </div>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <Tabs defaultValue="appointments" className="w-full">
          <TabsList className="flex flex-wrap gap-2 mb-6 bg-transparent h-auto p-0">
            <TabsTrigger
              value="appointments"
              className="data-[state=active]:bg-[var(--brand-primary)] data-[state=active]:text-white bg-slate-100 px-4 py-2 rounded-lg"
            >
              Appointments
            </TabsTrigger>
            <TabsTrigger
              value="revenue"
              className="data-[state=active]:bg-[var(--brand-primary)] data-[state=active]:text-white bg-slate-100 px-4 py-2 rounded-lg"
            >
              Doctor Revenue
            </TabsTrigger>
            <TabsTrigger
              value="debtors"
              className="data-[state=active]:bg-[var(--brand-primary)] data-[state=active]:text-white bg-slate-100 px-4 py-2 rounded-lg"
            >
              Outstanding Balances
            </TabsTrigger>
            <TabsTrigger
              value="treatments"
              className="data-[state=active]:bg-[var(--brand-primary)] data-[state=active]:text-white bg-slate-100 px-4 py-2 rounded-lg"
            >
              Treatments
            </TabsTrigger>
            <TabsTrigger
              value="insurance"
              className="data-[state=active]:bg-[var(--brand-primary)] data-[state=active]:text-white bg-slate-100 px-4 py-2 rounded-lg"
            >
              Insurance vs Out-of-Pocket
            </TabsTrigger>
          </TabsList>

          {/* 1. Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4 m-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 p-4 rounded-lg border border-slate-100 gap-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[var(--brand-primary)]" />{" "}
                Branch-wise Appointment Summary
              </h3>
              <Button
                onClick={() =>
                  downloadCSV(
                    branchAppointmentsData,
                    "appointments_summary.csv",
                  )
                }
                variant="outline"
                className="flex items-center gap-2 shrink-0"
              >
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                Presets:
              </span>
              <button
                onClick={() => handlePreset("today")}
                className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition"
              >
                Today
              </button>
              <button
                onClick={() => handlePreset("last7")}
                className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition"
              >
                7 Days
              </button>
              <button
                onClick={() => handlePreset("thisMonth")}
                className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition"
              >
                This Month
              </button>
              <button
                onClick={() => handlePreset("year")}
                className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition"
              >
                This Year
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards  */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Total Appointments
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{kpis.totalAppointments}</div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              {kpis.completedAppointments} completed ({kpis.completionRate}%)
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Cancelled Bookings
            </span>
            <div className="text-2xl font-bold text-red-600 mt-1">{kpis.cancelledAppointments}</div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <XCircle className="w-3 h-3 text-red-500" /> Cancelled slots
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Treatments Performed
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {(treatments || []).reduce((acc, t) => acc + (t.treatmentCount || 0), 0)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Across {(treatments || []).length} categories
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Insurance Utilized
            </span>
            <div className="text-xl font-bold text-teal-600 mt-1">
              Rs. {kpis.totalInsuranceUtilized.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Total coverage applied</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <Tabs defaultValue="appointments" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap gap-2 mb-6 bg-transparent h-auto p-0">
            <TabsTrigger
              value="appointments"
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white bg-slate-100 px-4 py-2 rounded-lg text-xs font-semibold"
            >
              Appointments Summary
            </TabsTrigger>
            <TabsTrigger
              value="doctors"
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white bg-slate-100 px-4 py-2 rounded-lg text-xs font-semibold"
            >
              Doctor Consultations
            </TabsTrigger>
            <TabsTrigger
              value="treatments"
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white bg-slate-100 px-4 py-2 rounded-lg text-xs font-semibold"
            >
              Treatments & Services
            </TabsTrigger>
            <TabsTrigger
              value="insurance"
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white bg-slate-100 px-4 py-2 rounded-lg text-xs font-semibold"
            >
              Insurance Utilization
            </TabsTrigger>
          </TabsList>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4 m-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 p-4 rounded-lg border border-slate-100 gap-3">
              <div>
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                  Branch Appointment Volume & Status
                </h3>
                <p className="text-xs text-slate-500">Scheduled vs completed appointments per branch.</p>
              </div>

              <div className="flex items-center gap-2">
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <Table className="text-xs">
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Scheduled</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                    <TableHead className="text-right">Cancelled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branchAppointmentsData.map((row, i) => (
                    <TableRow key={`${row.date}-${row.branchID}`}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell className="font-medium">
                        {row.branchName}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.scheduled}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        {row.completed}
                      </TableCell>
                      <TableCell className="text-right text-red-500 font-medium">
                        {row.cancelled}
                      </TableCell>
                    </TableRow>
                  ) : (
                    appointments.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono">{row.date}</TableCell>
                        <TableCell className="font-medium text-slate-900">{row.branchName}</TableCell>
                        <TableCell className="text-right font-bold text-slate-800">{row.totalAppointments}</TableCell>
                        <TableCell className="text-right text-blue-600">{row.scheduled}</TableCell>
                        <TableCell className="text-right text-emerald-600 font-medium">{row.completed}</TableCell>
                        <TableCell className="text-right text-red-500">{row.cancelled}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* 2. Doctor Revenue Tab */}
          <TabsContent value="revenue" className="space-y-4 m-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 p-4 rounded-lg border border-slate-100 gap-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[var(--brand-primary)]" />{" "}
                Doctor-wise Revenue Report
              </h3>
              <Button
                onClick={() =>
                  downloadCSV(doctorRevenueData, "doctor_revenue.csv")
                }
                variant="outline"
                className="flex items-center gap-2 shrink-0"
              >
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <Table className="text-xs">
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Doctor Name</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead className="text-right">Consultations</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                    <TableHead className="text-right">Estimated Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctorRevenueData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {row.doctor}
                      </TableCell>
                      <TableCell>{row.specialization}</TableCell>
                      <TableCell className="text-right">
                        {row.consultations}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${row.revenue.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ) : (
                    doctors.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-semibold text-slate-900">{row.doctorName}</TableCell>
                        <TableCell className="text-slate-600">{row.specialization}</TableCell>
                        <TableCell className="text-right font-medium">{row.consultations}</TableCell>
                        <TableCell className="text-right text-emerald-600">{row.completedConsultations}</TableCell>
                        <TableCell className="text-right font-bold text-slate-900">
                          Rs. {Number(row.estimatedRevenue || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* 3. Outstanding Balances Tab */}
          <TabsContent value="debtors" className="space-y-4 m-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 p-4 rounded-lg border border-slate-100 gap-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[var(--brand-primary)]" />{" "}
                Patients with Outstanding Balances
              </h3>
              <Button
                onClick={() =>
                  downloadCSV(
                    outstandingBalancesData,
                    "outstanding_balances.csv",
                  )
                }
                variant="outline"
                className="flex items-center gap-2 shrink-0"
              >
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Patient ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Last Visit</TableHead>
                    <TableHead className="text-right">Unpaid Invoices</TableHead>
                    <TableHead className="text-right">Total Billed</TableHead>
                    <TableHead className="text-right">Amount Paid</TableHead>
                    <TableHead className="text-right text-red-500">
                      Outstanding
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outstandingBalancesData.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-8 text-center text-slate-500"
                      >
                        No outstanding balances for the selected filters.
                      </TableCell>
                    </TableRow>
                  )}
                  {outstandingBalancesData.map((row) => (
                    <TableRow key={row.patientID}>
                      <TableCell className="text-slate-500">
                        {row.patientID.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {row.patientName}
                      </TableCell>
                      <TableCell>{row.lastVisit}</TableCell>
                      <TableCell className="text-right">
                        {row.unpaidInvoices}
                      </TableCell>
                      <TableCell className="text-right">
                        ${row.totalBilled.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        ${row.amountPaid.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-600 font-bold">
                        ${row.outstanding.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* 4. Treatments Tab */}
          <TabsContent value="treatments" className="space-y-4 m-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 p-4 rounded-lg border border-slate-100 gap-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[var(--brand-primary)]" />{" "}
                Treatments per Category
              </h3>
              <Button
                onClick={() =>
                  downloadCSV(treatmentCategoryData, "treatments_category.csv")
                }
                variant="outline"
                className="flex items-center gap-2 shrink-0"
              >
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <Table className="text-xs">
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Treatment Category</TableHead>
                    <TableHead className="text-right">
                      Number of Treatments
                    </TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treatmentCategoryData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {row.category}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${row.revenue.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ) : (
                    treatments.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-semibold text-slate-900">{row.treatmentName}</TableCell>
                        <TableCell>
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                            {row.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">{row.treatmentCount}</TableCell>
                        <TableCell className="text-right text-slate-500">
                          Rs. {Number(row.unitPrice || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-900">
                          Rs. {Number(row.totalRevenue || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Insurance Tab */}
          <TabsContent value="insurance" className="space-y-4 m-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 p-4 rounded-lg border border-slate-100 gap-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[var(--brand-primary)]" />{" "}
                Insurance vs Out-of-Pocket
              </h3>
              <Button
                onClick={() =>
                  downloadCSV(
                    insuranceVsOutofPocketData,
                    "insurance_vs_outofpocket.csv",
                  )
                }
                variant="outline"
                className="flex items-center gap-2 shrink-0"
              >
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <Table className="text-xs">
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                    <TableHead className="text-right">
                      Insurance Covered
                    </TableHead>
                    <TableHead className="text-right">Out of Pocket</TableHead>
                    <TableHead className="text-right text-brand-600">
                      % Insurance
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insuranceVsOutofPocketData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{row.month}</TableCell>
                      <TableCell className="text-right font-bold text-slate-700">
                        ${row.totalRevenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        ${row.insuranceCovered.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-amber-600">
                        ${row.outOfPocket.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-[var(--brand-primary)] font-bold">
                        {row.insuranceRatio}
                      </TableCell>
                    </TableRow>
                  ) : (
                    insurance.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-semibold text-slate-900">{row.providerName}</TableCell>
                        <TableCell className="text-slate-700">{row.packageName}</TableCell>
                        <TableCell className="text-right font-medium">{row.copaymentPercentage}%</TableCell>
                        <TableCell className="text-right font-bold text-slate-800">{row.activePolicies}</TableCell>
                        <TableCell className="text-right font-bold text-teal-700">
                          Rs. {Number(row.totalUtilized || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}