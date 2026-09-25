"use client";

import Link from "next/link";
import { useState } from "react";

type Role = "patient" | "doctor";

export default function RegisterPage() {
  const [role, setRole] = useState<Role>("patient");

  return (
    <main className="min-h-screen flex items-center justify-center bg-background py-12">
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">MedSync</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create your account
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-8">

          {/* Role selector */}
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

          <form className="flex flex-col gap-5">

            {/* Full name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="full-name" className="text-sm font-medium text-foreground">
                Full name
              </label>
              <input
                id="full-name"
                type="text"
                placeholder="John Perera"
                className="bg-card border border-border text-foreground text-sm rounded-md px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
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
                className="bg-card border border-border text-foreground text-sm rounded-md px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
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
                className="bg-card border border-border text-foreground text-sm rounded-md px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {/* Date of birth + Gender — side by side */}
            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <label htmlFor="dob" className="text-sm font-medium text-foreground">
                  Date of birth
                </label>
                <input
                  id="dob"
                  type="date"
                  className="bg-card border border-border text-foreground text-sm rounded-md px-3 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label htmlFor="gender" className="text-sm font-medium text-foreground">
                  Gender
                </label>
                <select
                  id="gender"
                  className="bg-card border border-border text-foreground text-sm rounded-md px-3 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Doctor-only field */}
            {role === "doctor" && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="specialization" className="text-sm font-medium text-foreground">
                  Specialization
                </label>
                <input
                  id="specialization"
                  type="text"
                  placeholder="e.g. Cardiology"
                  className="bg-card border border-border text-foreground text-sm rounded-md px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
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
                className="bg-card border border-border text-foreground text-sm rounded-md px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
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
                className="bg-card border border-border text-foreground text-sm rounded-md px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground text-sm font-medium rounded-md px-4 py-2 hover:bg-primary/90 transition-colors mt-1"
            >
              Create account
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* Back to login */}
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