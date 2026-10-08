"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DAYS_OF_WEEK, type DayOfWeek, type DoctorScheduleSlot } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/catms/EmptyState";
import {
  AlertCircle, CalendarClock, CheckCircle2, Clock, KeyRound, MapPin, Pencil, Plus, Trash2, UserCog,
} from "lucide-react";
import { changeDoctorPassword, updateDoctorProfile } from "@/lib/actions/doctor-profile";
import { addScheduleSlot, removeScheduleSlot, updateScheduleSlot } from "@/lib/actions/doctor-schedule";
import { formatMoney } from "@/lib/doctorFormat";
import type { BranchOption, DoctorProfile } from "@/lib/doctorTypes";
import { cn } from "@/lib/utils";

interface SettingsProps {
  profile: DoctorProfile;
  schedule: DoctorScheduleSlot[];
  branches: BranchOption[];
}

type Notice = { type: "error" | "success"; text: string } | null;

function NoticeLine({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return (
    <p className={cn("flex items-center gap-2 text-sm rounded-lg px-3 py-2 border",
      notice.type === "error" ? "text-red-600 bg-red-50 border-red-100" : "text-emerald-700 bg-emerald-50 border-emerald-100")}>
      {notice.type === "error" ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
      {notice.text}
    </p>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-slate-900 mt-1">{value || "—"}</p>
    </div>
  );
}

export default function DoctorSettingsPage({ profile, schedule, branches }: SettingsProps) {
  const router = useRouter();

  //  Profile
  const [roomNo, setRoomNo] = useState(profile.roomNo);
  const [qualification, setQualification] = useState(profile.qualification);
  const [yearsExperience, setYearsExperience] = useState(profile.yearsExperience === null ? "" : String(profile.yearsExperience));
  const [phone, setPhone] = useState(profile.phone);
  const [isAvailable, setIsAvailable] = useState(profile.isAvailable);
  const [profileNotice, setProfileNotice] = useState<Notice>(null);
  const [profilePending, startProfile] = useTransition();

  function handleSaveProfile() {
    setProfileNotice(null);
    startProfile(async () => {
      const result = await updateDoctorProfile({
        roomNo,
        qualification,
        yearsExperience: yearsExperience.trim() === "" ? null : Number(yearsExperience),
        isAvailable,
        phone,
      });
      if (!result.ok) return setProfileNotice({ type: "error", text: result.error });
      setProfileNotice({ type: "success", text: "Profile updated." });
      router.refresh();
    });
  }

  //  Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordNotice, setPasswordNotice] = useState<Notice>(null);
  const [passwordPending, startPassword] = useTransition();
  function handleChangePassword() {
    setPasswordNotice(null);
    if (newPassword !== confirmPassword) {
      return setPasswordNotice({ type: "error", text: "New password and confirmation don't match." });
    }
    startPassword(async () => {
      const result = await changeDoctorPassword({ currentPassword, newPassword });
      if (!result.ok) return setPasswordNotice({ type: "error", text: result.error });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordNotice({ type: "success", text: "Password changed." });
    });
  }

  //  Working hours
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>("Monday");
  const [branchId, setBranchId] = useState(branches[0]?.branchId ?? "");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [slotDuration, setSlotDuration] = useState(15);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [scheduleNotice, setScheduleNotice] = useState<Notice>(null);
  const [slotPending, startSlot] = useTransition();

  function openAddDialog() {
    setEditingId(null);
    setDayOfWeek("Monday");
    setBranchId(branches[0]?.branchId ?? "");
    setStartTime("09:00");
    setEndTime("17:00");
    setSlotDuration(15);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(slot: DoctorScheduleSlot) {
    setEditingId(slot.scheduleId);
    setDayOfWeek(slot.dayOfWeek);
    setBranchId(slot.branchId);
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
    setSlotDuration(slot.slotDurationMinutes);
    setFormError(null);
    setDialogOpen(true);
  }

  function handleSaveSlot() {
    if (!branchId) return setFormError("Choose a branch.");
    if (startTime >= endTime) return setFormError("End time must be after start time.");

    // Friendly pre-check; the database trigger is the real guard.
    const overlap = schedule.some(
      (s) => s.scheduleId !== editingId && s.dayOfWeek === dayOfWeek && startTime < s.endTime && endTime > s.startTime
    );
    if (overlap) return setFormError("This overlaps with an existing slot on that day (any branch).");

    const slot = { branchId, dayOfWeek, startTime, endTime, slotDurationMinutes: slotDuration };
    setFormError(null);
    startSlot(async () => {
      const result = editingId ? await updateScheduleSlot(editingId, slot) : await addScheduleSlot(slot);
      if (!result.ok) return setFormError(result.error);
      setDialogOpen(false);
      setScheduleNotice(null);
      router.refresh();
    });
  }

  function handleRemoveSlot(slot: DoctorScheduleSlot) {
    if (!confirm(`Remove ${slot.dayOfWeek} ${slot.startTime}–${slot.endTime} at ${slot.branchName}?`)) return;
    setScheduleNotice(null);
    startSlot(async () => {
      const result = await removeScheduleSlot(slot.scheduleId);
      if (!result.ok) return setScheduleNotice({ type: "error", text: result.error });
      router.refresh();
    });
  }

  const slotsByDay = DAYS_OF_WEEK.reduce(
    (acc, day) => ({
      ...acc,
      [day]: schedule.filter((s) => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }),
    {} as Record<DayOfWeek, DoctorScheduleSlot[]>
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h2>
        <p className="text-slate-500">Your profile, password and weekly working hours.</p>
      </div>

      {/* Profile */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <UserCog className="w-4 h-4 text-slate-400" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <ReadOnlyField label="Name" value={profile.fullName} />
            <ReadOnlyField label="Email" value={profile.email} />
            <ReadOnlyField label="Licence No." value={profile.licenceNo} />
            <ReadOnlyField label="Branch" value={profile.branchName} />
            <ReadOnlyField label="Specializations" value={profile.specializations} />
            <ReadOnlyField label="Consultation Fee" value={formatMoney(profile.consultationFee)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="space-y-1.5">
              <Label htmlFor="room">Room No.</Label>
              <Input id="room" value={roomNo} maxLength={5} onChange={(e) => setRoomNo(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} maxLength={20} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qualification">Qualification</Label>
              <Input id="qualification" value={qualification} maxLength={150} onChange={(e) => setQualification(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="years">Years of Experience</Label>
              <Input id="years" type="number" min={0} max={70} value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
            />
            Accepting new appointments
          </label>

          <NoticeLine notice={profileNotice} />
          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={profilePending}
              className="rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)]">
              {profilePending ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-slate-400" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" autoComplete="current-password" value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" autoComplete="new-password" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <NoticeLine notice={passwordNotice} />
          <div className="flex justify-end">
            <Button onClick={handleChangePassword} disabled={passwordPending || !currentPassword || !newPassword}
              className="rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)]">
              {passwordPending ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Working hours */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Working Hours &amp; Branch Allocation</h3>
            <p className="text-sm text-slate-500">
              Set your recurring weekly availability per branch. This drives the time slots patients can book.
            </p>
          </div>
          <Button onClick={openAddDialog} className="rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)]">
            <Plus className="w-4 h-4 mr-2" /> Add Working Hours
          </Button>
        </div>

        <NoticeLine notice={scheduleNotice} />

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Working Hours Slot" : "Add Working Hours Slot"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="day">Day of Week</Label>
                <Select value={dayOfWeek} onValueChange={(v) => setDayOfWeek(v as DayOfWeek)}>
                  <SelectTrigger id="day" className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (<SelectItem key={day} value={day}>{day}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="branch">Branch</Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger id="branch" className="mt-1.5"><SelectValue placeholder="Select a branch" /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (<SelectItem key={b.branchId} value={b.branchId}>{b.branchName}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="start">Start Time</Label>
                  <Input id="start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="end">End Time</Label>
                  <Input id="end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1.5" />
                </div>
              </div>

              <div>
                <Label htmlFor="duration">Slot Duration (minutes)</Label>
                <Select value={String(slotDuration)} onValueChange={(v) => setSlotDuration(Number(v))}>
                  <SelectTrigger id="duration" className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[10, 15, 20, 30, 45, 60].map((mins) => (<SelectItem key={mins} value={String(mins)}>{mins} minutes</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              {formError && (
                <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-lg">Cancel</Button>
              <Button onClick={handleSaveSlot} disabled={slotPending} className="rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)]">
                {slotPending ? "Saving..." : "Save Slot"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {schedule.length === 0 ? (
          <Card className="border-slate-200 shadow-sm">
            <EmptyState
              icon={CalendarClock}
              title="No working hours set yet"
              description="Add your first weekly availability slot to start appearing in patient bookings."
              className="py-16"
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {DAYS_OF_WEEK.filter((day) => slotsByDay[day].length > 0).map((day) => (
              <Card key={day} className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" /> {day}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {slotsByDay[day].map((slot) => (
                      <div key={slot.scheduleId} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="text-sm font-semibold text-slate-900">{slot.startTime} – {slot.endTime}</span>
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                            <MapPin className="w-3 h-3" /> {slot.branchName}
                          </span>
                          <span className="text-xs text-slate-400">{slot.slotDurationMinutes}-min slots</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" disabled={slotPending}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-[var(--brand-primary)] hover:bg-blue-50 rounded-lg"
                            onClick={() => openEditDialog(slot)} title="Edit slot">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" disabled={slotPending}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            onClick={() => handleRemoveSlot(slot)} title="Remove slot">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
