"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Stethoscope, PlusCircle, AlertCircle, X, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    branch_name: "",
    address_line1: "",
    city: "",
    province: "",
  });

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches');
      if (!response.ok) throw new Error("Failed to load branches");
      const data = await response.json();
      setBranches(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to create branch");
      }

      setIsModalOpen(false);
      setFormData({ branch_name: "", address_line1: "", city: "", province: "" });
      await fetchBranches();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // NEW: Delete Handler
  const handleDeleteBranch = async (e: React.MouseEvent, branchId: string, branchName: string) => {
    e.preventDefault(); // Prevents the <Link> from triggering navigation
    e.stopPropagation();

    if (!confirm(`Are you sure you want to permanently delete ${branchName}? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/branches/${branchId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.details || "Failed to delete branch");
      }

      // Refresh the list after successful deletion
      await fetchBranches();
    } catch (err: any) {
      alert(`Error deleting branch: ${err.message}`);
    }
  };

  if (!role) return null;

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Branches</h2>
          <p className="text-slate-500">Manage all MedSync clinic branches and locations.</p>
        </div>
        {role === "admin" && (
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-xl h-10 px-5 transition-colors"
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

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm text-center p-5">
          <div className="text-3xl font-black text-slate-900 mb-1">
            {isLoading ? "-" : branches.length}
          </div>
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
            const activeStaff = branch.staff;

            return (
              <Link key={branch.branch_id} href={`/admin/branches/${branch.branch_id}`} className="block relative group">
                {/* NEW: Absolute positioned delete button */}
                <button 
                  onClick={(e) => handleDeleteBranch(e, branch.branch_id, branch.branch_name)}
                  className="absolute top-4 right-4 z-20 p-2 bg-black/10 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                  title="Delete Branch"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <Card className="border-slate-200 shadow-sm hover:shadow-xl transition-all overflow-hidden bg-white h-full cursor-pointer">
                  <div className={cn("relative h-36 bg-gradient-to-br p-6 overflow-hidden", theme.bg)}>
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} />
                    <div className="absolute right-12 bottom-0 w-16 h-16 bg-white/10" style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" }} />
                    
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", branch.is_active ? "bg-white/20 text-white" : "bg-black/20 text-white/80")}>
                          {branch.is_active ? "● Active" : "Inactive"}
                        </span>
                        <span className="text-xs text-white/70 truncate w-32" title={branch.branch_id}>
                          {branch.branch_id.split('-')[0]}...
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
                          {branch.manager_name !== "Unassigned" ? branch.manager_name.split(' ').map((n: string) => n[0]).slice(0,2).join('') : "U"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{branch.manager_name}</p>
                        </div>
                      </div>
                    </div>

                    {activeStaff.length > 0 && (
                      <div className="pt-4 border-t border-slate-100 mt-4">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                          Active Staff ({activeStaff.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {activeStaff.slice(0, 5).map((s) => (
                            <span key={s.employeeId} className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border", theme.light)}>
                              {s.name.split(' ')[0]}
                            </span>
                          ))}
                          {activeStaff.length > 5 && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                              +{activeStaff.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-0 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Create New Branch</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <CardContent className="p-6">
              <form onSubmit={handleCreateBranch} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Branch Name *</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Kandy South Clinic"
                    value={formData.branch_name}
                    onChange={(e) => setFormData({...formData, branch_name: e.target.value})}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Address Line 1 *</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. 456 Mountain View Rd"
                    value={formData.address_line1}
                    onChange={(e) => setFormData({...formData, address_line1: e.target.value})}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">City *</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Kandy"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Province</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Central Province"
                      value={formData.province}
                      onChange={(e) => setFormData({...formData, province: e.target.value})}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white rounded-lg"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {isSubmitting ? "Saving..." : "Create Branch"}
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