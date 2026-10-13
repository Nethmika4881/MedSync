"use client";

import React from "react";
import Link from "next/link";
import { CalendarDays, FileText, Pill } from "lucide-react";
import { Brand } from "@/components/catms/Brand";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 flex items-center px-8 justify-between shadow-sm">
        <Brand markClassName="size-10" textClassName="text-2xl" />
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
            Patient Sign Up
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 pt-32 pb-20 px-8 flex flex-col items-center text-center max-w-5xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-extrabold font-outfit text-slate-900 tracking-tight leading-tight mb-6">
          Your Health, <br />
          <span className="text-[var(--brand-primary)]">
            Beautifully Simplified.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
          Book appointments, view your medical records, keep track of
          prescriptions, and manage your care in one secure place.
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
            Create Patient Account
          </Link>
        </div>

        {/* Feature Grid */}
        <div
          id="features"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left"
        >
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
              <CalendarDays className="w-6 h-6 text-blue-600" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Easy Appointment Booking
            </h3>
            <p className="text-sm text-slate-600">
              Find an available doctor and book a convenient appointment
              without waiting on the phone.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-amber-600" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Your Medical Records
            </h3>
            <p className="text-sm text-slate-600">
              Review your visit history and important health information
              whenever you need it.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4">
              <Pill className="w-6 h-6 text-green-600" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Prescriptions in One Place
            </h3>
            <p className="text-sm text-slate-600">
              Check your prescribed medicines and dosage instructions from
              your patient account.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-8 px-4 text-center   text-xs max-w-2xl mx-auto leading-relaxed">
        <p className="font-medium text-slate-600 text-white mb-1">
          MedSync Medical System
        </p>
        <p className="text-white ">
          MedSync is a student-developed clinic management demonstration project
          at the University of Moratuwa. It is not an official healthcare
          provider and must not be used for real patient care.
        </p>
      </footer>
    </div>
  );
}
