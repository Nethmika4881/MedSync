"use client";

import React, { useState, useMemo } from "react";
import type { Doctor } from "@/lib/types";
import { branches } from "@/lib/constants";
import { useDoctorStore } from "@/lib/stores/doctorStore";
import { useCurrentUser } from "@/lib/stores/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Star,
  MapPin,
  Clock,
  Stethoscope,
  Calendar,
  X,
  GraduationCap,
  Sparkles,
  SlidersHorizontal,
  ArrowUpDown,
  Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BookingModal, getAvatarGradient } from "@/components/catms/BookingModal";

// ─── Specializations List ─────────────────────────────────────────────────────
const SPECIALIZATIONS = [
  "All Specialties",
  "Cardiology",
  "Dermatology",
  "ENT",
  "General Practice",
  "Gynecology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Psychology",
];

type SortOption = "rating" | "experience" | "fee-asc" | "fee-desc" | "name";

// ─── Info Pill Component ──────────────────────────────────────────────────────
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
    <div className={cn("flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 min-w-0", className)}>
      <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span className="text-xs text-slate-600 font-medium truncate">{label}</span>
    </div>
  );
}

// ─── Doctor Card Component ────────────────────────────────────────────────────
function DoctorCard({
  doctor,
  onBook,
}: {
  doctor: Doctor;
  onBook: (d: Doctor) => void;
}) {
  const gradient = getAvatarGradient(doctor.avatar || doctor.name.slice(0, 2));

  return (
    <Card className="group border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden flex flex-col bg-white">
      {/* Top gradient accent line */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

      <CardContent className="p-6 flex-1 flex flex-col justify-between gap-5">
        <div className="space-y-4">
          {/* Header Row: Avatar, Name, Specialization & Rating */}
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md shadow-slate-200`}
            >
              {doctor.avatar || doctor.name.slice(0, 2).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-slate-900 text-base leading-tight truncate group-hover:text-[var(--brand-primary)] transition-colors">
                  {doctor.name}
                </h3>
              </div>
              <p className="text-sm font-semibold text-[var(--brand-primary)] mt-0.5">
                {doctor.specialization}
              </p>

              <div className="flex items-center gap-1.5 mt-1">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-3.5 h-3.5",
                        i < Math.floor(doctor.rating || 5)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-slate-200 text-slate-200"
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-700 ml-0.5">
                  {doctor.rating ? doctor.rating.toFixed(1) : "5.0"}
                </span>
                <span className="text-xs text-slate-400">
                  ({doctor.reviewCount ?? 50})
                </span>
              </div>
            </div>
          </div>

          {/* Metadata Badges */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <InfoPill icon={Clock} label={`${doctor.experience} yrs experience`} />
            <InfoPill
              icon={Banknote}
              label={`LKR ${Number(doctor.consultationFee || 2500).toLocaleString()}`}
            />
            <InfoPill icon={MapPin} label={doctor.branchName} className="col-span-2" />
            <InfoPill icon={GraduationCap} label={doctor.education} className="col-span-2" />
          </div>

          {/* Bio text */}
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 pt-1">
            {doctor.bio}
          </p>
        </div>

        {/* Action Bottom Row */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full",
                doctor.isAvailable
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  doctor.isAvailable ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                )}
              />
              {doctor.isAvailable ? "Available" : "Off-Duty"}
            </span>
          </div>

          <Button
            onClick={() => onBook(doctor)}
            disabled={!doctor.isAvailable}
            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white text-xs sm:text-sm font-semibold rounded-xl h-9 px-4 transition-all shadow-sm shadow-blue-500/10 disabled:opacity-40"
          >
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Book Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Find Doctors Page ───────────────────────────────────────────────────
export default function FindDoctorsPage() {
  const user = useCurrentUser();
  const { doctors: allDoctors } = useDoctorStore();

  const [search, setSearch] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("All Specialties");
  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Available branch options from loaded branches
  const branchOptions = useMemo(() => {
    return ["All Branches", ...branches.map((b) => b.name)];
  }, []);

  // Filtered and Sorted Doctors
  const filteredAndSortedDoctors = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = allDoctors.filter((doc) => {
      // Search across name, specialization, education, branchName, and bio
      const matchesSearch =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.specialization.toLowerCase().includes(q) ||
        doc.branchName.toLowerCase().includes(q) ||
        (doc.education && doc.education.toLowerCase().includes(q)) ||
        (doc.bio && doc.bio.toLowerCase().includes(q));

      const matchesSpec =
        selectedSpec === "All Specialties" || doc.specialization === selectedSpec;

      const matchesBranch =
        selectedBranch === "All Branches" || doc.branchName === selectedBranch;

      const matchesAvail = !availableOnly || doc.isAvailable;

      return matchesSearch && matchesSpec && matchesBranch && matchesAvail;
    });

    // Sorting
    return filtered.sort((a, b) => {
      if (sortBy === "rating") {
        return (b.rating ?? 0) - (a.rating ?? 0);
      }
      if (sortBy === "experience") {
        return (b.experience ?? 0) - (a.experience ?? 0);
      }
      if (sortBy === "fee-asc") {
        return (a.consultationFee ?? 0) - (b.consultationFee ?? 0);
      }
      if (sortBy === "fee-desc") {
        return (b.consultationFee ?? 0) - (a.consultationFee ?? 0);
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [allDoctors, search, selectedSpec, selectedBranch, availableOnly, sortBy]);

  const hasActiveFilters =
    Boolean(search) ||
    selectedSpec !== "All Specialties" ||
    selectedBranch !== "All Branches" ||
    availableOnly;

  const handleResetFilters = () => {
    setSearch("");
    setSelectedSpec("All Specialties");
    setSelectedBranch("All Branches");
    setAvailableOnly(false);
    setSortBy("rating");
  };

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[var(--brand-primary)] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Specialist Directory
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-outfit">
            Find a Doctor
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Browse our clinical specialists across Colombo, Kandy, and Galle branches.
          </p>
        </div>
      </div>

      {/* Primary Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search text input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by doctor name, specialty, branch, or keywords…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Desktop Filter Controls */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Branch Selector */}
            <div className="relative min-w-[190px]">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full h-11 pl-9 pr-8 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer appearance-none text-slate-700 font-medium"
              >
                {branchOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Selector */}
            <div className="relative min-w-[170px]">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full h-11 pl-8 pr-8 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer appearance-none text-slate-700 font-medium"
              >
                <option value="rating">Highest Rated</option>
                <option value="experience">Most Experienced</option>
                <option value="fee-asc">Fee: Low to High</option>
                <option value="fee-desc">Fee: High to Low</option>
                <option value="name">Alphabetical (A-Z)</option>
              </select>
            </div>

            {/* Availability Toggle */}
            <button
              onClick={() => setAvailableOnly((v) => !v)}
              className={cn(
                "h-11 px-4 rounded-xl border text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2",
                availableOnly
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  availableOnly ? "bg-emerald-500" : "bg-slate-300"
                )}
              />
              Available Now
            </button>
          </div>

          {/* Mobile Filter Toggle Button */}
          <div className="md:hidden flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowMobileFilters((v) => !v)}
              className="flex-1 h-11 rounded-xl border-slate-200 gap-2 font-medium"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters &amp; Sort
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)]" />
              )}
            </Button>
            <button
              onClick={() => setAvailableOnly((v) => !v)}
              className={cn(
                "h-11 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5",
                availableOnly
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "bg-white border-slate-200 text-slate-600"
              )}
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  availableOnly ? "bg-emerald-500" : "bg-slate-300"
                )}
              />
              Available
            </button>
          </div>
        </div>

        {/* Mobile Filter Collapsible Panel */}
        {showMobileFilters && (
          <div className="md:hidden border-t border-slate-100 pt-3 space-y-3 animate-fade-in">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Branch Location
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none"
              >
                {branchOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none"
              >
                <option value="rating">Highest Rated</option>
                <option value="experience">Most Experienced</option>
                <option value="fee-asc">Fee: Low to High</option>
                <option value="fee-desc">Fee: High to Low</option>
                <option value="name">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Horizontal Scrolling Specialty Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {SPECIALIZATIONS.map((spec) => {
          const isSelected = selectedSpec === spec;
          return (
            <button
              key={spec}
              onClick={() => setSelectedSpec(spec)}
              className={cn(
                "shrink-0 px-4 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5",
                isSelected
                  ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-md shadow-blue-500/20"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <Stethoscope className={cn("w-3.5 h-3.5", isSelected ? "text-white" : "text-slate-400")} />
              {spec}
            </button>
          );
        })}
      </div>

      {/* Results Header & Active Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="text-sm text-slate-600">
          Showing{" "}
          <span className="font-bold text-slate-900">
            {filteredAndSortedDoctors.length}
          </span>{" "}
          specialist{filteredAndSortedDoctors.length !== 1 ? "s" : ""}
          {selectedSpec !== "All Specialties" && (
            <span>
              {" "}in <span className="font-semibold text-[var(--brand-primary)]">{selectedSpec}</span>
            </span>
          )}
          {selectedBranch !== "All Branches" && (
            <span>
              {" "}at <span className="font-semibold text-slate-800">{selectedBranch}</span>
            </span>
          )}
        </p>

        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear All Filters
          </button>
        )}
      </div>

      {/* Doctor Grid or Empty State */}
      {filteredAndSortedDoctors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAndSortedDoctors.map((doctor) => (
            <DoctorCard
              key={doctor.doctorId}
              doctor={doctor}
              onBook={setBookingDoctor}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[var(--brand-primary)] flex items-center justify-center mb-4">
            <Stethoscope className="w-8 h-8 text-[var(--brand-primary)]" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            No doctors match your criteria
          </h3>
          <p className="text-sm text-slate-500 max-w-md mb-6">
            We couldn't find any specialists matching your current search or filter combination.
            Try selecting a different specialty or resetting your search.
          </p>
          <Button
            onClick={handleResetFilters}
            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl h-10 px-5 text-sm font-semibold"
          >
            Reset All Filters
          </Button>
        </div>
      )}

      {/* Interactive Booking Modal */}
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
