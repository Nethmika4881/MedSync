import { z } from "zod";
import { DAYS_OF_WEEK } from "@/lib/types";

const uuid = z.string().uuid("Invalid id");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must look like 09:30");

export const appointmentIdSchema = uuid;

export const saveConsultationSchema = z.object({
  appointmentId: uuid,
  symptoms: z.string().max(4000, "Symptoms are too long"),
  diagnosis: z.string().max(2000, "Diagnosis is too long"),
  notes: z.string().max(4000, "Notes are too long"),
  followUpRequired: z.boolean(),
  followUpDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Follow-up date is invalid")
    .optional(),
  treatments: z
    .array(
      z.object({
        treatmentServiceCode: uuid,
        quantity: z.number().int("Quantity must be a whole number").min(1, "Quantity must be at least 1").max(100),
      })
    )
    .max(50, "Too many treatments"),
  prescriptions: z
    .array(
      z.object({
        medicationId: uuid,
        dosage: z.string().trim().min(1, "Every prescription needs a dosage").max(50, "Dosage is too long"),
        frequency: z.string().trim().max(50, "Frequency is too long"),
        durationDays: z
          .number()
          .int("Duration must be a whole number of days")
          .min(1, "Every prescription needs a duration of at least 1 day")
          .max(365, "Duration can't be more than 365 days"),
        notes: z.string().trim().max(255, "Prescription notes are too long"),
        allergyChecked: z.boolean(),
      })
    )
    .max(50, "Too many prescriptions"),
});

export const scheduleSlotSchema = z
  .object({
    branchId: uuid,
    dayOfWeek: z.enum(DAYS_OF_WEEK as [string, ...string[]]),
    startTime: time,
    endTime: time,
    slotDurationMinutes: z.number().int().min(5, "Slots must be at least 5 minutes").max(120, "Slots can't be longer than 120 minutes"),
  })
  .refine((v) => v.startTime < v.endTime, {
    message: "End time must be after start time.",
    path: ["endTime"],
  });

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(255, "Full name is too long"),
  email: z.string().trim().email("Enter a valid email address").max(255, "Email is too long"),
  nic: z.string().trim().min(1, "NIC is required").max(20, "NIC can be at most 20 characters"),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth is invalid")
    .refine((v) => v <= new Date().toISOString().slice(0, 10), "Date of birth must be in the past"),
  gender: z.enum(["Male", "Female", "Other"], { errorMap: () => ({ message: "Select a gender" }) }),
  licenceNo: z.string().trim().min(1, "Medical licence number is required").max(50, "Licence number is too long"),
  specialization: z.string().trim().max(250, "Specializations are too long"),
  branchId: uuid,
  consultationFee: z
    .number({ invalid_type_error: "Enter the consultation fee" })
    .min(0, "Consultation fee can't be negative")
    .max(1000000, "Consultation fee looks too high"),
  roomNo: z.string().trim().max(5, "Room number can be at most 5 characters"),
  qualification: z.string().trim().max(150, "Qualification is too long"),
  yearsExperience: z
    .number()
    .int("Experience must be a whole number of years")
    .min(0, "Experience can't be negative")
    .max(70, "Experience looks too high")
    .nullable(),
  isAvailable: z.boolean(),
  phone: z
    .string()
    .trim()
    .max(20, "Phone number is too long")
    .regex(/^[0-9+\-\s()]*$/, "Phone number can only contain digits, spaces, + - ( )"),
  addressLine1: z.string().trim().min(1, "Address line 1 is required").max(100, "Address line 1 is too long"),
  addressLine2: z.string().trim().max(100, "Address line 2 is too long"),
  city: z.string().trim().min(1, "City is required").max(50, "City is too long"),
  province: z.string().trim().max(50, "Province is too long"),
  postalCode: z.string().trim().max(10, "Postal code can be at most 10 characters"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password").max(200),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(200, "New password is too long"),
});
