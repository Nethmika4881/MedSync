"use client";
import { mockUsers } from "@/lib/mockData/users";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { roleConfig } from "@/lib/mockData/users";
import type { UserRole } from "@/lib/types";
import { ChevronRight, HeartPulse, Sparkles, Shield, Clock, Users, ArrowRight } from "lucide-react";
import { AvatarWithName } from "@/components/catms/AvatarWithName";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const handleLogin = (userId: string) => {
    login(userId);
    const user = mockUsers.find((u) => u.userId === userId);
    if (user?.role === "admin") {
      router.push("/admin-dashboard");
    } else if (user?.role === "receptionist") {
      router.push("/front-desk-dashboard");
    } else if (user?.role === "doctor") {
      router.push("/schedule");
    } else {
      router.push("/dashboard");
    }
  };

  const patientDemo = mockUsers.find(u => u.userId === "USR-003"); // Abraham Brakering

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 flex items-center px-8 justify-between shadow-sm">
        <div className="flex items-center gap-2 text-2xl font-bold font-outfit text-slate-900 tracking-tight">
          <HeartPulse className="w-8 h-8 text-[var(--brand-primary)]" />
          Med<span className="text-[var(--brand-primary)]">Sync</span>
        </div>
        <div className="flex gap-4">
          <a href="#demo" className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center h-10 px-4 transition-colors">
            Try Demo
          </a>
          <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center h-10 px-4 transition-colors">
            Features
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 pt-32 pb-20 px-8 flex flex-col items-center text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[var(--brand-primary)] text-xs font-semibold mb-6 ring-1 ring-blue-100/50">
          <Sparkles className="w-3.5 h-3.5" />
          Introducing Next-Gen Clinic Management
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold font-outfit text-slate-900 tracking-tight leading-tight mb-6">
          Healthcare Management, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)]">
            Beautifully Simplified.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
          MedSync is the ultimate clinic management system built with Next.js and Tailwind.
          A premium, UI-driven experience with complete mock data covering appointments, billing, pharmacy, and more.
        </p>

        {/* Feature Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-24 text-left">
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

        {/* Demo Login Section */}
        <div id="demo" className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row gap-12 items-center text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)]" />

          <div className="flex-1">
            <h2 className="text-3xl font-bold font-outfit text-slate-900 mb-4">Experience the Demo</h2>
            <p className="text-slate-600 mb-8">
              Select a role below to explore MedSync's specialized interfaces. Each role has unique access to appointments, billing, pharmacy, and patient records.
            </p>

            <div className="space-y-4">
              {patientDemo && (
                <button
                  onClick={() => handleLogin(patientDemo.userId)}
                  className="w-full group flex items-center justify-between p-4 border border-blue-100 bg-blue-50 hover:bg-blue-100/80 transition-colors text-left patient-role-shape"
                >
                  <div className="flex items-center gap-4">
                    <AvatarWithName name={patientDemo.name} avatarSrc={patientDemo.avatar} subtitle="Patient Portal Demo" size="lg" />
                  </div>
                  <div className="flex items-center text-blue-600 font-semibold text-sm">
                    Enter Patient Portal
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {mockUsers.filter(u => u.role !== 'patient').map(user => {
                  const roleCfg = roleConfig[user.role as UserRole];
                  console.log(roleCfg);
                  return (
                    <button
                      key={user.userId}
                      onClick={() => handleLogin(user.userId)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 border transition-all text-center group demo-role-shape hover:shadow-md",
                        roleCfg.color,
                        "bg-white"
                      )}
                    >
                      <AvatarWithName name={user.name} avatarSrc={user.avatar} size="md" className="mb-2 flex-col text-center" />
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full mt-2", roleCfg.color)}>
                        {roleCfg.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-slate-500 text-sm">
        MedSync Medical System
      </footer>
    </div>
  );
}
