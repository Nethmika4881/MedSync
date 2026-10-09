"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Users, 
  Stethoscope, 
  PlusCircle, 
  AlertCircle, 
  X, 
  Loader2, 
  Trash2, 
  AlertTriangle, 
  MessageSquare, 
  CheckCircle2, 
  TrendingUp 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  createBranch,
  deleteBranch,
  getBranches,
  branchOverview, 
  complaints as resolveComplaint,
  BranchTraffic, 
  warnings as OperationalWarning, 
  PatientComplaint 
} from "@/lib/actions/branches";

interface Branch {
  branch_id: string;
  branch_name: string;
  is_active: boolean;
  address_line1: string;
  city: string;
  province: string;
  doctor_count: number;
  patient_count: number;
  manager_name: string;
  staff: { employeeId: string; name: string; role: string }[];
}

const BRANCH_GRADIENTS = [
  { bg: "from-cyan-500 to-teal-600", shape: "bg-cyan-100 text-cyan-700", light: "bg-cyan-50 border-cyan-200 text-cyan-700" },
  { bg: "from-violet-500 to-purple-600", shape: "bg-violet-100 text-violet-700", light: "bg-violet-50 border-violet-200 text-violet-700" },
  { bg: "from-orange-400 to-rose-500", shape: "bg-orange-100 text-orange-700", light: "bg-orange-50 border-orange-200 text-orange-700" },
];

export default function BranchesPage({ user }: { user: any }) {
  const role = user?.role;

  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ branch_name: "", address_line1: "", city: "", province: "" });

  // Analytics & Alerts States
  const [timeRange, setTimeRange] = useState<"today" | "7d" | "30d">("30d");
  const [trafficData, setTrafficData] = useState<BranchTraffic[]>([]);
  const [warnings, setWarnings] = useState<OperationalWarning[]>([]);
  const [complaints, setComplaints] = useState<PatientComplaint[]>([]);
  const [activeAlertTab, setActiveAlertTab] = useState<"warnings" | "complaints">("warnings");

  const fetchBranches = async () => {
    try {
      setBranches(await getBranches());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async (range: "today" | "7d" | "30d") => {
    try {
      const res = await branchOverview(range);
      if (!res.success) throw new Error(res.error || "Failed to load branch analytics");

      setTrafficData(res.traffic || []);
      setWarnings(res.operationalWarnings || []);
      setComplaints(res.complaints || []);
    } catch (err: any) {
      setError(err.message || "Failed to load branch analytics");
    }
  };

  useEffect(() => {
    fetchBranches();
    loadAnalytics(timeRange);
  }, []);

  const handleRangeChange = (range: "today" | "7d" | "30d") => {
    setTimeRange(range);
    loadAnalytics(range);
  };

  const handleResolveComplaint = async (id: string) => {
    const res = await resolveComplaint(id);
    if (res.success) {
      setComplaints((prev) => prev.filter((c) => c.complaintId !== id));
    } else {
      setError("error" in res ? res.error : "Failed to resolve complaint");
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createBranch(formData);
      if (!result.success) throw new Error(result.error || "Failed to create branch");
      setIsModalOpen(false);
      setFormData({ branch_name: "", address_line1: "", city: "", province: "" });
      await fetchBranches();
      await loadAnalytics(timeRange);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBranch = async (e: React.MouseEvent, branchId: string, branchName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Are you sure you want to permanently delete ${branchName}?`)) return;

    try {
      const result = await deleteBranch(branchId);
      if (!result.success) throw new Error(result.error || "Failed to delete branch");
      await fetchBranches();
      await loadAnalytics(timeRange);
    } catch (err: any) {
      alert(`Error deleting branch: ${err.message}`);
    }
  };

  if (!role) return null;

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Branches</h2>
          <p className="text-slate-500">branches Overview</p>
        </div>
        {role === "admin" && (
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl h-10 px-5"
          >
            <PlusCircle className="w-4 h-4 mr-2" /> New Branch
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700 gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {/* Top Total Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm text-center p-5">
          <div className="text-3xl font-black text-slate-900 mb-1">{isLoading ? "-" : branches.length}</div>
          <div className="text-sm text-slate-500 font-medium">Total Branches</div>
        </Card>
        <Card className="border-slate-200 shadow-sm text-center p-5">
          <div className="text-3xl font-black text-[var(--brand-primary)] mb-1">
            {isLoading ? "-" : branches.reduce((acc, b) => acc + b.doctor_count, 0)}
          </div>
          <div className="text-sm text-slate-500 font-medium">Total Doctors</div>
        </Card>
        <Card className="border-slate-200 shadow-sm text-center p-5">
          <div className="text-3xl font-black text-slate-900 mb-1">
            {isLoading ? "-" : branches.reduce((acc, b) => acc + b.patient_count, 0)}
          </div>
          <div className="text-sm text-slate-500 font-medium">Active Patients</div>
        </Card>
      </div>

      {/* ─── NEW: Traffic Comparison & Alerts Center ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Patient Traffic Bar Chart (Tailwind Native) */}
        <Card className="lg:col-span-7 min-h-[280px] border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600" /> Patient Traffic by Branch
                </h3>
                {/* <p className="text-xs text-slate-500">Completed visits across locations</p> */}
              </div>

              {/* Time Range Pills */}
              <div className="flex bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
                <button
                  onClick={() => handleRangeChange("today")}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-md transition-all",
                    timeRange === "today" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Today
                </button>
                <button
                  onClick={() => handleRangeChange("7d")}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-md transition-all",
                    timeRange === "7d" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  7 Days
                </button>
                <button
                  onClick={() => handleRangeChange("30d")}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-md transition-all",
                    timeRange === "30d" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  30 Days
                </button>
              </div>
            </div>

            {/* Horizontal Bar Chart */}
            <div className="space-y-4">
              {trafficData.length > 0 ? (
                trafficData.map((item) => (
                  <div key={item.branchId} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{item.branchName}</span>
                      <span className="text-slate-900 font-bold">{item.patientCount} visits</span>
                    </div>
                    {/* The Bar Track */}
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(item.percentage, 4)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-sm text-slate-400">No traffic recorded for this range.</div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-6 text-xs text-slate-400">
            Ranked by total completed appointments.
          </div>
        </Card>

        {/* Right: Branch Alerts & Patient Feedback Feed */}
        <Card className="lg:col-span-5 min-h-[440px] border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveAlertTab("warnings")}
                className={cn(
                  "text-xs font-bold pb-2 relative transition-colors",
                  activeAlertTab === "warnings"
                    ? "text-slate-900 border-b-2 border-slate-900"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                Operational ({warnings.length})
              </button>
              <button
                onClick={() => setActiveAlertTab("complaints")}
                className={cn(
                  "text-xs font-bold pb-2 relative transition-colors",
                  activeAlertTab === "complaints"
                    ? "text-slate-900 border-b-2 border-slate-900"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                Patient Complaints ({complaints.length})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="overflow-y-auto max-h-80 space-y-3 pr-1 flex-1">
            {activeAlertTab === "warnings" ? (
              warnings.length > 0 ? (
                warnings.map((w) => (
                  <div key={w.id} className="p-3 rounded-lg border border-amber-200 bg-amber-50/60 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <Link href={`/admin/branches/${w.branchId}`} className="font-bold text-amber-900 hover:underline">
                        {w.branchName}
                      </Link>
                      <p className="text-amber-800 mt-0.5">{w.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  All branches operational without warnings.
                </div>
              )
            ) : (
              complaints.length > 0 ? (
                complaints.map((c) => (
                  <div key={c.complaintId} className="p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-all text-xs space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{c.branchName}</span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                        c.priority === "Urgent" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                      )}>
                        {c.priority}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800">{c.subject}</p>
                    <p className="text-slate-500 text-[11px] line-clamp-2">{c.message}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>{c.patientName} • {c.createdAt}</span>
                      <button
                        onClick={() => handleResolveComplaint(c.complaintId)}
                        className="text-teal-600 hover:text-teal-700 font-semibold"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-slate-300" />
                  No pending complaints.
                </div>
              )
            )}
          </div>
        </Card>
      </div>

      {/* ─── Branch Cards Grid ────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((skeleton) => (
            <Card key={skeleton} className="h-96 border-slate-200 shadow-sm bg-slate-50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {branches.map((branch, i) => {
            const theme = BRANCH_GRADIENTS[i % BRANCH_GRADIENTS.length];
            const activeStaff = branch.staff || [];

            return (
              <Link key={branch.branch_id} href={`/admin/branches/${branch.branch_id}`} className="block relative group">
                {/* Delete button */}
                <button 
                  onClick={(e) => handleDeleteBranch(e, branch.branch_id, branch.branch_name)}
                  className="absolute top-4 right-4 z-20 p-2 bg-black/10 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                  title="Delete Branch"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <Card className="border-slate-200 shadow-sm hover:shadow-xl transition-all overflow-hidden bg-white h-full cursor-pointer">
                  {/* Banner header without raw UUID */}
                  <div className={cn("relative h-36 bg-gradient-to-br p-6 overflow-hidden", theme.bg)}>
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", branch.is_active ? "bg-white/20 text-white" : "bg-black/20 text-white/80")}>
                          {branch.is_active ? "● Active" : "Inactive"}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white leading-tight mt-1 pr-10">{branch.branch_name}</h3>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="space-y-2.5 mb-5">
                      <div className="flex items-start gap-2.5 text-sm text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span>{branch.address_line1}, {branch.city}, {branch.province}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                        <div className="flex items-center justify-center gap-1 text-[var(--brand-primary)] mb-1">
                          <Stethoscope className="w-4 h-4" />
                        </div>
                        <p className="text-xl font-black text-slate-900">{branch.doctor_count}</p>
                        <p className="text-xs text-slate-500">Doctors</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                        <div className="flex items-center justify-center gap-1 text-[var(--brand-primary)] mb-1">
                          <Users className="w-4 h-4" />
                        </div>
                        <p className="text-xl font-black text-slate-900">{branch.patient_count}</p>
                        <p className="text-xs text-slate-500">Patients</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Branch Manager</p>
                      <div className="flex items-center gap-3">
                        <div
                          className={cn("w-9 h-9 flex items-center justify-center text-sm font-bold shrink-0", theme.shape)}
                          style={{ clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)" }}
                        >
                          {branch.manager_name !== "Unassigned" ? branch.manager_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('') : "U"}
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{branch.manager_name}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Modal for Creating New Branch */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-0">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Create New Branch</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <CardContent className="p-6">
              <form onSubmit={handleCreateBranch} className="space-y-4">
                <input
                  required
                  type="text"
                  placeholder="Branch Name *"
                  value={formData.branch_name}
                  onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border text-sm"
                />
                <input
                  required
                  type="text"
                  placeholder="Address Line 1 *"
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border text-sm"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    required
                    type="text"
                    placeholder="City *"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Province"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border text-sm"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-[var(--brand-primary)] text-white">
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Create Branch
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