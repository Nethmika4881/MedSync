"use client";

import React, { useState } from "react";
import { z } from "zod";
import { toast, Toaster } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, ArrowLeft, CheckCircle2, Loader2, KeyRound, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";
import { registerBranchPatient } from "@/lib/actions/frontdesk-registration";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

// Zod validation schema for patient registration
const patientRegistrationSchema = z.object({
  firstName: z.string().trim().min(2, "First name must be at least 2 characters."),
  lastName: z.string().trim().min(2, "Last name must be at least 2 characters."),
  nic: z
    .string()
    .trim()
    .min(9, "National ID must be at least 9 characters.")
    .regex(/^[0-9]{9}[vVxX]?$|^[0-9]{12}$/, "Enter a valid Sri Lankan NIC (e.g. 951234567V or 199512345678)."),
  dob: z.string().refine((val) => {
    if (!val) return false;
    const date = new Date(val);
    return !isNaN(date.getTime()) && date <= new Date();
  }, "Date of birth cannot be empty or in the future."),
  gender: z.enum(["Male", "Female", "Other"]),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
  phone: z
    .string()
    .trim()
    .min(9, "Phone number must be at least 9 digits.")
    .regex(/^[+0-9\s-]{9,15}$/, "Enter a valid phone number (e.g. +94 77 123 4567)."),
  email: z
    .string()
    .trim()
    .refine((val) => val === "" || z.string().email().safeParse(val).success, {
      message: "Please enter a valid email address.",
    }),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  emergencyContactName: z.string().trim().optional(),
  emergencyContactRelation: z.string().trim().optional(),
  emergencyContactPhone: z
    .string()
    .trim()
    .refine((val) => val === "" || /^[+0-9\s-]{9,15}$/.test(val), {
      message: "Please enter a valid emergency contact phone.",
    })
    .optional(),
});

interface RegisteredResult {
  patientId: string;
  name: string;
  nic: string;
  temporaryPassword?: string;
  bloodGroup: string;
  gender: string;
}

export default function NewPatientPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [registeredResult, setRegisteredResult] = useState<RegisteredResult | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    nic: "",
    dob: "",
    gender: "Male" as "Male" | "Female" | "Other",
    bloodGroup: "A+",
    phone: "",
    email: "",
    address: "",
    city: "",
    emergencyContactName: "",
    emergencyContactRelation: "",
    emergencyContactPhone: "",
  });

  const set = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    // 1. Zod Validation
    const validation = patientRegistrationSchema.safeParse(form);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (!errors[path]) {
          errors[path] = issue.message;
        }
      });
      setFieldErrors(errors);
      toast.error("Please correct the form fields highlighted in red.");
      return;
    }

    setIsPending(true);

    try {
      // 2. Server Action Mutation
      const res = await registerBranchPatient({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        nic: form.nic.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        dob: form.dob,
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        addressLine1: form.address.trim(),
        city: form.city.trim(),
        emergencyContactName: form.emergencyContactName.trim(),
        emergencyContactRelation: form.emergencyContactRelation.trim(),
        emergencyContactPhone: form.emergencyContactPhone.trim(),
      });

      if (res.success && res.patientId) {
        toast.success(`Patient ${form.firstName} ${form.lastName} registered successfully!`);
        setRegisteredResult({
          patientId: res.patientId,
          name: `${form.firstName} ${form.lastName}`.trim(),
          nic: form.nic.trim(),
          temporaryPassword: res.temporaryPassword,
          bloodGroup: form.bloodGroup,
          gender: form.gender,
        });
        setSubmitted(true);
      } else {
        const errMsg = res.error || "Failed to register patient in database.";
        setError(errMsg);
        toast.error(errMsg);
      }
    } catch (err: any) {
      const errMsg = err?.message || "An unexpected error occurred while registering patient.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsPending(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setRegisteredResult(null);
    setError("");
    setFieldErrors({});
    setForm({
      firstName: "",
      lastName: "",
      nic: "",
      dob: "",
      gender: "Male",
      bloodGroup: "A+",
      phone: "",
      email: "",
      address: "",
      city: "",
      emergencyContactName: "",
      emergencyContactRelation: "",
      emergencyContactPhone: "",
    });
  };

  if (submitted && registeredResult) {
    const colorClass = getAvatarColor(registeredResult.name);
    return (
      <div className="max-w-xl mx-auto text-center py-16 animate-fade-in">
        <Toaster richColors position="top-right" />
        <div
          className={cn("w-20 h-20 flex items-center justify-center mx-auto mb-6 text-2xl font-black shadow-md", colorClass)}
          style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
        >
          {getInitials(registeredResult.name)}
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold mb-4 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Patient Successfully Registered
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">{registeredResult.name}</h2>
        <p className="text-slate-500 mb-1 font-mono text-xs">
          ID: {registeredResult.patientId} • NIC: {registeredResult.nic}
        </p>
        <p className="text-slate-500 mb-6 text-sm">
          Gender: <strong>{registeredResult.gender}</strong> • Blood Group: <strong>{registeredResult.bloodGroup}</strong>
        </p>

        {registeredResult.temporaryPassword && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 text-left max-w-md mx-auto">
            <div className="flex items-center gap-2 text-amber-800 text-xs font-bold mb-1">
              <KeyRound className="w-4 h-4 text-amber-600" />
              Patient Portal Access
            </div>
            <p className="text-xs text-amber-700 mb-2">
              Provide this temporary password to the patient to log into their portal:
            </p>
            <div className="bg-white border border-amber-200 rounded-xl px-3 py-2 font-mono text-sm font-semibold text-amber-950 select-all">
              {registeredResult.temporaryPassword}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button onClick={resetForm} variant="outline" className="rounded-xl px-6 h-11 border-slate-200">
            Register Another
          </Button>
          <Link href="/front-desk/patients">
            <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl px-6 h-11 shadow-sm font-medium">
              View All Patients
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-12">
      <Toaster richColors position="top-right" />
      <div className="flex items-center gap-3 mb-6">
        <Link href="/front-desk/patients">
          <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Register New Patient</h2>
          <p className="text-slate-500 text-sm">Create clinical patient profile and login credentials.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <div
                className="w-7 h-7 bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold"
                style={{ clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" }}
              >
                1
              </div>
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  First Name *
                </label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  placeholder="e.g. Maria"
                  className={cn(
                    "w-full h-11 px-4 rounded-xl border text-sm bg-white outline-none transition-all",
                    fieldErrors.firstName
                      ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : "border-slate-200 focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]"
                  )}
                />
                {fieldErrors.firstName && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  placeholder="e.g. Santos"
                  className={cn(
                    "w-full h-11 px-4 rounded-xl border text-sm bg-white outline-none transition-all",
                    fieldErrors.lastName
                      ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : "border-slate-200 focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]"
                  )}
                />
                {fieldErrors.lastName && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.lastName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  National ID (NIC) *
                </label>
                <input
                  type="text"
                  value={form.nic}
                  onChange={(e) => set("nic", e.target.value)}
                  placeholder="e.g. 199512345678 or 951234567V"
                  className={cn(
                    "w-full h-11 px-4 rounded-xl border text-sm bg-white outline-none transition-all",
                    fieldErrors.nic
                      ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : "border-slate-200 focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]"
                  )}
                />
                {fieldErrors.nic && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.nic}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => set("dob", e.target.value)}
                  className={cn(
                    "w-full h-11 px-4 rounded-xl border text-sm bg-white outline-none transition-all",
                    fieldErrors.dob
                      ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : "border-slate-200 focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]"
                  )}
                />
                {fieldErrors.dob && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.dob}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Gender
                </label>
                <select
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] outline-none"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Blood Group
                </label>
                <select
                  value={form.bloodGroup}
                  onChange={(e) => set("bloodGroup", e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] outline-none"
                >
                  {BLOOD_GROUPS.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <div
                className="w-7 h-7 bg-teal-100 text-teal-600 flex items-center justify-center text-sm font-bold"
                style={{ clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" }}
              >
                2
              </div>
              Contact Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="e.g. +94 77 123 4567"
                  className={cn(
                    "w-full h-11 px-4 rounded-xl border text-sm bg-white outline-none transition-all",
                    fieldErrors.phone
                      ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : "border-slate-200 focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]"
                  )}
                />
                {fieldErrors.phone && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.phone}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="name@example.com"
                  className={cn(
                    "w-full h-11 px-4 rounded-xl border text-sm bg-white outline-none transition-all",
                    fieldErrors.email
                      ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : "border-slate-200 focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]"
                  )}
                />
                {fieldErrors.email && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.email}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Address Line
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="Street address"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="e.g. Colombo"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <div
                className="w-7 h-7 bg-rose-100 text-rose-600 flex items-center justify-center text-sm font-bold"
                style={{ clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" }}
              >
                3
              </div>
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Contact Full Name
                </label>
                <input
                  type="text"
                  value={form.emergencyContactName}
                  onChange={(e) => set("emergencyContactName", e.target.value)}
                  placeholder="e.g. Jane Santos"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Relationship
                </label>
                <input
                  type="text"
                  value={form.emergencyContactRelation}
                  onChange={(e) => set("emergencyContactRelation", e.target.value)}
                  placeholder="e.g. Spouse"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Emergency Phone
                </label>
                <input
                  type="tel"
                  value={form.emergencyContactPhone}
                  onChange={(e) => set("emergencyContactPhone", e.target.value)}
                  placeholder="+94 77 ..."
                  className={cn(
                    "w-full h-11 px-4 rounded-xl border text-sm bg-white outline-none transition-all",
                    fieldErrors.emergencyContactPhone
                      ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : "border-slate-200 focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]"
                  )}
                />
                {fieldErrors.emergencyContactPhone && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.emergencyContactPhone}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <p className="text-rose-600 text-sm font-medium bg-rose-50 border border-rose-200 px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl h-11 px-8 font-semibold shadow-sm transition-all"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Registering Patient...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Register Patient
              </>
            )}
          </Button>
          <Link href="/front-desk/patients">
            <Button type="button" variant="ghost" className="rounded-xl h-11 px-6 text-slate-500 hover:bg-slate-100">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
