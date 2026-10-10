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
import { formatDay, formatMoney } from "@/lib/doctorFormat";
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

type ProfileForm = {
  fullName: string;
  email: string;
  nic: string;
  dob: string;
  gender: string;
  phone: string;
  licenceNo: string;
  specialization: string;
  branchId: string;
  consultationFee: string;
  roomNo: string;
  qualification: string;
  yearsExperience: string;
  isAvailable: boolean;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
};

function toForm(p: DoctorProfile): ProfileForm {
  return {
    fullName: p.fullName,
    email: p.email,
    nic: p.nic,
    dob: p.dob,
    gender: p.gender,
    phone: p.phone,
    licenceNo: p.licenceNo,
    specialization: p.specializations,
    branchId: p.branchId,
    consultationFee: String(p.consultationFee),
    roomNo: p.roomNo,
    qualification: p.qualification,
    yearsExperience: p.yearsExperience === null ? "" : String(p.yearsExperience),
    isAvailable: p.isAvailable,
    addressLine1: p.addressLine1,
    addressLine2: p.addressLine2,
    city: p.city,
    province: p.province,
    postalCode: p.postalCode,
  };
}

function TextField({
  id, label, value, onChange, type = "text", maxLength, className,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  type?: string; maxLength?: number; className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export default function DoctorSettingsPage({ profile, schedule, branches }: SettingsProps) {
  const router = useRouter();

  //  Profile
  const [form, setForm] = useState<ProfileForm>(() => toForm(profile));
  const [profileNotice, setProfileNotice] = useState<Notice>(null);
  const [profilePending, startProfile] = useTransition();
  const [editing, setEditing] = useState(false);

  const setField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function startEditing() {
    setProfileNotice(null);
    setEditing(true);
  }

  // Throw away unsaved changes and show the saved values again.
  function cancelEditing() {
    setForm(toForm(profile));
    setProfileNotice(null);
    setEditing(false);
  }

  function handleSaveProfile() {
    setProfileNotice(null);
    const fee = form.consultationFee.trim() === "" ? Number.NaN : Number(form.consultationFee);
    startProfile(async () => {
      const result = await updateDoctorProfile({
        fullName: form.fullName,
        email: form.email,
        nic: form.nic,
        dob: form.dob,
        gender: form.gender as "Male" | "Female" | "Other",
        licenceNo: form.licenceNo,
        specialization: form.specialization,
        branchId: form.branchId,
        consultationFee: fee,
        roomNo: form.roomNo,
        qualification: form.qualification,
        yearsExperience: form.yearsExperience.trim() === "" ? null : Number(form.yearsExperience),
        isAvailable: form.isAvailable,
        phone: form.phone,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        province: form.province,
        postalCode: form.postalCode,
      });
      if (!result.ok) return setProfileNotice({ type: "error", text: result.error });
      setProfileNotice({ type: "success", text: "Profile updated." });
      setEditing(false);
      router.refresh();
    });
  }

  //  Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordNotice, setPasswordNotice] = useState<Notice>(null);
  const [passwordPending, startPassword] = useTransition();
  const [changingPassword, setChangingPassword] = useState(false);

  function cancelPasswordChange() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordNotice(null);
    setChangingPassword(false);
  }
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
      setChangingPassword(false);
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
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <UserCog className="w-4 h-4 text-slate-400" /> Profile
            </CardTitle>
            {!editing && (
              <Button variant="outline" size="sm" onClick={startEditing} className="rounded-lg">
                <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {editing ? (
            <>
              <div className="space-y-4">
                <p className="text-sm font-semibold text-slate-900">Personal</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField id="fullName" label="Full Name" value={form.fullName} maxLength={255} onChange={(v) => setField("fullName", v)} />
                  <TextField id="email" label="Email" type="email" value={form.email} maxLength={255} onChange={(v) => setField("email", v)} />
                  <TextField id="nic" label="NIC" value={form.nic} maxLength={20} onChange={(v) => setField("nic", v)} />
                  <TextField id="dob" label="Date of Birth" type="date" value={form.dob} onChange={(v) => setField("dob", v)} />
                  <div className="space-y-1.5">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={form.gender} onValueChange={(v) => setField("gender", v)}>
                      <SelectTrigger id="gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        {["Male", "Female", "Other"].map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <TextField id="phone" label="Phone" value={form.phone} maxLength={20} onChange={(v) => setField("phone", v)} />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <p className="text-sm font-semibold text-slate-900">Professional</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField id="licence" label="Medical Licence No." value={form.licenceNo} maxLength={50} onChange={(v) => setField("licenceNo", v)} />
                  <TextField id="specialization" label="Specialization" value={form.specialization} maxLength={100} onChange={(v) => setField("specialization", v)} />
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-branch">Branch</Label>
                    <Select value={form.branchId} onValueChange={(v) => setField("branchId", v)}>
                      <SelectTrigger id="profile-branch"><SelectValue placeholder="Select a branch" /></SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => (<SelectItem key={b.branchId} value={b.branchId}>{b.branchName}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <TextField id="fee" label="Consultation Fee (Rs.)" type="number" value={form.consultationFee} onChange={(v) => setField("consultationFee", v)} />
                  <TextField id="room" label="Room No." value={form.roomNo} maxLength={5} onChange={(v) => setField("roomNo", v)} />
                  <TextField id="years" label="Years of Experience" type="number" value={form.yearsExperience} onChange={(v) => setField("yearsExperience", v)} />
                  <TextField id="qualification" label="Qualification" value={form.qualification} maxLength={150} className="sm:col-span-2" onChange={(v) => setField("qualification", v)} />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                    checked={form.isAvailable}
                    onChange={(e) => setField("isAvailable", e.target.checked)}
                  />
                  Accepting new appointments
                </label>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <p className="text-sm font-semibold text-slate-900">Address</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField id="address1" label="Address Line 1" value={form.addressLine1} maxLength={100} className="sm:col-span-2" onChange={(v) => setField("addressLine1", v)} />
                  <TextField id="address2" label="Address Line 2" value={form.addressLine2} maxLength={100} className="sm:col-span-2" onChange={(v) => setField("addressLine2", v)} />
                  <TextField id="city" label="City" value={form.city} maxLength={50} onChange={(v) => setField("city", v)} />
                  <TextField id="province" label="Province" value={form.province} maxLength={50} onChange={(v) => setField("province", v)} />
                  <TextField id="postal" label="Postal Code" value={form.postalCode} maxLength={10} onChange={(v) => setField("postalCode", v)} />
                </div>
              </div>

              <NoticeLine notice={profileNotice} />
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={cancelEditing} disabled={profilePending} className="rounded-xl">
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={profilePending}
                  className="rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)]">
                  {profilePending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <p className="text-sm font-semibold text-slate-900">Personal</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <ReadOnlyField label="Name" value={form.fullName} />
                  <ReadOnlyField label="Email" value={form.email} />
                  <ReadOnlyField label="Phone" value={form.phone} />
                  <ReadOnlyField label="NIC" value={form.nic} />
                  <ReadOnlyField label="Date of Birth" value={form.dob ? formatDay(form.dob) : ""} />
                  <ReadOnlyField label="Gender" value={form.gender} />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <p className="text-sm font-semibold text-slate-900">Professional</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <ReadOnlyField label="Licence No." value={form.licenceNo} />
                  <ReadOnlyField label="Specialization" value={form.specialization} />
                  <ReadOnlyField label="Branch" value={branches.find((b) => b.branchId === form.branchId)?.branchName ?? profile.branchName} />
                  <ReadOnlyField label="Consultation Fee" value={form.consultationFee === "" ? "" : formatMoney(Number(form.consultationFee))} />
                  <ReadOnlyField label="Room No." value={form.roomNo} />
                  <ReadOnlyField label="Years of Experience" value={form.yearsExperience === "" ? "" : `${form.yearsExperience} years`} />
                  <ReadOnlyField label="Qualification" value={form.qualification} />
                  <ReadOnlyField label="Availability" value={form.isAvailable ? "Accepting new appointments" : "Not accepting new appointments"} />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <ReadOnlyField
                  label="Address"
                  value={[form.addressLine1, form.addressLine2, form.city, form.province, form.postalCode].filter(Boolean).join(", ")}
                />
              </div>
              <NoticeLine notice={profileNotice} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-slate-400" /> Password
            </CardTitle>
            {!changingPassword && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPasswordNotice(null);
                  setChangingPassword(true);
                }}
                className="rounded-lg"
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" /> Change
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {changingPassword ? (
            <>
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
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={cancelPasswordChange} disabled={passwordPending} className="rounded-xl">
                  Cancel
                </Button>
                <Button onClick={handleChangePassword} disabled={passwordPending || !currentPassword || !newPassword}
                  className="rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)]">
                  {passwordPending ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-500">Use a strong password that you do not use anywhere else.</p>
              <NoticeLine notice={passwordNotice} />
            </>
          )}
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
