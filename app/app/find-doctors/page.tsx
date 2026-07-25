"use client";

import React, { useState, useMemo } from "react";
import { doctors, Doctor } from "@/lib/mockData/doctors";
import { branches } from "@/lib/mockData/branches";
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
import { Appointment, VisitType } from "@/lib/mockData/appointments";

// ─── Constants ───────────────────────────────────────────────────────────────

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

const VISIT_TYPES: VisitType[] = [
  "General Checkup",
  "Consultation",
  "Follow-up",
  "New Patient",
  "Video Consultation",
];

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
];

function getNextDays(count: number) {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function getAvatarGradient(initials: string) {
  const gradients = [
    "from-teal-500 to-emerald-600",
    "from-blue-500 to-indigo-600",
    "from-violet-500 to-purple-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-teal-600",
  ];
  const idx = initials.charCodeAt(0) % gradients.length;
  return gradients[idx];
}

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

// ─── Booking Modal ────────────────────────────────────────────────────────────

type BookingStep = "datetime" | "details" | "confirm" | "success";

function ConfirmRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className={cn("text-sm font-semibold text-right", highlight ? "text-[var(--brand-primary)]" : "text-slate-800")}>
        {value}
      </span>
    </div>
  );
}

function BookingModal({
  doctor,
  onClose,
  currentUserId,
  currentUserName,
}: {
  doctor: Doctor;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
}) {
  const addAppointment = useAppointmentStore((s) => s.addAppointment);
  const availableDays = useMemo(() => getNextDays(7), []);
  const fullyBooked = doctor.fullyBookedDate;

  const [step, setStep] = useState<BookingStep>("datetime");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [visitType, setVisitType] = useState<VisitType>("General Checkup");
  const [notes, setNotes] = useState("");

  const dayFmt = (d: Date) =>
    d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const isFullyBooked = (d: Date) =>
    fullyBooked ? d.toISOString().startsWith(fullyBooked) : false;

  const STEPS: BookingStep[] = ["datetime", "details", "confirm"];

  function handleBook() {
    if (!selectedDay || !selectedTime) return;
    const [hh, mm] = selectedTime.split(":").map(Number);
    const dt = new Date(selectedDay);
    dt.setHours(hh, mm, 0, 0);

    const newAppt: Appointment = {
      appointmentId: `APT-${Date.now()}`,
      patientId: currentUserId,
      patientName: currentUserName,
      doctorId: doctor.doctorId,
      doctorName: doctor.name,
      doctorSpecialization: doctor.specialization,
      branchId: doctor.branchId,
      branchName: doctor.branchName,
      dateTime: dt.toISOString(),
      duration: 30,
      visitType,
      status: "Pending",
      paymentStatus: "Unpaid",
      source: "Booked",
      notes: notes || undefined,
    };

    addAppointment(newAppt);
    setStep("success");
  }

  const gradient = getAvatarGradient(doctor.avatar);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${gradient} p-6 text-white`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-lg">
              {doctor.avatar.replace(/[0-9]/g, "")}
            </div>
            <div>
              <h2 className="text-xl font-bold">{doctor.name}</h2>
              <p className="text-white/80 text-sm">{doctor.specialization}</p>
              <p className="text-white/70 text-xs mt-0.5">{doctor.branchName}</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-5">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    step === s
                      ? "bg-white text-[var(--brand-primary)]"
                      : STEPS.indexOf(step) > i || step === "success"
                      ? "bg-white/50 text-white"
                      : "bg-white/20 text-white/60"
                  )}
                >
                  {(STEPS.indexOf(step) > i || step === "success") && step !== s ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 2 && <div className="flex-1 h-0.5 bg-white/30 rounded-full" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Step 1 */}
          {step === "datetime" && (
            <div className="space-y-5">
              <h3 className="font-bold text-slate-900 text-lg">Select Date & Time</h3>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2 tracking-wide">Available Days</p>
                <div className="grid grid-cols-4 gap-2">
                  {availableDays.map((day) => {
                    const booked = isFullyBooked(day);
                    const selected = selectedDay?.toDateString() === day.toDateString();
                    return (
                      <button
                        key={day.toISOString()}
                        disabled={booked}
                        onClick={() => { setSelectedDay(day); setSelectedTime(null); }}
                        className={cn(
                          "flex flex-col items-center py-3 px-1 rounded-xl border text-xs font-semibold transition-all",
                          booked
                            ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                            : selected
                            ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white shadow-md"
                            : "border-slate-200 bg-white text-slate-700 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                        )}
                      >
                        <span className="text-[10px] uppercase opacity-70">
                          {day.toLocaleDateString("en-US", { weekday: "short" })}
                        </span>
                        <span className="text-base font-bold leading-tight">{day.getDate()}</span>
                        <span className="text-[10px] opacity-70">
                          {day.toLocaleDateString("en-US", { month: "short" })}
                        </span>
                        {booked && <span className="text-[9px] text-rose-400 mt-0.5">Full</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDay && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2 tracking-wide">
                    Time Slots — {dayFmt(selectedDay)}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_SLOTS.map((slot) => {
                      const selected = selectedTime === slot;
                      return (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={cn(
                            "py-2 rounded-xl border text-xs font-semibold transition-all",
                            selected
                              ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                          )}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <Button
                disabled={!selectedDay || !selectedTime}
                onClick={() => setStep("details")}
                className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl h-11 font-semibold disabled:opacity-40"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 2 */}
          {step === "details" && (
            <div className="space-y-5">
              <h3 className="font-bold text-slate-900 text-lg">Visit Details</h3>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
                  Visit Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {VISIT_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setVisitType(type)}
                      className={cn(
                        "py-2.5 px-3 rounded-xl border text-xs font-semibold text-left transition-all",
                        visitType === type
                          ? "border-[var(--brand-primary)] bg-teal-50 text-[var(--brand-primary)]"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
                  Additional Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe your symptoms or reason for visit..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 text-sm p-3 resize-none focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("datetime")}
                  className="flex-1 rounded-xl h-11 border-slate-200"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep("confirm")}
                  className="flex-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl h-11 font-semibold"
                >
                  Review
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === "confirm" && selectedDay && selectedTime && (
            <div className="space-y-5">
              <h3 className="font-bold text-slate-900 text-lg">Confirm Appointment</h3>
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
                <ConfirmRow label="Doctor" value={doctor.name} />
                <ConfirmRow label="Specialization" value={doctor.specialization} />
                <ConfirmRow label="Branch" value={doctor.branchName} />
                <ConfirmRow label="Date" value={dayFmt(selectedDay)} />
                <ConfirmRow label="Time" value={selectedTime} />
                <ConfirmRow label="Visit Type" value={visitType} />
                <ConfirmRow label="Consultation Fee" value={`$${doctor.consultationFee}`} highlight />
                {notes && <ConfirmRow label="Notes" value={notes} />}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("details")}
                  className="flex-1 rounded-xl h-11 border-slate-200"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <Button
                  onClick={handleBook}
                  className="flex-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl h-11 font-semibold"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  Confirm Booking
                </Button>
              </div>
            </div>
          )}

          {/* Success */}
          {step === "success" && (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-10 h-10 text-emerald-600 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Appointment Booked!</h3>
                <p className="text-slate-500 text-sm mt-1">
                  Your appointment with{" "}
                  <span className="font-semibold text-slate-700">{doctor.name}</span>{" "}
                  has been successfully scheduled.
                </p>
              </div>
              <div className="w-full bg-slate-50 rounded-2xl p-4 text-sm space-y-2 border border-slate-100">
                <p className="text-slate-500">
                  📅 <span className="font-semibold text-slate-800">{selectedDay && dayFmt(selectedDay)}</span>{" "}
                  at <span className="font-semibold text-slate-800">{selectedTime}</span>
                </p>
                <p className="text-slate-500">
                  🏥 <span className="font-semibold text-slate-800">{doctor.branchName}</span>
                </p>
                <p className="text-slate-500">
                  📋 Status:{" "}
                  <span className="font-semibold text-amber-600">Pending Confirmation</span>
                </p>
              </div>
              <Button
                onClick={onClose}
                className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white rounded-xl h-11 font-semibold"
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

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
