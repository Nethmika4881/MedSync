"use client";

import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/catms/EmptyState";

export default function ConsultationNotFound() {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <Link href="/doctor/consultations" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" /> Back to Queue
      </Link>
      <Card className="border-slate-200 shadow-sm">
        <EmptyState icon={Calendar} title="Appointment not found" description="This consultation doesn't exist or isn't assigned to you." />
      </Card>
    </div>
  );
}
