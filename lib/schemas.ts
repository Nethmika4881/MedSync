import { z } from "zod";

export const userLoginRoles = [
  "Admin",
  "FrontDesk",
  "Doctor",
  "Patient",
] as const;
export type UserLoginRole = (typeof userLoginRoles)[number];
export const baseSchema = z.object({
  // Personal
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  nic: z.string().min(1, "NIC is required"),
  email: z.string().email("Enter a valid email address"),
  phoneNumber: z.string().min(10, "Enter a valid phone number"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["Male", "Female", "Other"], {
    errorMap: () => ({ message: "Select a gender" }),
  }),

  // Address
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),

  branchId: z.string().uuid("Please select a valid branch"),

  // Patient-specific
  bloodGroup: z
    .enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"])
    .optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),

  // Auth
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
});

export const registerSchema = baseSchema
  .extend({
    role: z.literal("Patient"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export const staffDirectorySchema = z.object({
  search: z.string().trim().max(100).default(""),
  branchID: z.string().uuid().optional(),
  role: z.enum(["Doctor", "FrontDesk", "Admin"]).optional(),
  status: z.enum(["all", "active", "inactive"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type staffDirectoryType = z.infer<typeof staffDirectorySchema>;

export const createStaffSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(100),
    lastName: z.string().trim().min(1, "Last name is required").max(100),

    nic: z.string().trim().min(1, "NIC is required").max(20),
    email: z.string().trim().email("Enter a valid email address"),
    phone: z.string().trim().min(10, "Enter a valid phone number").max(20),

    gender: z.enum(["Male", "Female", "Other"]),
    dob: z.string().min(1, "Date of birth is required"),

    addressLine1: z.string().trim().min(1, "Address is required").max(100),
    addressLine2: z.string().trim().max(100).optional(),
    city: z.string().trim().min(1, "City is required").max(50),
    province: z.string().trim().max(50).optional(),
    postalCode: z.string().trim().max(10).optional(),
    country: z.string().trim().min(1).max(50).default("Sri Lanka"),

    branchID: z.string().uuid("Select a valid branch"),
    role: z.enum(["Admin", "FrontDesk", "Doctor"]),
    joinedDate: z.string().optional(),

    password: z.string().min(8, "Password must contain at least 8 characters"),
    confirmPassword: z.string(),

    medicalLicenceNo: z.string().trim().max(50).optional(),
    roomNo: z.string().trim().max(5).optional(),
    consultationFee: z.coerce.number().positive().optional(),
    yearsExperience: z.coerce.number().int().min(0).optional(),
    qualification: z.string().trim().max(150).optional(),
    specialization: z.string().trim().max(100).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => data.role !== "Doctor" || Boolean(data.medicalLicenceNo?.trim()),
    {
      message: "Medical licence number is required for doctors",
      path: ["medicalLicenceNo"],
    },
  )
  .refine(
    (data) => data.role !== "Doctor" || Boolean(data.specialization?.trim()),
    {
      message: "Specialization is required for doctors",
      path: ["specialization"],
    },
  );

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export const appointmentReportSchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date"),

    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date"),

    branchID: z.string().uuid("Invalid branch").optional(), //if not provided branch id then we report all branches hehe
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "Start date must be before or equal to end date",
    path: ["endDate"],
  });

export type AppointmentReportFilters = z.infer<typeof appointmentReportSchema>;
