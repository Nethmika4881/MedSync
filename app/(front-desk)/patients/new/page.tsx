"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { usePatientStore } from "@/lib/stores/patientStore";
import { branches } from "@/lib/mockData/branches";
import { patients } from "@/lib/mockData/patients";
import { Patient } from "@/lib/mockData/patients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function NewPatientPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [newPatient, setNewPatient] = useState<Patient | null>(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "", lastName: "", dob: "", gender: "Male" as "Male" | "Female" | "Other",
    bloodGroup: "A+", phone: "", email: "", address: "", city: "",
    branchId: "BR-001",
    emergencyContactName: "", emergencyContactRelation: "", emergencyContactPhone: "",
  });

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.dob || !form.phone) {
      setError("Please fill in all required fields."); return;
    }
    setError("");
    const dob = new Date(form.dob);
    const age = new Date().getFullYear() - dob.getFullYear();
    const patient: Patient = {
      patientId: `PAT-${String(patients.length + 1).padStart(3, "0")}`,
      name: `${form.firstName} ${form.lastName}`,
      firstName: form.firstName,
      lastName: form.lastName,
      dob: form.dob,
      age,
      gender: form.gender,
      bloodGroup: form.bloodGroup,
      phone: form.phone,
      email: form.email,
      address: form.address,
      city: form.city,
      emergencyContactName: form.emergencyContactName,
      emergencyContactRelation: form.emergencyContactRelation,
      emergencyContactPhone: form.emergencyContactPhone,
      avatar: `${form.firstName[0]}${form.lastName[0]}`,
      registeredAt: new Date().toISOString().split("T")[0],
      branchId: form.branchId,
    };
    setNewPatient(patient);
    setSubmitted(true);
  };

  if (submitted && newPatient) {
    const colorClass = getAvatarColor(newPatient.name);
    return (
      <div className="max-w-xl mx-auto text-center py-20 animate-fade-in">
        <div className={cn("w-20 h-20 flex items-center justify-center mx-auto mb-6 text-2xl font-black", colorClass)}
          style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
          {getInitials(newPatient.name)}
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-semibold mb-4 border border-green-200">
          <CheckCircle2 className="w-4 h-4" /> Patient Registered
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">{newPatient.name}</h2>
        <p className="text-slate-500 mb-1">{newPatient.patientId} • {newPatient.age} yrs • {newPatient.gender}</p>
        <p className="text-slate-500 mb-8">Blood Group: <strong>{newPatient.bloodGroup}</strong></p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => { setSubmitted(false); setForm({ firstName: "", lastName: "", dob: "", gender: "Male", bloodGroup: "A+", phone: "", email: "", address: "", city: "", branchId: "BR-001", emergencyContactName: "", emergencyContactRelation: "", emergencyContactPhone: "" }); }}
            variant="outline" className="rounded-xl px-6 h-11">Register Another</Button>
          <Link href="/patients">
            <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl px-6 h-11">View All Patients</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/patients">
          <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Register New Patient</h2>
          <p className="text-slate-500 text-sm">Complete all sections to add the patient to the system.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold"
                style={{ clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" }}>1</div>
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[["First Name *", "firstName", "text", "e.g. Maria"], ["Last Name *", "lastName", "text", "e.g. Santos"]].map(([label, field, type, ph]) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
                  <input type={type} value={(form as any)[field]} onChange={e => set(field, e.target.value)} placeholder={ph}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none" required />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Date of Birth *</label>
                <input type="date" value={form.dob} onChange={e => set("dob", e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Gender</label>
                <select value={form.gender} onChange={e => set("gender", e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] outline-none">
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Blood Group</label>
                <select value={form.bloodGroup} onChange={e => set("bloodGroup", e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] outline-none">
                  {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-7 h-7 bg-teal-100 text-teal-600 flex items-center justify-center text-sm font-bold"
                style={{ clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" }}>2</div>
              Contact Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[["Phone *", "phone", "tel", "+1 (555) ..."], ["Email", "email", "email", "name@example.com"], ["Address", "address", "text", "Street address"], ["City", "city", "text", "City"]].map(([label, field, type, ph]) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
                  <input type={type} value={(form as any)[field]} onChange={e => set(field, e.target.value)} placeholder={ph}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Assigned Branch</label>
                <select value={form.branchId} onChange={e => set("branchId", e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] outline-none">
                  {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.name}</option>)}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-7 h-7 bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold"
                style={{ clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" }}>3</div>
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[["Full Name", "emergencyContactName", "e.g. Jane Santos"], ["Relationship", "emergencyContactRelation", "e.g. Spouse"], ["Phone", "emergencyContactPhone", "+1 (555) ..."]].map(([label, field, ph]) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
                  <input type="text" value={(form as any)[field]} onChange={e => set(field, e.target.value)} placeholder={ph}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl h-11 px-8 font-semibold">
            <UserPlus className="w-4 h-4 mr-2" /> Register Patient
          </Button>
          <Link href="/patients">
            <Button type="button" variant="outline" className="rounded-xl h-11 px-6 text-slate-600">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
