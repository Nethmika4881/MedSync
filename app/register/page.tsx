"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type Role = "patient" | "doctor";

const baseSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  nic: z
    .string()
    .regex(/^\d{9}[vVxX]$|^\d{12}$/, "Enter a valid NIC (e.g. 200012345678)"),
  email: z.string().email("Enter a valid email address"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["Male", "Female", "Other"], {
    errorMap: () => ({ message: "Select a gender" }),
  }),
  specialization: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof baseSchema>;

export default function RegisterPage() {
  const [role, setRole] = useState<Role>("patient");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(baseSchema),
  });

  async function onSubmit(data: RegisterFormValues) {
    // TODO: wire up register action
    console.log({ role, ...data });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background py-12">
      <div className="w-full max-w-md">

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">MedSync</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create your account
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-8">

          {/* Role toggle */}
          <div className="flex rounded-md border border-border overflow-hidden mb-6">
            <button
              type="button"
              id="role-patient"
              onClick={() => setRole("patient")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                role === "patient"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              Patient
            </button>
            <button
              type="button"
              id="role-doctor"
              onClick={() => setRole("doctor")}
              className={`flex-1 py-2 text-sm font-medium transition-colors border-l border-border ${
                role === "doctor"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              Doctor
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>

            {/* Full name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="full-name" className="text-sm font-medium text-foreground">
                Full name
              </label>
              <input
                id="full-name"
                type="text"
                placeholder="John Perera"
                {...register("fullName")}
                className="bg-card border border-border text-foreground text-sm rounded-md px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-invalid={errors.fullName ? "true" : undefined}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            {/* NIC */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="nic" className="text-sm font-medium text-foreground">
                NIC number
              </label>
              <input
                id="nic"
                type="text"
                placeholder="200012345678"
                {...register("nic")}
                className="bg-card border border-border text-foreground text-sm rounded-md px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-invalid={errors.nic ? "true" : undefined}
              />
              {errors.nic && (
                <p className="text-xs text-destructive">{errors.nic.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                className="bg-card border border-border text-foreground text-sm rounded-md px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-invalid={errors.email ? "true" : undefined}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* DOB + Gender */}
            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <label htmlFor="dob" className="text-sm font-medium text-foreground">
                  Date of birth
                </label>
                <input
                  id="dob"
                  type="date"
                  {...register("dob")}
                  className="bg-card border border-border text-foreground text-sm rounded-md px-3 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  aria-invalid={errors.dob ? "true" : undefined}
                />
                {errors.dob && (
                  <p className="text-xs text-destructive">{errors.dob.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label htmlFor="gender" className="text-sm font-medium text-foreground">
                  Gender
                </label>
                <select
                  id="gender"
                  {...register("gender")}
                  className="bg-card border border-border text-foreground text-sm rounded-md px-3 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  aria-invalid={errors.gender ? "true" : undefined}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && (
                  <p className="text-xs text-destructive">{errors.gender.message}</p>
                )}
              </div>
            </div>

            {/* Specialization (doctor only) */}
            {role === "doctor" && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="specialization" className="text-sm font-medium text-foreground">
                  Specialization
                </label>
                <input
                  id="specialization"
                  type="text"
                  placeholder="e.g. Cardiology"
                  {...register("specialization")}
                  className="bg-card border border-border text-foreground text-sm rounded-md px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  aria-invalid={errors.specialization ? "true" : undefined}
                />
                {errors.specialization && (
                  <p className="text-xs text-destructive">{errors.specialization.message}</p>
                )}
              </div>
            )}

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className="bg-card border border-border text-foreground text-sm rounded-md px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-invalid={errors.password ? "true" : undefined}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                className="bg-card border border-border text-foreground text-sm rounded-md px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-invalid={errors.confirmPassword ? "true" : undefined}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
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
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </main>
  );
}