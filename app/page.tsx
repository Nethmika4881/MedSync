"use client";

import React from "react";
import Link from "next/link";
import { HeartPulse, Shield, Clock, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 flex items-center px-8 justify-between shadow-sm">
        <div className="flex items-center gap-2 text-2xl font-bold font-outfit text-slate-900 tracking-tight">
          <HeartPulse className="w-8 h-8 text-[var(--brand-primary)]" />
          Med<span className="text-[var(--brand-primary)]">Sync</span>
        </div>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-700 border border-slate-300 hover:border-slate-400 h-10 px-5 flex items-center rounded-lg transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 h-10 px-5 flex items-center rounded-lg transition-colors"
          >
            Register
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 pt-32 pb-20 px-8 flex flex-col items-center text-center max-w-5xl mx-auto">
        
        <h1 className="text-5xl md:text-7xl font-extrabold font-outfit text-slate-900 tracking-tight leading-tight mb-6">
          Healthcare Management, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)]">
            Beautifully Simplified.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
          MedSync is a multi-branch clinic management system covering patient booking, clinical workspaces,
          front desk operations, and administrative dashboards.
        </p>

        <div className="flex gap-4 mb-24">
          <Link
            href="/login"
            className="h-12 px-8 flex items-center rounded-xl bg-[var(--brand-primary)] text-white font-semibold text-sm hover:bg-[var(--brand-primary)]/90 transition-colors shadow-lg shadow-blue-500/20"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="h-12 px-8 flex items-center rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            Create Account
          </Link>
        </div>

        {/* Feature Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Safe Prescribing</h3>
            <p className="text-sm text-slate-600">Built-in contraindication checks prevent life-threatening medication errors automatically.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Real-time Scheduling</h3>
            <p className="text-sm text-slate-600">Manage doctor availability, appointments, and conflicts seamlessly.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Role-Based Access</h3>
            <p className="text-sm text-slate-600">4 distinct user roles with tailored interfaces and permissions.</p>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-slate-500 text-sm">
        MedSync Medical System
      </footer>
    </div>
  );
}
