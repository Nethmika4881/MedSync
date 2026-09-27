"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { branches } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";

const ROLES = ["Administrator", "Doctor", "Receptionist"];
const DEPARTMENTS = ["Front Desk", "Clinical", "Pharmacy", "Laboratory", "Management", "Administration"];

export default function NewStaffPage() {
  const router = useRouter();
  
  const [submitted, setSubmitted] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "", lastName: "", role: "Receptionist", department: "Front Desk",
    branchId: "BR-001", email: "", phone: ""
  });

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.phone || !form.email) {
      setError("Please fill in all required fields."); 
      return;
    }
    setError("");
    
    const fullName = `${form.firstName} ${form.lastName}`;
    
    // In a real app we'd dispatch a Server Action here.
    // For now we just show the success state.
    
    setNewStaffName(fullName);
    setSubmitted(true);
  };

  if (submitted) {
    const colorClass = getAvatarColor(newStaffName);
    return (
      <div className="max-w-xl mx-auto text-center py-20 animate-fade-in">
        <div className={cn("w-20 h-20 flex items-center justify-center mx-auto mb-6 text-2xl font-black rounded-2xl", colorClass)}>
          {getInitials(newStaffName)}
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-semibold mb-4 border border-green-200">
          <CheckCircle2 className="w-4 h-4" /> Employee Provisioned
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">{newStaffName}</h2>
        <p className="text-slate-500 mb-8">Successfully added to the clinic staff directory.</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => { 
            setSubmitted(false); 
            setForm({ firstName: "", lastName: "", role: "Receptionist", department: "Front Desk", branchId: "BR-001", email: "", phone: "" }); 
          }}
            variant="outline" className="rounded-xl px-6 h-11">Add Another</Button>
          <Link href="/admin/staff">
            <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl px-6 h-11">View Directory</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/staff">
          <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Provision New Staff</h2>
          <p className="text-slate-500 text-sm">Add a new employee and configure their role.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal & Role Info */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold rounded-lg">1</div>
              Employment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[["First Name *", "firstName", "text", "e.g. Jane"], ["Last Name *", "lastName", "text", "e.g. Doe"]].map(([label, field, type, ph]) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
                  <input type={type} value={(form as any)[field]} onChange={e => set(field, e.target.value)} placeholder={ph}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none" required />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">System Role</label>
                <select value={form.role} onChange={e => set("role", e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] outline-none">
                  {ROLES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Department</label>
                <select value={form.department} onChange={e => set("department", e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] outline-none">
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Primary Branch Allocation</label>
                <select value={form.branchId} onChange={e => set("branchId", e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] outline-none">
                  {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.name}</option>)}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-7 h-7 bg-teal-100 text-teal-600 flex items-center justify-center text-sm font-bold rounded-lg">2</div>
              Contact Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[["Phone *", "phone", "tel", "+1 (555) ..."], ["Email *", "email", "email", "employee@clinic.com"]].map(([label, field, type, ph]) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
                  <input type={type} value={(form as any)[field]} onChange={e => set(field, e.target.value)} placeholder={ph}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none" required />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl h-11 px-8 font-semibold">
            <UserPlus className="w-4 h-4 mr-2" /> Provision Employee
          </Button>
          <Link href="/admin/staff">
            <Button type="button" variant="outline" className="rounded-xl h-11 px-6 text-slate-600">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
