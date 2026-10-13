"use client";

import React, { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MapPin,
  Users,
  Stethoscope,
  Shield,
  Pencil,
  Loader2,
  X,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getBranchDetails,
  getBranchById,
  branchTreatment,
  complaints as resolveComplaint,
  updateBranchDetails,
  assignManager,
  removeManager,
  assignStaff,
  removeStaff,
} from "@/lib/actions/branches";

export default function BranchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const branchId = unwrappedParams.id;

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "services" | "staff" | "invoices" | "complaints"
  >("overview");

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [isAssignStaffModalOpen, setIsAssignStaffModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState({
    branch_name: "",
    address_line1: "",
    city: "",
    province: "",
  });
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [newStaffId, setNewStaffId] = useState("");
  const [staffSearchQuery, setStaffSearchQuery] = useState("");

  const loadDetails = useCallback(async () => {
    try {
      const details = await getBranchDetails(branchId);
      const fallback = details ? null : await getBranchById(branchId);
      const res =
        details ||
        (fallback
          ? {
              branch: fallback,
              staff: fallback.staff || [],
              available_staff: fallback.available_staff || [],
              treatments: [],
              visits: [],
              invoices: [],
              complaints: [],
              metrics: {
                doctorCount: fallback.doctor_count || 0,
                staffCount: Math.max(
                  (fallback.staff || []).length - (fallback.doctor_count || 0),
                  0,
                ),
                totalRevenue: 0,
                totalDue: 0,
                pendingComplaints: 0,
              },
            }
          : null);

      if (res) {
        setData(res);
        setEditForm({
          branch_name: res.branch.branch_name,
          address_line1: res.branch.address_line1,
          city: res.branch.city,
          province: res.branch.province || "",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  const handleToggleTreatment = async (
    treatmentId: string,
    currentStatus: boolean,
  ) => {
    const res = await branchTreatment(branchId, treatmentId, !currentStatus);
    if (res.success) {
      setData((prev: any) => ({
        ...prev,
        treatments: prev.treatments.map((t: any) =>
          t.treatmentId === treatmentId
            ? { ...t, isOffered: !currentStatus }
            : t,
        ),
      }));
    }
  };

  const handleResolveComplaint = async (complaintId: string) => {
    const res = await resolveComplaint(complaintId);
    if (res.success) {
      await loadDetails();
    }
  };

  const handleEditBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const res = await updateBranchDetails(branchId, editForm);
      if (res.success) {
        setIsEditModalOpen(false);
        loadDetails();
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleChangeManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const res = await assignManager(branchId, selectedManagerId);
      if (res.success) {
        setIsManagerModalOpen(false);
        loadDetails();
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveManager = async () => {
    if (!confirm("Remove the current branch manager?")) return;
    const res = await removeManager(branchId);
    if (res.success) loadDetails();
  };

  const handleAssignStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const res = await assignStaff(branchId, newStaffId);
      if (res.success) {
        setIsAssignStaffModalOpen(false);
        setNewStaffId("");
        loadDetails();
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveStaff = async (employeeId: string) => {
    if (!confirm("Remove this staff member from this branch?")) return;
    const res = await removeStaff(employeeId, branchId);
    if (res.success) loadDetails();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
      </div>
    );
  }

  if (!data)
    return (
      <div className="text-center py-12 text-slate-900 font-bold">
        Branch not found
      </div>
    );

  const { branch, staff, metrics, treatments, visits, invoices, complaints } =
    data;
  const managerCandidates = staff.filter((s: any) => s.role !== "Doctor");
  const filteredAvailableStaff = data.available_staff?.filter((s: any) =>
    s.name.toLowerCase().includes(staffSearchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        href="/admin/branches"
        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to all branches
      </Link>

      {/* Header Banner */}
      <Card className="border-0 shadow-sm overflow-hidden bg-gradient-to-r from-teal-600 to-cyan-700">
        <div className="p-8 relative">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={cn(
                    "text-xs font-bold px-2.5 py-1 rounded-full",
                    branch.is_active
                      ? "bg-white/20 text-white"
                      : "bg-black/20 text-white/80",
                  )}
                >
                  {branch.is_active ? "● Active Location" : "Inactive Location"}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                {branch.branch_name}
              </h1>
              <div className="flex items-center text-cyan-50 text-sm">
                <MapPin className="w-4 h-4 mr-1.5 opacity-80" />
                {branch.address_line1}, {branch.city}, {branch.province}
              </div>
            </div>
            <Button
              onClick={() => setIsEditModalOpen(true)}
              className="bg-white text-teal-800 hover:bg-slate-100"
            >
              <Pencil className="w-4 h-4 mr-2" /> Edit Details
            </Button>
          </div>
        </div>
      </Card>

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-black text-slate-900">
            {metrics.doctorCount}
          </div>
          <div className="text-xs uppercase text-slate-500 font-semibold mt-1">
            Doctors
          </div>
        </Card>
        <Card className="border-slate-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-black text-slate-900">
            {metrics.staffCount}
          </div>
          <div className="text-xs uppercase text-slate-500 font-semibold mt-1">
            Staff
          </div>
        </Card>
        <Card className="border-slate-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-black text-teal-700">
            Rs. {metrics.totalRevenue.toLocaleString()}
          </div>
          <div className="text-xs uppercase text-slate-500 font-semibold mt-1">
            Revenue Collected
          </div>
        </Card>
        <Card className="border-slate-200 shadow-sm p-4 text-center">
          <div className="text-2xl font-black text-amber-600">
            {metrics.pendingComplaints}
          </div>
          <div className="text-xs uppercase text-slate-500 font-semibold mt-1">
            Pending Issues
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        {[
          { key: "overview", label: "Overview" },
          { key: "services", label: `Treatments & Visits (${visits.length})` },
          { key: "staff", label: `Staff Directory (${staff.length})` },
          { key: "invoices", label: `Invoices (${invoices.length})` },
          { key: "complaints", label: `Complaints (${complaints.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={cn(
              "pb-3 transition-colors relative",
              activeTab === tab.key
                ? "text-teal-700 border-b-2 border-teal-700 font-bold"
                : "text-slate-500 hover:text-slate-800",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW*/}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-600" /> Branch Manager
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">
                  {branch.manager_name}
                </p>
                <p className="text-xs text-slate-500">
                  {branch.manager_name !== "Unassigned"
                    ? "Assigned Admin"
                    : "No manager"}
                </p>
              </div>
              <div className="flex gap-2">
                {branch.manager_name !== "Unassigned" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveManager}
                    className="text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsManagerModalOpen(true)}
                >
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-600" /> Doctors (
                {metrics.doctorCount})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {staff
                  .filter((s: any) => s.role === "Doctor")
                  .map((doc: any) => (
                    <div
                      key={doc.employeeId}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
                        Dr
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {doc.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {doc.specialization || "General Practitioner"}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TREATMENTS & VISITS */}
      {activeTab === "services" && (
        <div className="space-y-6">
          {/* Treatments Toggles */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base">Treatments Offered</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {treatments.map((t: any) => (
                  <div
                    key={t.treatmentId}
                    className="p-3 border rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {t.treatmentName}
                      </p>
                      <p className="text-xs text-slate-500">
                        Rs. {Number(t.basePrice).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleToggleTreatment(t.treatmentId, t.isOffered)
                      }
                      className={cn(
                        "px-2.5 py-1 text-xs font-bold rounded-full transition-colors",
                        t.isOffered
                          ? "bg-teal-100 text-teal-800"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                      )}
                    >
                      {t.isOffered ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Visits Table */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base">
                Recent Visit & Treatment History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Doctor</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                    <th className="py-3 px-4">Visit Status</th>
                    <th className="py-3 px-4 text-right">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visits.length > 0 ? (
                    visits.map((v: any) => (
                      <tr key={v.appointmentId} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono text-xs">
                          {v.visitDate} {v.startTime}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {v.patientName}
                        </td>
                        <td className="py-3 px-4">{v.doctorName}</td>
                        <td className="py-3 px-4 text-slate-500">
                          {v.reason || "General Consultation"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "text-xs font-bold px-2 py-0.5 rounded-full",
                              v.status === "Completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800",
                            )}
                          >
                            {v.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          {v.paymentStatus ? (
                            <span
                              className={
                                v.paymentStatus === "Paid"
                                  ? "text-emerald-600"
                                  : "text-amber-600"
                              }
                            >
                              {v.paymentStatus} (Rs.{" "}
                              {Number(v.amount).toLocaleString()})
                            </span>
                          ) : (
                            <span className="text-slate-400">No Invoice</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-slate-500"
                      >
                        No visit history recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STAFF DIRECTORY */}
      {activeTab === "staff" && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" /> All Assigned Personnel
            </CardTitle>
            <Button
              onClick={() => setIsAssignStaffModalOpen(true)}
              size="sm"
              className="bg-teal-700 hover:bg-teal-800 text-white"
            >
              Assign Staff
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {staff.map((s: any) => (
                <div
                  key={s.employeeId}
                  className="flex items-center justify-between p-4 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                      {s.role === "Doctor" ? "DR" : "ST"}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{s.name}</p>
                      <p className="text-xs text-slate-500">
                        {s.role}{" "}
                        {s.specialization ? `• ${s.specialization}` : ""}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleRemoveStaff(s.employeeId)}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-red-600"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/*INVOICES*/}
      {activeTab === "invoices" && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 flex justify-between items-center">
            <CardTitle className="text-base">Branch Billing Records</CardTitle>
            <div className="text-xs text-slate-500 font-semibold">
              Outstanding Due:{" "}
              <span className="text-red-600 font-bold">
                Rs. {metrics.totalDue.toLocaleString()}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Billed Amount</th>
                  <th className="py-3 px-4">Paid</th>
                  <th className="py-3 px-4">Due</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length > 0 ? (
                  invoices.map((inv: any) => (
                    <tr key={inv.invoiceId} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-xs">
                        {inv.invoiceDate}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {inv.patientName}
                      </td>
                      <td className="py-3 px-4">
                        Rs. {Number(inv.netAmount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-emerald-600">
                        Rs. {Number(inv.paidAmount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-red-600 font-semibold">
                        Rs. {Number(inv.dueAmount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-bold",
                            inv.status === "Paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800",
                          )}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No invoices for this branch.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/*COMPLAINTS */}
      {activeTab === "complaints" && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base">
              Complaints Filed for this Branch
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {complaints.length > 0 ? (
              complaints.map((c: any) => (
                <div
                  key={c.complaintId}
                  className="p-4 rounded-xl border border-slate-200 bg-white space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-sm">
                      {c.subject}
                    </span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-xs font-bold uppercase",
                        c.priority === "Urgent"
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {c.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{c.message}</p>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs text-slate-400">
                    <span>
                      Filed by {c.patientName} on {c.createdAt}
                    </span>
                    {c.status === "Pending" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolveComplaint(c.complaintId)}
                      >
                        Mark Resolved
                      </Button>
                    ) : (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-500 text-sm">
                No complaints registered for this location.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Branch Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-0">
            <div className="flex justify-between p-6 border-b">
              <h3 className="text-lg font-bold">Edit Branch</h3>
              <button onClick={() => setIsEditModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <CardContent className="p-6">
              <form onSubmit={handleEditBranch} className="space-y-4">
                <input
                  required
                  type="text"
                  value={editForm.branch_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, branch_name: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-lg border text-sm"
                  placeholder="Branch Name"
                />
                <input
                  required
                  type="text"
                  value={editForm.address_line1}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address_line1: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-lg border text-sm"
                  placeholder="Address"
                />
                <input
                  required
                  type="text"
                  value={editForm.city}
                  onChange={(e) =>
                    setEditForm({ ...editForm, city: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-lg border text-sm"
                  placeholder="City"
                />
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isActionLoading}
                    className="bg-teal-700 text-white"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Change Manager Modal */}
      {isManagerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-0">
            <div className="flex justify-between p-6 border-b">
              <h3 className="text-lg font-bold">Assign Manager</h3>
              <button onClick={() => setIsManagerModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <CardContent className="p-6">
              <form onSubmit={handleChangeManager} className="space-y-4">
                <select
                  required
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border text-sm bg-white"
                >
                  <option value="" disabled>
                    Select a Manager...
                  </option>
                  {managerCandidates.map((s: any) => (
                    <option key={s.employeeId} value={s.employeeId}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsManagerModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isActionLoading || !selectedManagerId}
                    className="bg-teal-700 text-white"
                  >
                    Assign Manager
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assign Staff Modal */}
      {isAssignStaffModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-0">
            <div className="flex justify-between p-6 border-b">
              <h3 className="text-lg font-bold">Assign Staff Member</h3>
              <button onClick={() => setIsAssignStaffModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <CardContent className="p-6">
              <form onSubmit={handleAssignStaff} className="space-y-4">
                <input
                  type="text"
                  placeholder="Search unassigned staff..."
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border text-sm"
                />
                <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1 bg-slate-50">
                  {filteredAvailableStaff?.map((s: any) => (
                    <div
                      key={s.employeeId}
                      onClick={() => setNewStaffId(s.employeeId)}
                      className={cn(
                        "p-2 rounded cursor-pointer border text-xs flex justify-between",
                        newStaffId === s.employeeId
                          ? "bg-teal-100 border-teal-300"
                          : "bg-white hover:bg-slate-100",
                      )}
                    >
                      <span>
                        {s.name} ({s.role})
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAssignStaffModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isActionLoading || !newStaffId}
                    className="bg-teal-700 text-white"
                  >
                    Assign Staff
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
