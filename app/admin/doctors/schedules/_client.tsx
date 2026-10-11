"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  CalendarClock,
  Clock,
  MapPin,
  Pencil,
  Plus,
  Stethoscope,
  Trash2,
  Users,
} from "lucide-react";
import {
  addAdminDoctorSchedule,
  removeAdminDoctorSchedule,
  updateAdminDoctorSchedule,
  type AdminDoctorScheduleData,
} from "@/lib/actions/admin-doctor-schedules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/catms/EmptyState";
import { DAYS_OF_WEEK, type DayOfWeek, type DoctorScheduleSlot } from "@/lib/types";
import { cn, getAvatarColor, getInitials } from "@/lib/utils";

interface ScheduleForm {
  branchId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  slotDurationMinutes: string;
}

const EMPTY_FORM: ScheduleForm = {
  branchId: "",
  dayOfWeek: "Monday",
  startTime: "09:00",
  endTime: "12:00",
  slotDurationMinutes: "15",
};

function calculateAppointments(slot: DoctorScheduleSlot): number {
  const [startHour, startMinute] = slot.startTime.split(":").map(Number);
  const [endHour, endMinute] = slot.endTime.split(":").map(Number);
  const totalMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);

  return Math.max(1, Math.floor(totalMinutes / slot.slotDurationMinutes));
}

function displayDoctorName(name: string): string {
  return name.toLowerCase().startsWith("dr.") ? name : `Dr. ${name}`;
}

export default function SchedulesPage({
  doctors,
  branches,
  schedules,
}: AdminDoctorScheduleData) {
  const router = useRouter();
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.doctorId ?? "");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<DoctorScheduleSlot | null>(null);
  const [form, setForm] = useState<ScheduleForm>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedDoctor = doctors.find((doctor) => doctor.doctorId === selectedDoctorId) ?? null;
  const selectedSchedules = schedules.filter((slot) => slot.doctorId === selectedDoctorId);

  function setField<K extends keyof ScheduleForm>(key: K, value: ScheduleForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openAddDialog() {
    if (!selectedDoctor) return;

    const defaultBranch =
      branches.find((branch) => branch.branchId === selectedDoctor.branchId)?.branchId ??
      branches[0]?.branchId ??
      "";

    setEditingSlot(null);
    setForm({ ...EMPTY_FORM, branchId: defaultBranch });
    setFormError("");
    setDialogOpen(true);
  }

  function openEditDialog(slot: DoctorScheduleSlot) {
    setEditingSlot(slot);
    setForm({
      branchId: slot.branchId,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      slotDurationMinutes: String(slot.slotDurationMinutes),
    });
    setFormError("");
    setDialogOpen(true);
  }

  function handleSave() {
    if (!selectedDoctor) return;

    if (!form.branchId) {
      setFormError("Please select a branch.");
      return;
    }

    const slotDurationMinutes = Number(form.slotDurationMinutes);
    setFormError("");

    startTransition(async () => {
      const slot = {
        branchId: form.branchId,
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        slotDurationMinutes,
      };

      const result = editingSlot
        ? await updateAdminDoctorSchedule(
            selectedDoctor.doctorId,
            editingSlot.scheduleId,
            slot,
          )
        : await addAdminDoctorSchedule(selectedDoctor.doctorId, slot);

      if (!result.ok) {
        setFormError(result.error);
        return;
      }

      setDialogOpen(false);
      toast.success(editingSlot ? "Working hours updated." : "Working hours added.");
      router.refresh();
    });
  }

  function handleRemove(slot: DoctorScheduleSlot) {
    if (!selectedDoctor) return;

    const confirmed = window.confirm(
      `Remove the ${slot.dayOfWeek} period from ${slot.startTime} to ${slot.endTime}?`,
    );

    if (!confirmed) return;

    startTransition(async () => {
      const result = await removeAdminDoctorSchedule(
        selectedDoctor.doctorId,
        slot.scheduleId,
      );

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Working hours removed.");
      router.refresh();
    });
  }

  if (doctors.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Doctor Schedules</h2>
          <p className="text-sm text-slate-500">
            Manage recurring weekly working hours for active doctors.
          </p>
        </div>
        <Card className="border-slate-200 shadow-sm">
          <EmptyState
            icon={Stethoscope}
            title="No active doctors found"
            description="Add or activate a doctor before creating weekly working hours."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Doctor Schedules</h2>
          <p className="text-sm text-slate-500">
            Manage weekly working hours that patients can book.
          </p>
        </div>
        <Button
          onClick={openAddDialog}
          disabled={!selectedDoctor || branches.length === 0}
          className="min-h-11 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)]"
        >
          <Plus aria-hidden="true" /> Add Working Hours
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <section className="space-y-3" aria-labelledby="doctor-list-heading">
          <h3
            id="doctor-list-heading"
            className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400"
          >
            Select Doctor
          </h3>
          <div className="max-h-[38rem] space-y-2 overflow-y-auto pr-1 custom-scrollbar">
            {doctors.map((doctor) => {
              const selected = doctor.doctorId === selectedDoctorId;

              return (
                <button
                  type="button"
                  key={doctor.doctorId}
                  onClick={() => setSelectedDoctorId(doctor.doctorId)}
                  aria-pressed={selected}
                  className={cn(
                    "flex min-h-14 w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2",
                    selected
                      ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white shadow-md"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      selected ? "bg-white/20 text-white" : getAvatarColor(doctor.name),
                    )}
                    aria-hidden="true"
                  >
                    {getInitials(doctor.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{displayDoctorName(doctor.name)}</p>
                    <p className={cn("truncate text-xs", selected ? "text-white/75" : "text-slate-500")}>
                      {doctor.specialization}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4 lg:col-span-3" aria-labelledby="selected-doctor-heading">
          {selectedDoctor && (
            <>
              <Card className="overflow-hidden border-slate-200 shadow-sm">
                <div className="h-2 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)]" />
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <div
                    className={cn(
                      "flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-bold",
                      getAvatarColor(selectedDoctor.name),
                    )}
                    aria-hidden="true"
                  >
                    {getInitials(selectedDoctor.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 id="selected-doctor-heading" className="text-lg font-bold text-slate-900">
                      {displayDoctorName(selectedDoctor.name)}
                    </h3>
                    <p className="text-sm font-semibold text-[var(--brand-primary)]">
                      {selectedDoctor.specialization}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      {selectedDoctor.branchName}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3 text-left sm:text-right">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Consultation fee
                    </p>
                    <p className="mt-1 font-bold text-slate-900">
                      Rs. {selectedDoctor.consultationFee.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-2 px-1 text-xs text-slate-500 sm:flex-row sm:gap-5">
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="h-4 w-4" aria-hidden="true" />
                  Weekly hours repeat automatically
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  Appointment count is based on the selected duration
                </span>
              </div>

              {branches.length === 0 && (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  No active branches are available. Activate a branch before adding working hours.
                </p>
              )}

              {selectedSchedules.length === 0 ? (
                <Card className="border-slate-200 shadow-sm">
                  <EmptyState
                    icon={CalendarClock}
                    title="No working hours set"
                    description={`Add the first weekly working period for ${displayDoctorName(selectedDoctor.name)}.`}
                    action={
                      <Button
                        onClick={openAddDialog}
                        disabled={branches.length === 0}
                        className="min-h-11 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)]"
                      >
                        <Plus aria-hidden="true" /> Add Working Hours
                      </Button>
                    }
                  />
                </Card>
              ) : (
                <div className="space-y-4">
                  {DAYS_OF_WEEK.filter((day) =>
                    selectedSchedules.some((slot) => slot.dayOfWeek === day),
                  ).map((day) => (
                    <Card key={day} className="border-slate-200 shadow-sm">
                      <CardHeader className="border-b border-slate-100 pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <Clock className="h-4 w-4 text-slate-400" aria-hidden="true" />
                          {day}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="divide-y divide-slate-100 p-0">
                        {selectedSchedules
                          .filter((slot) => slot.dayOfWeek === day)
                          .map((slot) => (
                            <div
                              key={slot.scheduleId}
                              className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="grid flex-1 grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                                <div>
                                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Branch</p>
                                  <p className="mt-1 font-semibold text-slate-800">{slot.branchName}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Time</p>
                                  <p className="mt-1 font-semibold text-slate-800">
                                    {slot.startTime} to {slot.endTime}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Appointments</p>
                                  <p className="mt-1 font-semibold text-slate-800">
                                    {calculateAppointments(slot)} at {slot.slotDurationMinutes} minutes each
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2 sm:shrink-0">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(slot)}
                                  disabled={isPending}
                                  className="min-h-11 rounded-lg border-slate-200"
                                >
                                  <Pencil aria-hidden="true" /> Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemove(slot)}
                                  disabled={isPending}
                                  className="min-h-11 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                  <Trash2 aria-hidden="true" /> Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSlot ? "Edit Working Hours" : "Add Working Hours"}</DialogTitle>
            <DialogDescription>
              Set one recurring weekly period. Overlapping periods are not allowed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="schedule-day">Day of Week</Label>
              <Select
                value={form.dayOfWeek}
                onValueChange={(value) => setField("dayOfWeek", value as DayOfWeek)}
              >
                <SelectTrigger id="schedule-day" className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="schedule-branch">Branch</Label>
              <Select value={form.branchId} onValueChange={(value) => setField("branchId", value)}>
                <SelectTrigger id="schedule-branch" className="min-h-11">
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.branchId} value={branch.branchId}>
                      {branch.branchName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="schedule-start">Start Time</Label>
                <Input
                  id="schedule-start"
                  type="time"
                  value={form.startTime}
                  onChange={(event) => setField("startTime", event.target.value)}
                  className="min-h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="schedule-end">End Time</Label>
                <Input
                  id="schedule-end"
                  type="time"
                  value={form.endTime}
                  onChange={(event) => setField("endTime", event.target.value)}
                  className="min-h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="schedule-duration">Appointment Duration</Label>
              <Select
                value={form.slotDurationMinutes}
                onValueChange={(value) => setField("slotDurationMinutes", value)}
              >
                <SelectTrigger id="schedule-duration" className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20, 30, 45, 60, 90, 120].map((minutes) => (
                    <SelectItem key={minutes} value={String(minutes)}>
                      {minutes} minutes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formError && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {formError}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
              className="min-h-11 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="min-h-11 rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)]"
            >
              {isPending ? "Saving..." : editingSlot ? "Save Changes" : "Add Working Hours"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
