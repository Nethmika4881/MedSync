"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";
import { getBranches } from "@/lib/actions/branches";
import { createStaff } from "@/lib/actions/staff";
import { useSearchParams } from "next/navigation";

const ROLES = ["Admin", "Doctor", "FrontDesk"];
const SPECIALIZATIONS = [
  "Cardiology",
  "Dermatology",
  "General Practice",
  "Gynecology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Psychology",
];
type BranchOption = {
  branch_id: string;
  branch_name: string;
};

export default function NewStaffPage() {
  const searchParams = useSearchParams();
  const doctorMode = searchParams.get("role") === "Doctor";

  const returnPath = doctorMode ? "/admin/doctors" : "/admin/staff";
  const [submitted, setSubmitted] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [error, setError] = useState("");
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    nic: "",
    email: "",
    phone: "",
    gender: "Male",
    dob: "",

    addressLine1: "",
    addressLine2: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Sri Lanka",

    role: doctorMode ? "Doctor" : "FrontDesk",
    branchID: "",
    joinedDate: "",

    password: "",
    confirmPassword: "",
    specialization: doctorMode ? "General Practice" : "",
    medicalLicenceNo: "",
    roomNo: "",
    consultationFee: "1500",
    yearsExperience: "",
    qualification: "",
  });
  useEffect(() => {
    let active = true;

    getBranches().then((rows) => {
      if (!active) return;

      setBranches(rows);
      setForm((current) => ({
        ...current,
        branchID: current.branchID || rows[0]?.branch_id || "",
      }));
      setBranchesLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setIsSubmitting(true);

    try {
      const result = await createStaff(form);

      if (!result?.success) {
        setError("Unable to create staff member.");
        return;
      }

      setNewStaffName(`${form.firstName} ${form.lastName}`);
      setSubmitted(true);
    } catch (error) {
      console.error("Creation failed : ", error);
      setError("Unable to create the staff member.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    const colorClass = getAvatarColor(newStaffName);
    return (
      <div className="max-w-xl mx-auto text-center py-20 animate-fade-in">
        <div
          className={cn(
            "w-20 h-20 flex items-center justify-center mx-auto mb-6 text-2xl font-black rounded-2xl",
            colorClass,
          )}
        >
          {getInitials(newStaffName)}
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-semibold mb-4 border border-green-200">
          <CheckCircle2 className="w-4 h-4" /> Employee Provisioned
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">
          {newStaffName}
        </h2>
        <p className="text-slate-500 mb-8">
          Successfully added to the clinic staff directory.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => {
              setSubmitted(false);
              setForm({
                firstName: "",
                lastName: "",
                nic: "",
                email: "",
                phone: "",
                gender: "Male",
                dob: "",
                addressLine1: "",
                addressLine2: "",
                city: "",
                province: "",
                postalCode: "",
                country: "Sri Lanka",
                role: doctorMode ? "Doctor" : "FrontDesk",
                branchID: branches[0]?.branch_id || "",
                joinedDate: "",
                password: "",
                confirmPassword: "",
                medicalLicenceNo: "",
                roomNo: "",
                consultationFee: "1500",
                yearsExperience: "",
                qualification: "",
                specialization: doctorMode ? "General Practice" : "",
              });
            }}
            variant="outline"
            className="rounded-xl px-6 h-11"
          >
            Add Another
          </Button>
          <Link href={returnPath}>
            <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl px-6 h-11">
              View Directory
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href={returnPath}>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-500 hover:bg-slate-100 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {doctorMode ? "Register New Doctor" : "Provision New Staff"}
          </h2>

          <p className="text-slate-500 text-sm">
            {doctorMode
              ? "Create the doctor account and professional profile."
              : "Add a new employee and configure their role."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal & Role Info */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold rounded-lg">
                1
              </div>
              Employment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ["First Name *", "firstName", "text", "e.g. Jane"],
                ["Last Name *", "lastName", "text", "e.g. Doe"],
              ].map(([label, field, type, ph]) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={form[field as keyof typeof form]}
                    onChange={(e) => set(field, e.target.value)}
                    placeholder={ph}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none"
                    required
                  />
                </div>
              ))}

              <div>
                <label className="block mb-1">NIC *</label>
                <input
                  type="text"
                  value={form.nic}
                  onChange={(e) => set("nic", e.target.value)}
                  required
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div>
                <label className="block mb-1">Gender *</label>
                <select
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value)}
                  required
                  className="w-full border rounded-md p-2"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Date of Birth *</label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => set("dob", e.target.value)}
                  required
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div>
                <label className="block mb-1">Joined Date</label>
                <input
                  type="date"
                  value={form.joinedDate}
                  onChange={(e) => set("joinedDate", e.target.value)}
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  System Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) => set("role", e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] outline-none"
                >
                  {ROLES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Primary Branch Allocation
                </label>
                <select
                  value={form.branchID}
                  onChange={(e) => set("branchID", e.target.value)}
                  disabled={branchesLoading || branches.length === 0}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] outline-none"
                >
                  <option value="">
                    {branchesLoading
                      ? "Loading branches..."
                      : "Select a branch"}
                  </option>
                  {branches.map((b) => (
                    <option key={b.branch_id} value={b.branch_id}>
                      {b.branch_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-7 h-7 bg-teal-100 text-teal-600 flex items-center justify-center text-sm font-bold rounded-lg">
                2
              </div>
              Contact Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ["Phone *", "phone", "tel", "+1 (555) ..."],
                ["Email *", "email", "email", "employee@clinic.com"],
              ].map(([label, field, type, ph]) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={form[field as keyof typeof form]}
                    onChange={(e) => set(field, e.target.value)}
                    placeholder={ph}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none"
                    required
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle>Address Information</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Address Line 1 *</label>
                <input
                  type="text"
                  value={form.addressLine1}
                  onChange={(e) => set("addressLine1", e.target.value)}
                  required
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div>
                <label className="block mb-1">Address Line 2</label>
                <input
                  type="text"
                  value={form.addressLine2}
                  onChange={(e) => set("addressLine2", e.target.value)}
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div>
                <label className="block mb-1">City *</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  required
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div>
                <label className="block mb-1">Province</label>
                <input
                  type="text"
                  value={form.province}
                  onChange={(e) => set("province", e.target.value)}
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div>
                <label className="block mb-1">Postal Code</label>
                <input
                  type="text"
                  value={form.postalCode}
                  onChange={(e) => set("postalCode", e.target.value)}
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div>
                <label className="block mb-1">Country *</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  required
                  className="w-full border rounded-md p-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Password *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  minLength={8}
                  required
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div>
                <label className="block mb-1">Confirm Password *</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  minLength={8}
                  required
                  className="w-full border rounded-md p-2"
                />
              </div>
            </div>

            <p className="text-sm text-slate-500 mt-2">
              The password must contain at least 8 characters.
            </p>
          </CardContent>
        </Card>
        {/* Doctor Information */}
        {form.role === "Doctor" && (
          <Card>
            <CardHeader>
              <CardTitle>Doctor Information</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Specialization *</label>

                  <select
                    value={form.specialization}
                    onChange={(event) =>
                      set("specialization", event.target.value)
                    }
                    required
                    className="w-full border rounded-md p-2"
                  >
                    {SPECIALIZATIONS.map((specialization) => (
                      <option key={specialization} value={specialization}>
                        {specialization}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Medical Licence Number *</label>
                  <input
                    type="text"
                    value={form.medicalLicenceNo}
                    onChange={(e) => set("medicalLicenceNo", e.target.value)}
                    required
                    className="w-full border rounded-md p-2"
                  />
                </div>

                <div>
                  <label className="block mb-1">Room Number</label>
                  <input
                    type="text"
                    value={form.roomNo}
                    onChange={(e) => set("roomNo", e.target.value)}
                    maxLength={5}
                    className="w-full border rounded-md p-2"
                  />
                </div>

                <div>
                  <label className="block mb-1">Consultation Fee *</label>
                  <input
                    type="number"
                    value={form.consultationFee}
                    onChange={(e) => set("consultationFee", e.target.value)}
                    min="1"
                    required
                    className="w-full border rounded-md p-2"
                  />
                </div>

                <div>
                  <label className="block mb-1">Years of Experience</label>
                  <input
                    type="number"
                    value={form.yearsExperience}
                    onChange={(e) => set("yearsExperience", e.target.value)}
                    min="0"
                    className="w-full border rounded-md p-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block mb-1">Qualification</label>
                  <input
                    type="text"
                    value={form.qualification}
                    onChange={(e) => set("qualification", e.target.value)}
                    className="w-full border rounded-md p-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {error && (
          <p className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl h-11 px-8 font-semibold"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {isSubmitting
              ? doctorMode
                ? "Creating Doctor..."
                : "Creating Staff..."
              : doctorMode
                ? "Register Doctor"
                : "Add Member"}
          </Button>
          <Link href={returnPath}>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl h-11 px-6 text-slate-600"
            >
              {doctorMode ? "View Doctors" : "View Staff"}
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
