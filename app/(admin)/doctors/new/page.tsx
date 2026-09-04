"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDoctorStore } from "@/lib/stores/doctorStore";
import { branches } from "@/lib/mockData/branches";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";

const SPECIALIZATIONS = [
  "Cardiology", "Dermatology", "General Practice", "Gynecology",
  "Neurology", "Orthopedics", "Pediatrics", "Psychology"
];

export default function NewDoctorPage() {
  const router = useRouter();
  const { addDoctor } = useDoctorStore();
  
  const [submitted, setSubmitted] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "", lastName: "", specialization: "General Practice",
    branchId: "BR-001", email: "", phone: "",
    consultationFee: "100", experience: "5",
    education: "", bio: ""
  });

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.phone || !form.education) {
      setError("Please fill in all required fields."); 
      return;
    }
    setError("");
    
    const fullName = `${form.firstName} ${form.lastName}`;
    const branchName = branches.find(b => b.branchId === form.branchId)?.name || "Main Clinic";
    
    addDoctor({
      name: fullName,
      specialization: form.specialization,
      branchId: form.branchId,
      branchName: branchName,
      email: form.email,
      phone: form.phone,
      rating: 5.0,
      reviewCount: 0,
      consultationFee: parseInt(form.consultationFee, 10) || 100,
      experience: parseInt(form.experience, 10) || 0,
      avatar: `${form.firstName[0]}${form.lastName[0]}`,
      bio: form.bio,
      education: form.education,
      isAvailable: true,
    });
    
    setNewDoctorName(fullName);
    setSubmitted(true);
  };

  if (submitted) {
    const colorClass = getAvatarColor(newDoctorName);
    return (
      <div className="max-w-xl mx-auto text-center py-20 animate-fade-in">
        <div className={cn("w-20 h-20 flex items-center justify-center mx-auto mb-6 text-2xl font-black rounded-2xl", colorClass)}>
          {getInitials(newDoctorName)}
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-semibold mb-4 border border-green-200">
          <CheckCircle2 className="w-4 h-4" /> Doctor Registered
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Dr. {newDoctorName}</h2>
        <p className="text-slate-500 mb-8">Successfully added to the clinic directory.</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => { 
            setSubmitted(false); 
            setForm({ firstName: "", lastName: "", specialization: "General Practice", branchId: "BR-001", email: "", phone: "", consultationFee: "100", experience: "5", education: "", bio: "" }); 
          }}
            variant="outline" className="rounded-xl px-6 h-11">Register Another</Button>
          <Link href="/doctors">
            <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl px-6 h-11">View Directory</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/doctors">
          <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Register New Doctor</h2>
          <p className="text-slate-500 text-sm">Add a new specialist to the clinic roster.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Professional Info */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold rounded-lg">1</div>
              Professional Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[["First Name *", "firstName", "text", "e.g. Sarah"], ["Last Name *", "lastName", "text", "e.g. Jenkins"]].map(([label, field, type, ph]) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
                  <input type={type} value={(form as any)[field]} onChange={e => set(field, e.target.value)} placeholder={ph}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none" required />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Specialization</label>
                <select value={form.specialization} onChange={e => set("specialization", e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] outline-none">
                  {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Primary Branch</label>
                <select value={form.branchId} onChange={e => set("branchId", e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] outline-none">
                  {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Education *</label>
                <input type="text" value={form.education} onChange={e => set("education", e.target.value)} placeholder="e.g. MD - Harvard Medical School"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Exp (Years)</label>
                  <input type="number" value={form.experience} onChange={e => set("experience", e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Fee ($)</label>
                  <input type="number" value={form.consultationFee} onChange={e => set("consultationFee", e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] outline-none" />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Brief Biography</label>
              <textarea value={form.bio} onChange={e => set("bio", e.target.value)} placeholder="Short professional background..." rows={3}
                className="w-full p-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] outline-none resize-none" />
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
              {[["Phone *", "phone", "tel", "+1 (555) ..."], ["Email", "email", "email", "dr.name@clinic.com"]].map(([label, field, type, ph]) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
                  <input type={type} value={(form as any)[field]} onChange={e => set(field, e.target.value)} placeholder={ph}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl h-11 px-8 font-semibold">
            <UserPlus className="w-4 h-4 mr-2" /> Register Doctor
          </Button>
          <Link href="/doctors">
            <Button type="button" variant="outline" className="rounded-xl h-11 px-6 text-slate-600">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
