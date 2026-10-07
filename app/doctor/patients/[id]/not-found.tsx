"use client";

import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/catms/EmptyState";

export default function PatientNotFound() {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <Link href="/doctor/patients" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" /> Back to Patients
      </Link>
      <Card className="border-slate-200 shadow-sm">
        <EmptyState icon={Users} title="Patient not found" description="This patient hasn't booked with you, or doesn't exist." />
      </Card>
    </div>
  );
}
