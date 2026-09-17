"use client";

import React, { useState, useMemo } from "react";
import type { Doctor } from "@/lib/types";
import { doctors, branches } from "@/lib/constants";
import { useAppointmentStore } from "@/lib/stores/appointmentStore";
import { useCurrentUser } from "@/lib/stores/authStore";
import { Button } from "@/components/ui/button";
import {
  Search,
  Star,
  MapPin,
  Clock,
  Stethoscope,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  GraduationCap,
  DollarSign,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { VisitType } from "@/lib/types";
import { BookingModal, getAvatarGradient } from "@/components/catms/BookingModal";

// ─── Info Pill ────────────────────────────────────────────────────────────────

function InfoPill({
  icon: Icon,
  label,
  className,
}: {
  icon: React.ElementType;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1.5 bg-slate-50 rounded-lg px-2.5 py-1.5", className)}>
      <Icon className="w-3 h-3 text-slate-400 shrink-0" />
      <span className="text-xs text-slate-600 truncate">{label}</span>
    </div>
  );
}

// ─── Doctor Card ──────────────────────────────────────────────────────────────

function DoctorCard({ doctor, onBook }: { doctor: Doctor; onBook: (d: Doctor) => void }) {
  const gradient = getAvatarGradient(doctor.avatar);

  return (
    <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
      <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />
      <div className="p-6 flex-1 flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md`}
          >
            {doctor.avatar.replace(/[0-9]/g, "")}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-900 text-base leading-tight truncate">{doctor.name}</h3>
            <p className="text-sm text-[var(--brand-primary)] font-semibold mt-0.5">{doctor.specialization}</p>
            <div className="flex items-center gap-1 mt-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-3.5 h-3.5",
                    i < Math.floor(doctor.rating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-slate-200 text-slate-200"
                  )}
                />
              ))}
              <span className="text-xs font-semibold text-slate-700 ml-1">{doctor.rating}</span>
              <span className="text-xs text-slate-400">({doctor.reviewCount})</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <InfoPill icon={Clock} label={`${doctor.experience} yrs exp`} />
          <InfoPill icon={DollarSign} label={`$${doctor.consultationFee}`} />
          <InfoPill icon={MapPin} label={doctor.branchName} className="col-span-2" />
          <InfoPill icon={GraduationCap} label={doctor.education} className="col-span-2" />
        </div>

        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{doctor.bio}</p>
      </div>

      <div className="px-6 pb-5 flex items-center justify-between gap-3">
        <span
          className={cn(
            "text-xs font-semibold px-2.5 py-1 rounded-full",
            doctor.isAvailable
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          )}
        >
          {doctor.isAvailable ? "● Available" : "● Unavailable"}
        </span>
        <Button
          onClick={() => onBook(doctor)}
          disabled={!doctor.isAvailable}
          className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white text-sm font-semibold rounded-xl h-9 px-4 transition-all disabled:opacity-40"
        >
          <Calendar className="w-3.5 h-3.5 mr-1.5" />
          Book Now
        </Button>
      </div>
    </div>
  );
}



// ─── Main Page ────────────────────────────────────────────────────────────────

const SPECIALIZATIONS = [
  "All",
  "Cardiology",
  "Dermatology",
  "General Practice",
  "Gynecology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Psychology",
];

export default function FindDoctorsPage() {
  const user = useCurrentUser();
  const [search, setSearch] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("All");
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const branchOptions = ["All", ...branches.map((b) => b.name)];

  const filtered = useMemo(() => {
    return doctors.filter((d) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.specialization.toLowerCase().includes(q) ||
        d.branchName.toLowerCase().includes(q);
      const matchesSpec = selectedSpec === "All" || d.specialization === selectedSpec;
      const matchesBranch = selectedBranch === "All" || d.branchName === selectedBranch;
      const matchesAvail = !availableOnly || d.isAvailable;
      return matchesSearch && matchesSpec && matchesBranch && matchesAvail;
    });
  }, [search, selectedSpec, selectedBranch, availableOnly]);

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Find a Doctor</h2>
        <p className="text-slate-500 mt-0.5">Browse our specialists and book your appointment online.</p>
      </div>

      {/* Search + filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, specialization, or branch…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters((v) => !v)}
            className="sm:hidden h-11 rounded-xl border-slate-200 gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <div className="hidden sm:flex gap-3">
            <select
              value={selectedSpec}
              onChange={(e) => setSelectedSpec(e.target.value)}
              className="h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-[var(--brand-primary)] transition-all cursor-pointer"
            >
              {SPECIALIZATIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-[var(--brand-primary)] transition-all cursor-pointer"
            >
              {branchOptions.map((b) => <option key={b}>{b}</option>)}
            </select>
            <button
              onClick={() => setAvailableOnly((v) => !v)}
              className={cn(
                "h-11 px-4 rounded-xl border text-sm font-semibold transition-all whitespace-nowrap",
                availableOnly
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              )}
            >
              {availableOnly ? "● Available" : "Available only"}
            </button>
          </div>
        </div>

        {/* Mobile filter panel */}
        {showFilters && (
          <div className="sm:hidden mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3">
            <select
              value={selectedSpec}
              onChange={(e) => setSelectedSpec(e.target.value)}
              className="h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none"
            >
              {SPECIALIZATIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none"
            >
              {branchOptions.map((b) => <option key={b}>{b}</option>)}
            </select>
            <button
              onClick={() => setAvailableOnly((v) => !v)}
              className={cn(
                "h-11 px-4 rounded-xl border text-sm font-semibold",
                availableOnly
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "bg-white border-slate-200 text-slate-600"
              )}
            >
              {availableOnly ? "● Available only" : "Show available only"}
            </button>
          </div>
        )}
      </div>

      {/* Specialization chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SPECIALIZATIONS.map((spec) => (
          <button
            key={spec}
            onClick={() => setSelectedSpec(spec)}
            className={cn(
              "shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
              selectedSpec === spec
                ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-md"
                : "bg-white text-slate-600 border-slate-200 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
            )}
          >
            {spec}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-800">{filtered.length}</span> doctor
          {filtered.length !== 1 ? "s" : ""}
          {selectedSpec !== "All" && (
            <span className="ml-1">
              in <span className="font-semibold text-[var(--brand-primary)]">{selectedSpec}</span>
            </span>
          )}
        </p>
        {(search || selectedSpec !== "All" || selectedBranch !== "All" || availableOnly) && (
          <button
            onClick={() => {
              setSearch("");
              setSelectedSpec("All");
              setSelectedBranch("All");
              setAvailableOnly(false);
            }}
            className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear filters
          </button>
        )}
      </div>

      {/* Doctor Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((doctor) => (
            <DoctorCard key={doctor.doctorId} doctor={doctor} onBook={setBookingDoctor} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Stethoscope className="w-8 h-8 text-slate-300" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-700">No doctors found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters.</p>
          </div>
          <button
            onClick={() => {
              setSearch("");
              setSelectedSpec("All");
              setSelectedBranch("All");
              setAvailableOnly(false);
            }}
            className="text-sm text-[var(--brand-primary)] font-semibold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Booking Modal */}
      {bookingDoctor && (
        <BookingModal
          doctor={bookingDoctor}
          onClose={() => setBookingDoctor(null)}
          currentUserId={user.userId}
          currentUserName={user.name}
        />
      )}
    </div>
  );
}
