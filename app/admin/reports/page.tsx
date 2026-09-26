"use client";

import React from "react";
import { useRole } from "@/lib/stores/authStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";

// ─── Utility to download CSV ────────────────────────────────────────────────
const downloadCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => 
    Object.values(obj).map(val => `"${val}"`).join(',')
  ).join('\n');
  const csv = `${headers}\n${rows}`;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// ─── Mock Data ──────────────────────────────────────────────────────────────
const branchAppointmentsData = [
  { date: '2026-09-24', branch: 'Main City Branch', scheduled: 45, completed: 40, cancelled: 5 },
  { date: '2026-09-24', branch: 'Westside Clinic', scheduled: 30, completed: 25, cancelled: 5 },
  { date: '2026-09-24', branch: 'Eastside Medical', scheduled: 20, completed: 18, cancelled: 2 },
  { date: '2026-09-23', branch: 'Main City Branch', scheduled: 50, completed: 48, cancelled: 2 },
  { date: '2026-09-23', branch: 'Westside Clinic', scheduled: 28, completed: 25, cancelled: 3 },
];

const doctorRevenueData = [
  { doctor: 'Dr. Sarah Mitchell', specialization: 'Cardiologist', consultations: 145, revenue: 21750 },
  { doctor: 'Dr. Michael Chen', specialization: 'Neurologist', consultations: 98, revenue: 19600 },
  { doctor: 'Dr. Emily Carter', specialization: 'Pediatrician', consultations: 210, revenue: 16800 },
  { doctor: 'Dr. James Wilson', specialization: 'General Practice', consultations: 320, revenue: 16000 },
];

const outstandingBalancesData = [
  { patientId: 'PAT-1042', name: 'John Smith', lastVisit: '2026-09-10', totalBilled: 450, amountPaid: 200, outstanding: 250 },
  { patientId: 'PAT-2093', name: 'Alice Johnson', lastVisit: '2026-08-22', totalBilled: 1200, amountPaid: 500, outstanding: 700 },
  { patientId: 'PAT-3118', name: 'Robert Brown', lastVisit: '2026-09-01', totalBilled: 150, amountPaid: 0, outstanding: 150 },
  { patientId: 'PAT-0844', name: 'Emma Davis', lastVisit: '2026-07-15', totalBilled: 3000, amountPaid: 1500, outstanding: 1500 },
];

const treatmentCategoryData = [
  { category: 'General Consultation', count: 1240, revenue: 62000 },
  { category: 'Diagnostic Imaging', count: 450, revenue: 112500 },
  { category: 'Laboratory Tests', count: 890, revenue: 44500 },
  { category: 'Minor Surgery', count: 120, revenue: 96000 },
  { category: 'Physical Therapy', count: 320, revenue: 25600 },
];

const insuranceVsOutofPocketData = [
  { month: 'September 2026', totalRevenue: 125000, insuranceCovered: 85000, outOfPocket: 40000, insuranceRatio: '68%' },
  { month: 'August 2026', totalRevenue: 118000, insuranceCovered: 78000, outOfPocket: 40000, insuranceRatio: '66%' },
  { month: 'July 2026', totalRevenue: 132000, insuranceCovered: 92000, outOfPocket: 40000, insuranceRatio: '70%' },
  { month: 'June 2026', totalRevenue: 110000, insuranceCovered: 71000, outOfPocket: 39000, insuranceRatio: '65%' },
];

export default function ReportsPage() {
  const role = useRole();

  if (!role || role !== "admin") {
    return (
      <div className="flex items-center justify-center h-96 text-slate-500">
        You do not have permission to view reports.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Data Reports</h2>
          <p className="text-slate-500">Exportable data tables for management analysis.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <Tabs defaultValue="appointments" className="w-full">
          <TabsList className="flex flex-wrap gap-2 mb-6 bg-transparent h-auto p-0">
            <TabsTrigger value="appointments" className="data-[state=active]:bg-[var(--brand-primary)] data-[state=active]:text-white bg-slate-100 px-4 py-2 rounded-lg">Appointments</TabsTrigger>
            <TabsTrigger value="revenue" className="data-[state=active]:bg-[var(--brand-primary)] data-[state=active]:text-white bg-slate-100 px-4 py-2 rounded-lg">Doctor Revenue</TabsTrigger>
            <TabsTrigger value="debtors" className="data-[state=active]:bg-[var(--brand-primary)] data-[state=active]:text-white bg-slate-100 px-4 py-2 rounded-lg">Outstanding Balances</TabsTrigger>
            <TabsTrigger value="treatments" className="data-[state=active]:bg-[var(--brand-primary)] data-[state=active]:text-white bg-slate-100 px-4 py-2 rounded-lg">Treatments</TabsTrigger>
            <TabsTrigger value="insurance" className="data-[state=active]:bg-[var(--brand-primary)] data-[state=active]:text-white bg-slate-100 px-4 py-2 rounded-lg">Insurance vs Out-of-Pocket</TabsTrigger>
          </TabsList>

          {/* 1. Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4 m-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 p-4 rounded-lg border border-slate-100 gap-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-[var(--brand-primary)]"/> Branch-wise Appointment Summary</h3>
              <Button onClick={() => downloadCSV(branchAppointmentsData, 'appointments_summary.csv')} variant="outline" className="flex items-center gap-2 shrink-0">
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Scheduled</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                    <TableHead className="text-right">Cancelled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branchAppointmentsData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell className="font-medium">{row.branch}</TableCell>
                      <TableCell className="text-right">{row.scheduled}</TableCell>
                      <TableCell className="text-right text-green-600 font-medium">{row.completed}</TableCell>
                      <TableCell className="text-right text-red-500 font-medium">{row.cancelled}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* 2. Doctor Revenue Tab */}
          <TabsContent value="revenue" className="space-y-4 m-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 p-4 rounded-lg border border-slate-100 gap-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-[var(--brand-primary)]"/> Doctor-wise Revenue Report</h3>
              <Button onClick={() => downloadCSV(doctorRevenueData, 'doctor_revenue.csv')} variant="outline" className="flex items-center gap-2 shrink-0">
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Doctor Name</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead className="text-right">Consultations</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctorRevenueData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{row.doctor}</TableCell>
                      <TableCell>{row.specialization}</TableCell>
                      <TableCell className="text-right">{row.consultations}</TableCell>
                      <TableCell className="text-right font-semibold">${row.revenue.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* 3. Outstanding Balances Tab */}
          <TabsContent value="debtors" className="space-y-4 m-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 p-4 rounded-lg border border-slate-100 gap-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-[var(--brand-primary)]"/> Patients with Outstanding Balances</h3>
              <Button onClick={() => downloadCSV(outstandingBalancesData, 'outstanding_balances.csv')} variant="outline" className="flex items-center gap-2 shrink-0">
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
                    <TableHead className="text-right">Total Billed</TableHead>
                    <TableHead className="text-right">Amount Paid</TableHead>
                    <TableHead className="text-right text-red-500">Outstanding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outstandingBalancesData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-slate-500">{row.patientId}</TableCell>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.lastVisit}</TableCell>
                      <TableCell className="text-right">${row.totalBilled.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-green-600">${row.amountPaid.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-red-600 font-bold">${row.outstanding.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* 4. Treatments Tab */}
          <TabsContent value="treatments" className="space-y-4 m-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 p-4 rounded-lg border border-slate-100 gap-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-[var(--brand-primary)]"/> Treatments per Category</h3>
              <Button onClick={() => downloadCSV(treatmentCategoryData, 'treatments_category.csv')} variant="outline" className="flex items-center gap-2 shrink-0">
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Treatment Category</TableHead>
                    <TableHead className="text-right">Number of Treatments</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treatmentCategoryData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{row.category}</TableCell>
                      <TableCell className="text-right">{row.count.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">${row.revenue.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* 5. Insurance Tab */}
          <TabsContent value="insurance" className="space-y-4 m-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 p-4 rounded-lg border border-slate-100 gap-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-[var(--brand-primary)]"/> Insurance vs Out-of-Pocket</h3>
              <Button onClick={() => downloadCSV(insuranceVsOutofPocketData, 'insurance_vs_outofpocket.csv')} variant="outline" className="flex items-center gap-2 shrink-0">
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                    <TableHead className="text-right">Insurance Covered</TableHead>
                    <TableHead className="text-right">Out of Pocket</TableHead>
                    <TableHead className="text-right text-brand-600">% Insurance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insuranceVsOutofPocketData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{row.month}</TableCell>
                      <TableCell className="text-right font-bold text-slate-700">${row.totalRevenue.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-blue-600">${row.insuranceCovered.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-amber-600">${row.outOfPocket.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-[var(--brand-primary)] font-bold">{row.insuranceRatio}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
