"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterFormValues, registerSchema } from "@/lib/schemas";
import registerFunction from "@/lib/actions/auth";
import { getBranches } from "@/lib/actions/branches";
import { ChevronDown, Check } from "lucide-react";

const inputClass =
  "bg-card border border-border text-foreground text-sm rounded-md px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-full";

const DEFAULT_BRANCHES = [
  {
    branch_id: "f9efc119-e5e6-4987-8818-7b6baf25708d",
    branch_name: "MedSync Central Colombo",
  },
  {
    branch_id: "f8ff5e58-df12-4ed4-99d2-3f04fb8a143f",
    branch_name: "MedSync Kandy Branch",
  },
  {
    branch_id: "3bf92f1b-19cd-426f-aa60-39b938826f2d",
    branch_name: "MedSync Southern Galle",
  },
  {
    branch_id: "2faa1d36-1b89-4999-925f-aec7cb787c42",
    branch_name: "Main Branch",
  },
];

const sectionLabel = (text: string) => (
  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">
    {text}
  </p>
);

export default function RegisterPage() {
  const [branches, setBranches] = useState<
    { branch_id: string; branch_name: string }[]
  >(DEFAULT_BRANCHES);
  const [branchSearch, setBranchSearch] = useState("");
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const branchDropdownRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchBranches() {
      try {
        const data = await getBranches();
        if (data && data.length > 0) {
          setBranches(data);
        }
      } catch (err) {
        console.error("Failed to fetch branches:", err);
      }
    }
    fetchBranches();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        branchDropdownRef.current &&
        !branchDropdownRef.current.contains(event.target as Node)
      ) {
        setIsBranchDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "Employee",
      employeeRole: "Doctor",
      fullName: "Dr. Sample Name",
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
      // Doctor fields
      specialization: "Cardiology",
      joinedDate: "2024-01-01",
      medicalLicenceNo: "MD-12345",
      consultationFee: 1500,
      yearsExperience: 10,
      qualification: "MBBS, MD",
      roomNo: "101A",
      branchId: "",
      // Patient fields
      bloodGroup: "O+",
      emergencyContactName: "Jane Doe",
      emergencyContactPhone: "+94777654321",
      emergencyContactRelationship: "Spouse",
    },
  });

  const role = watch("role");
  const selectedBranchId = watch("branchId");

  const handleBranchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBranchSearch(value);
    setIsBranchDropdownOpen(true);

    const match = branches.find(
      (b) => b.branch_name.toLowerCase() === value.trim().toLowerCase()
    );
    if (match) {
      setValue("branchId", match.branch_id, { shouldValidate: true });
    } else {
      setValue("branchId", "", { shouldValidate: true });
    }
  };

  const handleSelectBranch = (branch: {
    branch_id: string;
    branch_name: string;
  }) => {
    setValue("branchId", branch.branch_id, { shouldValidate: true });
    setBranchSearch(branch.branch_name);
    setIsBranchDropdownOpen(false);
  };

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

          {/* Role toggle */}
          <div className="flex rounded-md border border-border overflow-hidden mb-6">
            <button
              type="button"
              id="role-patient"
              onClick={() => {
                setValue("role", "Patient", { shouldValidate: true });
                setValue("employeeRole", undefined, { shouldValidate: true });
              }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${role === "Patient"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted"
                }`}
            >
              Patient
            </button>
            <button
              type="button"
              id="role-employee"
              onClick={() => {
                setValue("role", "Employee", { shouldValidate: true });
                setValue("employeeRole", "Doctor", { shouldValidate: true });
              }}
              className={`flex-1 py-2 text-sm font-medium transition-colors border-l border-border ${role === "Employee"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted"
                }`}
            >
              Doctor
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
            <input type="hidden" {...register("role")} />
            <input type="hidden" {...register("employeeRole")} />

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
            {role === "Patient" && (
              <>
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
                <label htmlFor="emergency-phone" className="text-sm font-medium text-foreground">Phone</label>
                <input id="emergency-phone" type="tel" placeholder="+94771234567"
                  {...register("emergencyContactPhone")} className={inputClass}
                  aria-invalid={errors.emergencyContactPhone ? "true" : undefined} />
                {errors.emergencyContactPhone && (
                  <p className="text-xs text-destructive">{errors.emergencyContactPhone.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label htmlFor="emergency-relationship" className="text-sm font-medium text-foreground">Relationship</label>
                <input id="emergency-relationship" type="text" placeholder="Parent, Spouse…"
                  {...register("emergencyContactRelationship")} className={inputClass}
                  aria-invalid={errors.emergencyContactRelationship ? "true" : undefined} />
                {errors.emergencyContactRelationship && (
                  <p className="text-xs text-destructive">{errors.emergencyContactRelationship.message}</p>
                )}
              </div>
            </div>
          </>
            )}

          {role === "Employee" && (
            <>
              {sectionLabel("Employment Details")}
              <div className="flex flex-col gap-1.5 flex-1">
                <label htmlFor="joined-date" className="text-sm font-medium text-foreground">Joined date</label>
                <input id="joined-date" type="date"
                  {...register("joinedDate")} className={inputClass}
                  aria-invalid={errors.joinedDate ? "true" : undefined} />
                {errors.joinedDate && (
                  <p className="text-xs text-destructive">{errors.joinedDate.message}</p>
                )}
              </div>
            </>
          )}

          {/* ── DOCTOR FIELDS ── */}
          {role === "Employee" && (
            <>
              {sectionLabel("Doctor Details")}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="medical-licence" className="text-sm font-medium text-foreground">Medical Licence No</label>
                <input id="medical-licence" type="text" placeholder="e.g. MD-12345"
                  {...register("medicalLicenceNo")} className={inputClass}
                  aria-invalid={errors.medicalLicenceNo ? "true" : undefined} />
                {errors.medicalLicenceNo && (
                  <p className="text-xs text-destructive">{errors.medicalLicenceNo.message}</p>
                )}
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label htmlFor="specialization" className="text-sm font-medium text-foreground">Specialization</label>
                  <input id="specialization" type="text" placeholder="e.g. Cardiology"
                    {...register("specialization")} className={inputClass}
                    aria-invalid={errors.specialization ? "true" : undefined} />
                  {errors.specialization && (
                    <p className="text-xs text-destructive">{errors.specialization.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label htmlFor="qualification" className="text-sm font-medium text-foreground">Qualification</label>
                  <input id="qualification" type="text" placeholder="e.g. MBBS, MD"
                    {...register("qualification")} className={inputClass}
                    aria-invalid={errors.qualification ? "true" : undefined} />
                  {errors.qualification && (
                    <p className="text-xs text-destructive">{errors.qualification.message}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label htmlFor="consultation-fee" className="text-sm font-medium text-foreground">Consultation Fee</label>
                  <input id="consultation-fee" type="number" step="0.01" placeholder="1500.00"
                    {...register("consultationFee")} className={inputClass}
                    aria-invalid={errors.consultationFee ? "true" : undefined} />
                  {errors.consultationFee && (
                    <p className="text-xs text-destructive">{errors.consultationFee.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label htmlFor="years-experience" className="text-sm font-medium text-foreground">Years of Experience</label>
                  <input id="years-experience" type="number" placeholder="5"
                    {...register("yearsExperience")} className={inputClass}
                    aria-invalid={errors.yearsExperience ? "true" : undefined} />
                  {errors.yearsExperience && (
                    <p className="text-xs text-destructive">{errors.yearsExperience.message}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label htmlFor="room-no" className="text-sm font-medium text-foreground">Room No</label>
                  <input id="room-no" type="text" placeholder="101A"
                    {...register("roomNo")} className={inputClass}
                    aria-invalid={errors.roomNo ? "true" : undefined} />
                  {errors.roomNo && (
                    <p className="text-xs text-destructive">{errors.roomNo.message}</p>
                  )}
                </div>

              </div>

            </>
          )}

          {/* ── CLINIC BRANCH ── */}
          {sectionLabel("Clinic Branch")}

          <div className="flex flex-col gap-1.5 mb-2 relative" ref={branchDropdownRef}>
            <label
              htmlFor="branch-search"
              className="text-sm font-medium text-foreground"
            >
              Select Branch
            </label>

            <input type="hidden" {...register("branchId")} />

            <div className="relative">
              <input
                id="branch-search"
                type="text"
                placeholder="Type to search or select a branch..."
                value={branchSearch}
                onChange={handleBranchInputChange}
                onFocus={() => setIsBranchDropdownOpen(true)}
                className={`${inputClass} pr-10`}
                autoComplete="off"
                aria-invalid={errors.branchId ? "true" : undefined}
              />
              <button
                type="button"
                onClick={() => setIsBranchDropdownOpen((prev) => !prev)}
                className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-muted-foreground hover:text-foreground"
                tabIndex={-1}
                aria-label="Toggle branch dropdown"
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isBranchDropdownOpen ? "rotate-180" : ""
                    }`}
                />
              </button>
            </div>

            {isBranchDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto py-1">
                {branches.filter((b) =>
                  b.branch_name
                    .toLowerCase()
                    .includes(branchSearch.toLowerCase())
                ).length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No matching branches found
                  </div>
                ) : (
                  branches
                    .filter((b) =>
                      b.branch_name
                        .toLowerCase()
                        .includes(branchSearch.toLowerCase())
                    )
                    .map((b) => (
                      <button
                        key={b.branch_id}
                        type="button"
                        className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-accent hover:text-accent-foreground transition-colors ${selectedBranchId === b.branch_id
                          ? "bg-accent/50 font-medium text-primary"
                          : "text-foreground"
                          }`}
                        onClick={() => handleSelectBranch(b)}
                      >
                        <span>{b.branch_name}</span>
                        {selectedBranchId === b.branch_id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    ))
                )}
              </div>
            )}

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
