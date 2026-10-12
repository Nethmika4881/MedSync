"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterFormValues, registerSchema } from "@/lib/schemas";
import registerFunction from "@/lib/actions/auth";
import { getBranches } from "@/lib/actions/branches";

const inputClass =
  "bg-card border border-border text-foreground text-sm rounded-md px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-full";

const sectionLabel = (text: string) => (
  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">
    {text}
  </p>
);

export default function RegisterPage() {
  const [branches, setBranches] = useState<
    { branch_id: string; branch_name: string }[]
  >([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchBranches() {
      const data = await getBranches();
      setBranches(data);
    }
    fetchBranches();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "Patient",
      fullName: "Sample Name",
      nic: "198012345678",
      email: "sample@example.com",
      phoneNumber: "+94771234567",
      dob: "1980-01-01",
      gender: "Male",
      addressLine1: "123 Sample Street",
      addressLine2: "Apt 4B",
      city: "Colombo",
      province: "Western",
      postalCode: "10100",
      country: "Sri Lanka",
      password: "password123",
      confirmPassword: "password123",
      branchId: "123e4567-e89b-12d3-a456-426614174000",
      bloodGroup: "O+",
      emergencyContactName: "Jane Doe",
      emergencyContactPhone: "+94777654321",
      emergencyContactRelationship: "Spouse",
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    setError("");
    const result = await registerFunction(data);
    if (result) setError(result);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background py-12">
      <div className="w-full max-w-lg px-4">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">MedSync</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create your account
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Patient accounts create
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-8">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
            noValidate
          >
            <input type="hidden" {...register("role")} />

            {/* ── PERSONAL INFO ── */}
            {sectionLabel("Personal Information")}

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="full-name"
                className="text-sm font-medium text-foreground"
              >
                Full name
              </label>
              <input
                id="full-name"
                type="text"
                placeholder="Samantha Perera"
                {...register("fullName")}
                className={inputClass}
                aria-invalid={errors.fullName ? "true" : undefined}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="nic"
                className="text-sm font-medium text-foreground"
              >
                NIC number
              </label>
              <input
                id="nic"
                type="text"
                placeholder="200012345678"
                {...register("nic")}
                className={inputClass}
                aria-invalid={errors.nic ? "true" : undefined}
              />
              {errors.nic && (
                <p className="text-xs text-destructive">{errors.nic.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                className={inputClass}
                aria-invalid={errors.email ? "true" : undefined}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="phone-number"
                className="text-sm font-medium text-foreground"
              >
                Phone number
              </label>
              <input
                id="phone-number"
                type="tel"
                placeholder="+94771234567"
                {...register("phoneNumber")}
                className={inputClass}
                aria-invalid={errors.phoneNumber ? "true" : undefined}
              />
              {errors.phoneNumber && (
                <p className="text-xs text-destructive">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <label
                  htmlFor="dob"
                  className="text-sm font-medium text-foreground"
                >
                  Date of birth
                </label>
                <input
                  id="dob"
                  type="date"
                  {...register("dob")}
                  className={inputClass}
                  aria-invalid={errors.dob ? "true" : undefined}
                />
                {errors.dob && (
                  <p className="text-xs text-destructive">
                    {errors.dob.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label
                  htmlFor="gender"
                  className="text-sm font-medium text-foreground"
                >
                  Gender
                </label>
                <select
                  id="gender"
                  {...register("gender")}
                  className={inputClass}
                  aria-invalid={errors.gender ? "true" : undefined}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && (
                  <p className="text-xs text-destructive">
                    {errors.gender.message}
                  </p>
                )}
              </div>
            </div>

            {/* ── ADDRESS ── */}
            {sectionLabel("Address")}

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="address-line1"
                className="text-sm font-medium text-foreground"
              >
                Address line 1
              </label>
              <input
                id="address-line1"
                type="text"
                placeholder="123 Main Street"
                {...register("addressLine1")}
                className={inputClass}
                aria-invalid={errors.addressLine1 ? "true" : undefined}
              />
              {errors.addressLine1 && (
                <p className="text-xs text-destructive">
                  {errors.addressLine1.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="address-line2"
                className="text-sm font-medium text-foreground"
              >
                Address line 2{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <input
                id="address-line2"
                type="text"
                placeholder="Apt 4B"
                {...register("addressLine2")}
                className={inputClass}
              />
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <label
                  htmlFor="city"
                  className="text-sm font-medium text-foreground"
                >
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  placeholder="Colombo"
                  {...register("city")}
                  className={inputClass}
                  aria-invalid={errors.city ? "true" : undefined}
                />
                {errors.city && (
                  <p className="text-xs text-destructive">
                    {errors.city.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label
                  htmlFor="province"
                  className="text-sm font-medium text-foreground"
                >
                  Province
                </label>
                <input
                  id="province"
                  type="text"
                  placeholder="Western"
                  {...register("province")}
                  className={inputClass}
                  aria-invalid={errors.province ? "true" : undefined}
                />
                {errors.province && (
                  <p className="text-xs text-destructive">
                    {errors.province.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <label
                  htmlFor="postal-code"
                  className="text-sm font-medium text-foreground"
                >
                  Postal code
                </label>
                <input
                  id="postal-code"
                  type="text"
                  placeholder="10100"
                  {...register("postalCode")}
                  className={inputClass}
                  aria-invalid={errors.postalCode ? "true" : undefined}
                />
                {errors.postalCode && (
                  <p className="text-xs text-destructive">
                    {errors.postalCode.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label
                  htmlFor="country"
                  className="text-sm font-medium text-foreground"
                >
                  Country
                </label>
                <input
                  id="country"
                  type="text"
                  placeholder="Sri Lanka"
                  {...register("country")}
                  className={inputClass}
                  aria-invalid={errors.country ? "true" : undefined}
                />
                {errors.country && (
                  <p className="text-xs text-destructive">
                    {errors.country.message}
                  </p>
                )}
              </div>
            </div>

            {/* ── PATIENT FIELDS ── */}
            {sectionLabel("Patient Details")}

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="blood-group"
                className="text-sm font-medium text-foreground"
              >
                Blood group{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <select
                id="blood-group"
                {...register("bloodGroup")}
                className={inputClass}
              >
                <option value="">Select</option>
                <option value="A+">A+</option>
                <option value="A-">A−</option>
                <option value="B+">B+</option>
                <option value="B-">B−</option>
                <option value="O+">O+</option>
                <option value="O-">O−</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB−</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="emergency-name"
                className="text-sm font-medium text-foreground"
              >
                Emergency contact name
              </label>
              <input
                id="emergency-name"
                type="text"
                placeholder="John Perera"
                {...register("emergencyContactName")}
                className={inputClass}
                aria-invalid={errors.emergencyContactName ? "true" : undefined}
              />
              {errors.emergencyContactName && (
                <p className="text-xs text-destructive">
                  {errors.emergencyContactName.message}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <label
                  htmlFor="emergency-phone"
                  className="text-sm font-medium text-foreground"
                >
                  Phone
                </label>
                <input
                  id="emergency-phone"
                  type="tel"
                  placeholder="+94771234567"
                  {...register("emergencyContactPhone")}
                  className={inputClass}
                  aria-invalid={
                    errors.emergencyContactPhone ? "true" : undefined
                  }
                />
                {errors.emergencyContactPhone && (
                  <p className="text-xs text-destructive">
                    {errors.emergencyContactPhone.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label
                  htmlFor="emergency-relationship"
                  className="text-sm font-medium text-foreground"
                >
                  Relationship
                </label>
                <input
                  id="emergency-relationship"
                  type="text"
                  placeholder="Parent, Spouse…"
                  {...register("emergencyContactRelationship")}
                  className={inputClass}
                  aria-invalid={
                    errors.emergencyContactRelationship ? "true" : undefined
                  }
                />
                {errors.emergencyContactRelationship && (
                  <p className="text-xs text-destructive">
                    {errors.emergencyContactRelationship.message}
                  </p>
                )}
              </div>
            </div>

            {/* ── CLINIC BRANCH ── */}
            {sectionLabel("Clinic Branch")}

            <div className="flex flex-col gap-1.5 mb-2">
              <label
                htmlFor="branch-id"
                className="text-sm font-medium text-foreground"
              >
                Select Branch
              </label>
              <select
                id="branch-id"
                {...register("branchId")}
                className={inputClass}
                aria-invalid={errors.branchId ? "true" : undefined}
              >
                <option value="">-- Select a Branch --</option>
                {branches.map((b) => (
                  <option key={b.branch_id} value={b.branch_id}>
                    {b.branch_name}
                  </option>
                ))}
              </select>
              {errors.branchId && (
                <p className="text-xs text-destructive">
                  {errors.branchId.message}
                </p>
              )}
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            {/* ── SECURITY ── */}
            {sectionLabel("Security")}

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className={inputClass}
                aria-invalid={errors.password ? "true" : undefined}
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="confirm-password"
                className="text-sm font-medium text-foreground"
              >
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                className={inputClass}
                aria-invalid={errors.confirmPassword ? "true" : undefined}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground text-sm font-medium rounded-md px-4 py-2 hover:bg-primary/90 transition-colors mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
