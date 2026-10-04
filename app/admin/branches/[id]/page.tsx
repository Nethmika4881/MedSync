"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Users, Stethoscope, Shield, UserPlus, Pencil, Loader2, X, Search } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function BranchDetailPage({ params }: { params: { id: string } }) {
  const [branch, setBranch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [isAssignStaffModalOpen, setIsAssignStaffModalOpen] = useState(false);
  
  // Form States
  const [editForm, setEditForm] = useState({ branch_name: "", address_line1: "", city: "", province: "" });
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [newStaffId, setNewStaffId] = useState("");
  const [staffSearchQuery, setStaffSearchQuery] = useState("");

  const fetchBranchDetails = async () => {
    try {
      const unwrappedParams = await params;
      const response = await fetch(`/api/branches/${unwrappedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        setBranch(data);
        setEditForm({
          branch_name: data.branch_name,
          address_line1: data.address_line1,
          city: data.city,
          province: data.province || ""
        });
      }
    } catch (error) {
      console.error("Failed to load branch details", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranchDetails();
  }, [params]);

  // --- ACTION HANDLERS ---
  const handleEditBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const unwrappedParams = await params;
      const res = await fetch(`/api/branches/${unwrappedParams.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "edit_branch", ...editForm }),
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        fetchBranchDetails();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleChangeManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const unwrappedParams = await params;
      const res = await fetch(`/api/branches/${unwrappedParams.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_manager", manager_id: selectedManagerId }),
      });
      if (res.ok) {
        setIsManagerModalOpen(false);
        fetchBranchDetails();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveManager = async () => {
    if (!confirm("Are you sure you want to remove the current branch manager?")) return;
    setIsActionLoading(true);
    try {
      const unwrappedParams = await params;
      const res = await fetch(`/api/branches/${unwrappedParams.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove_manager" }),
      });
      if (res.ok) fetchBranchDetails();
    } catch (error) {
      console.error(error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveStaff = async (employeeId: string) => {
    if (!confirm("Are you sure you want to remove this staff member from the branch?")) return;
    try {
      const unwrappedParams = await params;
      const res = await fetch(`/api/branches/${unwrappedParams.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove_staff", employee_id: employeeId }),
      });
      if (res.ok) fetchBranchDetails();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAssignStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const unwrappedParams = await params;
      const res = await fetch(`/api/branches/${unwrappedParams.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign_staff", employee_id: newStaffId }),
      });
      if (res.ok) {
        setIsAssignStaffModalOpen(false);
        setNewStaffId("");
        setStaffSearchQuery("");
        fetchBranchDetails();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
      </div>
    );
  }

  if (!branch) return <div className="text-center py-12 text-slate-900 font-bold">Branch not found</div>;

  const adminStaff = branch.staff.filter((s: any) => s.role === 'Admin');
  
  // Filter available staff based on search query
  const filteredAvailableStaff = branch.available_staff?.filter((s: any) => 
    s.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) || 
    s.employeeId.toLowerCase().includes(staffSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/admin/branches" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to all branches
      </Link>

      {/* Header Banner */}
      <Card className="border-0 shadow-sm overflow-hidden bg-gradient-to-r from-cyan-600 to-teal-700">
        <div className="p-8 relative">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", branch.is_active ? "bg-white/20 text-white" : "bg-black/20 text-white/80")}>
                  {branch.is_active ? "● Active Location" : "Inactive Location"}
                </span>
                <span className="text-sm text-cyan-100 font-medium">ID: {branch.branch_id.split('-')[0]}</span>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{branch.branch_name}</h1>
              <div className="flex items-center text-cyan-50 text-sm">
                <MapPin className="w-4 h-4 mr-1.5 opacity-80" />
                {branch.address_line1}, {branch.city}, {branch.province}
              </div>
            </div>
            <Button onClick={() => setIsEditModalOpen(true)} className="bg-white text-teal-700 hover:bg-slate-50">
              <Pencil className="w-4 h-4 mr-2" /> Edit Details
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          {/* Manager Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                <Shield className="w-5 h-5 text-teal-600" /> Branch Manager
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                    {branch.manager_name !== "Unassigned" ? branch.manager_name.charAt(0) : "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{branch.manager_name}</p>
                    <p className="text-xs text-slate-500">{branch.manager_name !== "Unassigned" ? "Assigned Admin" : "No manager assigned"}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {branch.manager_name !== "Unassigned" && (
                    <Button variant="ghost" size="sm" onClick={handleRemoveManager} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      Remove
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setIsManagerModalOpen(true)}>Change</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-0">
              <div className="grid grid-cols-2 divide-x divide-slate-100">
                <div className="p-4 text-center">
                  <p className="text-2xl font-black text-slate-900">{branch.doctor_count}</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Doctors</p>
                </div>
                <div className="p-4 text-center">
                  <p className="text-2xl font-black text-slate-900">{branch.patient_count}</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Patients</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staff Directory */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200 shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                <Users className="w-5 h-5 text-teal-600" /> Staff Directory
              </CardTitle>
              <Button onClick={() => setIsAssignStaffModalOpen(true)} size="sm" className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white">
                <UserPlus className="w-4 h-4 mr-2" /> Assign Staff
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {branch.staff.length > 0 ? branch.staff.map((employee: any) => (
                  <div key={employee.employeeId} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                        {employee.role === 'Doctor' ? <Stethoscope className="w-4 h-4 text-slate-600" /> : <Users className="w-4 h-4 text-slate-600" />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{employee.name}</p>
                        <p className="text-xs text-slate-500">{employee.role}</p>
                      </div>
                    </div>
                    <Button onClick={() => handleRemoveStaff(employee.employeeId)} variant="ghost" size="sm" className="text-slate-400 hover:text-red-600">Remove</Button>
                  </div>
                )) : (
                  <div className="p-6 text-center text-slate-500 text-sm">No staff assigned to this branch yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-0">
            <div className="flex justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold">Edit Branch</h3>
              <button onClick={() => setIsEditModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <CardContent className="p-6">
              <form onSubmit={handleEditBranch} className="space-y-4">
                <input required type="text" value={editForm.branch_name} onChange={(e) => setEditForm({...editForm, branch_name: e.target.value})} className="w-full h-10 px-3 rounded-lg border text-sm" placeholder="Branch Name" />
                <input required type="text" value={editForm.address_line1} onChange={(e) => setEditForm({...editForm, address_line1: e.target.value})} className="w-full h-10 px-3 rounded-lg border text-sm" placeholder="Address" />
                <input required type="text" value={editForm.city} onChange={(e) => setEditForm({...editForm, city: e.target.value})} className="w-full h-10 px-3 rounded-lg border text-sm" placeholder="City" />
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isActionLoading} className="bg-teal-600 text-white">{isActionLoading ? "Saving..." : "Save Changes"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CHANGE MANAGER MODAL */}
      {isManagerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-0">
            <div className="flex justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold">Assign Manager</h3>
              <button onClick={() => setIsManagerModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <CardContent className="p-6">
              <form onSubmit={handleChangeManager} className="space-y-4">
                <select 
                  required
                  value={selectedManagerId} 
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border text-sm bg-white"
                >
                  <option value="" disabled>Select an Admin...</option>
                  {adminStaff.map((s: any) => (
                    <option key={s.employeeId} value={s.employeeId}>{s.name}</option>
                  ))}
                </select>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsManagerModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isActionLoading || !selectedManagerId} className="bg-teal-600 text-white">{isActionLoading ? "Saving..." : "Assign Manager"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ASSIGN STAFF MODAL (WITH SEARCH & LIST) */}
      {isAssignStaffModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-0">
            <div className="flex justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold">Assign Staff Member</h3>
              <button onClick={() => { setIsAssignStaffModalOpen(false); setStaffSearchQuery(""); setNewStaffId(""); }}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <CardContent className="p-6">
              <form onSubmit={handleAssignStaff} className="space-y-4">
                <p className="text-sm text-slate-500 mb-2">Select employees</p>
                
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search by name or ID..." 
                    value={staffSearchQuery}
                    onChange={(e) => setStaffSearchQuery(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                  />
                </div>

                {/* Scrollable Selectable List */}
                <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-lg p-1.5 space-y-1 bg-slate-50">
                  {filteredAvailableStaff && filteredAvailableStaff.length > 0 ? (
                    filteredAvailableStaff.map((s: any) => (
                      <div 
                        key={s.employeeId} 
                        onClick={() => setNewStaffId(s.employeeId)}
                        className={cn(
                          "p-2.5 rounded-md cursor-pointer transition-colors border", 
                          newStaffId === s.employeeId 
                            ? "bg-teal-50 border-teal-200 shadow-sm" 
                            : "bg-white border-transparent hover:border-slate-200"
                        )}
                      >
                        <p className="font-semibold text-sm text-slate-900">{s.name} <span className="text-xs font-normal text-slate-500 ml-1">({s.role})</span></p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{s.employeeId}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-sm text-slate-500">
                      {branch.available_staff?.length === 0 
                        ? "No unassigned staff available in the system." 
                        : "No matching staff found."}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button type="button" variant="outline" onClick={() => { setIsAssignStaffModalOpen(false); setStaffSearchQuery(""); setNewStaffId(""); }}>Cancel</Button>
                  <Button type="submit" disabled={isActionLoading || !newStaffId} className="bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-secondary)]">
                    {isActionLoading ? "Saving..." : "Assign Staff"}
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