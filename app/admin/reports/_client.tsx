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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileSpreadsheet,
  Calendar,
  Building2,
  Filter,
  CheckCircle2,
  XCircle,
  Shield,
  Loader2,
  FileDown,
} from "lucide-react";
import {
  getBranchAppointmentReport,
  getDoctorPerformanceReport,
  getTreatmentReport,
  getInsuranceReport,
  getExecutiveReportKPIs,
  getBranchOptions,
  ReportFilter,
} from "@/lib/actions/admin-reports";

// CSV Export
const downloadCSV = (data: Record<string, unknown>[], filename: string) => {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((obj) => 
    Object.values(obj).map((val) => 
      `"${val !== null && val !== undefined ? val : ""}"`)
        .join(",")).join("\n");

  const csv = `${headers}\n${rows}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("hidden", "");
  a.setAttribute("href", url);
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

//PDF Export
const downloadPDF = async (
  data: Record<string, unknown>[],
  title: string,
  filename: string,
  periodText: string,
  branchText: string
) => {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const docRef = `RPT-${Date.now().toString().slice(-6)}`;
  const now = new Date();
  const timestamp = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("MEDSYNC HOSPITAL MANAGEMENT SYSTEM", 14, 16);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Report: ${title}`, 14, 22);
  doc.text(`Period: ${periodText}   |   Scope: ${branchText}`, 14, 27);
  doc.text(`Generated on: ${timestamp}   |   Ref ID: ${docRef}`, 14, 32);

  // Top Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, 35, 196, 35);

  const headers = Object.keys(data[0]);
  const rows = data.map((item) =>
    Object.values(item).map((val) =>
      val !== null && val !== undefined ? String(val) : "-"
    )
  );

  autoTable(doc, {
    startY: 38,
    head: [headers.map((h) => h.replace(/([A-Z])/g, " $1").toUpperCase())],
    body: rows,
    theme: "striped",
    headStyles: {
      fillColor: [13, 148, 136], // Teal-600
      textColor: 255,
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: 51,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14, bottom: 25 },
    didDrawPage: (pageData) => {

      const pageHeight = doc.internal.pageSize.height || 297;
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184); // slate-400

      // Thin separator
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, pageHeight - 12, 196, pageHeight - 12);

      doc.text(
        `CONFIDENTIAL – MedSync Internal Audit  |  Doc ID: ${docRef}`,
        14,
        pageHeight - 7
      );

      const pageCount = (doc.internal as any).getNumberOfPages();
      doc.text(
        `Page ${pageData.pageNumber} of ${pageCount}`,
        196,
        pageHeight - 7,
        { align: "right" }
      );
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 40;
  const pageHeight = doc.internal.pageSize.height || 297;

  // If table ends too close to the bottom (leaves < 45mm), put signatures on a new page
  let signY = finalY + 16;
  if (signY + 35 > pageHeight - 20) {
    doc.addPage();
    signY = 25;
  }

  // Validity Disclaimer Text
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Certified true and correct according to official clinic records.",
    14,
    signY
  );

  // Dual Signature Lines
  signY += 16;

  // Left: Prepared By
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(14, signY, 75, signY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("Prepared By (Administrator)", 14, signY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Signature & Date", 14, signY + 9);

  // Right: Authorized By / Director
  doc.line(135, signY, 196, signY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("Authorized By (Medical / Finance Director)", 135, signY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Official Stamp & Date", 135, signY + 9);

  //Save the PDF
  doc.save(filename);
};
export default function ReportsClientPage({
  user,
  reportDetails = [],
}: {
  user: any;
  reportDetails?: any[];
}) {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  const [filters, setFilters] = useState<ReportFilter>({
    startDate: firstDay.toISOString().split("T")[0],
    endDate: today.toISOString().split("T")[0],
    branchId: null,
  });

  const [branches, setBranches] = useState<{ branchId: string; branchName: string }[]>([]);
  const [appointments, setAppointments] = useState<any[]>(reportDetails || []);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [insurance, setInsurance] = useState<any[]>([]);
  const [kpis, setKPIs] = useState({
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    completionRate: 0,
    totalInsuranceUtilized: 0,
  });

  const [activeTab, setActiveTab] = useState("appointments");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [branchList, kpisData, doctorsData, treatmentsData, insuranceData] =
          await Promise.all([
            getBranchOptions(),
            getExecutiveReportKPIs(filters),
            getDoctorPerformanceReport(filters),
            getTreatmentReport(filters),
            getInsuranceReport(),
          ]);

        if (branchList) setBranches(branchList);
        if (kpisData) setKPIs(kpisData);
        if (doctorsData) setDoctors(doctorsData);
        if (treatmentsData) setTreatments(treatmentsData);
        if (insuranceData) setInsurance(insuranceData);

        if (!reportDetails || reportDetails.length === 0) {
          const appts = await getBranchAppointmentReport(filters);
          if (appts) setAppointments(appts);
        }
      } catch (err) {
        console.error("Failed to load initial reports data:", err);
      }
    }

    void loadInitialData();
  }, []);

  const handleApplyFilters = () => {
    startTransition(async () => {
      try {
        const [newKPIs, newAppts, newDocs, newTreats] = await Promise.all([
          getExecutiveReportKPIs(filters),
          getBranchAppointmentReport(filters),
          getDoctorPerformanceReport(filters),
          getTreatmentReport(filters),
        ]);
        if (newKPIs) setKPIs(newKPIs);
        if (newAppts) setAppointments(newAppts);
        if (newDocs) setDoctors(newDocs);
        if (newTreats) setTreatments(newTreats);
      } catch (err) {
        console.error("Filter update failed:", err);
      }
    });
  };

  const handlePreset = (type: "today" | "last7" | "thisMonth" | "year") => {
    const cur = new Date();
    let start = new Date();

    if (type === "today") {
      start = cur;
    } else if (type === "last7") {
      start.setDate(cur.getDate() - 7);
    } else if (type === "thisMonth") {
      start = new Date(cur.getFullYear(), cur.getMonth(), 1);
    } else if (type === "year") {
      start = new Date(cur.getFullYear(), 0, 1);
    }

    const updated = {
      ...filters,
      startDate: start.toISOString().split("T")[0],
      endDate: cur.toISOString().split("T")[0],
    };
    setFilters(updated);

    startTransition(async () => {
      try {
        const [newKPIs, newAppts, newDocs, newTreats] = await Promise.all([
          getExecutiveReportKPIs(updated),
          getBranchAppointmentReport(updated),
          getDoctorPerformanceReport(updated),
          getTreatmentReport(updated),
        ]);
        if (newKPIs) setKPIs(newKPIs);
        if (newAppts) setAppointments(newAppts);
        if (newDocs) setDoctors(newDocs);
        if (newTreats) setTreatments(newTreats);
      } catch (err) {
        console.error("Preset change failed:", err);
      }
    });
  };

  const selectedBranchName =
    (branches || []).find((b) => b.branchId === filters.branchId)?.branchName ||
    "All Hospital Branches";

  const periodLabel = `${filters.startDate} to ${filters.endDate}`;

  const handleExportPDF = () => {
    const report = {
      appointments: {
        data: appointments,
        title: "Branch Appointment Volume & Status",
        filename: `appointments_${filters.startDate}_to_${filters.endDate}.pdf`,
      },
      doctors: {
        data: doctors,
        title: "Doctor Consultations & Fees",
        filename: `doctor_revenue_${filters.startDate}.pdf`,
      },
      treatments: {
        data: treatments,
        title: "Treatment Revenue & Volumes",
        filename: `treatments_${filters.startDate}.pdf`,
      },
      insurance: {
        data: insurance,
        title: "Insurance Utilization",
        filename: "insurance_utilization.pdf",
      },
    }[activeTab as "appointments" | "doctors" | "treatments" | "insurance"];

    if (!report) return;

    void downloadPDF(
      report.data,
      report.title,
      report.filename,
      periodLabel,
      selectedBranchName
    );
  };

  const handleExportCSV = () => {
    const report = {
      appointments: {
        data: appointments,
        filename: `appointments_${filters.startDate}_to_${filters.endDate}.csv`,
      },
      doctors: {
        data: doctors,
        filename: `doctor_revenue_${filters.startDate}.csv`,
      },
      treatments: {
        data: treatments,
        filename: `treatments_${filters.startDate}.csv`,
      },
      insurance: {
        data: insurance,
        filename: "insurance_utilization.csv",
      },
    }[activeTab as "appointments" | "doctors" | "treatments" | "insurance"];

    if (!report) return;
    downloadCSV(report.data, report.filename);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* ─── Top Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Data Reports</h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-teal-600" />
            <span>Export CSV</span>
          </Button>
          <Button
            onClick={handleExportPDF}
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <FileDown className="w-4 h-4 text-teal-600" />
            <span>Export PDF</span>
          </Button>
        </div>
      </div>

      {/* ─── Filter Bar ─── */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Branch Selector */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Building2 className="w-4 h-4 text-slate-400" />
                <select
                  value={filters.branchId || ""}
                  onChange={(e) => setFilters({ ...filters, branchId: e.target.value || null })}
                  className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="">All Branches</option>
                  {(branches || []).map((b) => (
                    <option key={b.branchId} value={b.branchId}>
                      {b.branchName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <span className="text-xs text-slate-400">to</span>

              {/* End Date */}
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />

              <Button
                size="sm"
                onClick={handleApplyFilters}
                disabled={isPending}
                className="h-9 text-xs bg-teal-600 hover:bg-teal-700 text-white"
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <Filter className="w-3.5 h-3.5 mr-1.5" />
                )}
                Apply Filter
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
                  {(appointments || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-slate-400">
                        No appointments recorded for the selected period.
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

          {/* Doctors Tab */}
          <TabsContent value="doctors" className="space-y-4 m-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 p-4 rounded-lg border border-slate-100 gap-3">
              <div>
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                  Doctor Consultations & Estimated Fees
                </h3>
                <p className="text-xs text-slate-500">Volume and billing estimates per physician.</p>
              </div>

              <div className="flex items-center gap-2">
              </div>
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
                  {(doctors || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-slate-400">
                        No doctor activity recorded for this period.
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

          {/*Treatments Tab */}
          <TabsContent value="treatments" className="space-y-4 m-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 p-4 rounded-lg border border-slate-100 gap-3">
              <div>
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                  Treatments & Clinical Services Breakdown
                </h3>
                <p className="text-xs text-slate-500">Volume and revenue by clinical procedure.</p>
              </div>

              <div className="flex items-center gap-2">
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <Table className="text-xs">
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Treatment Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Procedures Count</TableHead>
                    <TableHead className="text-right">Standard Fee</TableHead>
                    <TableHead className="text-right">Gross Billed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(treatments || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-slate-400">
                        No treatments registered in the selected period.
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
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 p-4 rounded-lg border border-slate-100 gap-3">
              <div>
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-teal-600" />
                  Insurance Package Coverage & Utilization
                </h3>
                <p className="text-xs text-slate-500">Active policies and claimed coverage amount.</p>
              </div>

              <div className="flex items-center gap-2">
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <Table className="text-xs">
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Insurance Provider</TableHead>
                    <TableHead>Package Name</TableHead>
                    <TableHead className="text-right">Copayment %</TableHead>
                    <TableHead className="text-right">Active Policies</TableHead>
                    <TableHead className="text-right">Total Coverage Utilized</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(insurance || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-slate-400">
                        No insurance package records found.
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