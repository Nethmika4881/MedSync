import { z } from "zod";
export type Role = "Patient" | "Employee";

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

  // Doctor-specific
  specialization: z.string().optional(),
  joinedDate: z.string().optional(),
  medicalLicenceNo: z.string().optional(),
  consultationFee: z.coerce.number().optional(),
  yearsExperience: z.coerce.number().optional(),
  qualification: z.string().optional(),
  roomNo: z.string().optional(),
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

  // Employee role (only for employees)
  employeeRole: z.enum(["Doctor", "FrontDesk", "Admin"]).optional(),
});

export const registerSchema = baseSchema
  .extend({
    role: z.enum(["Patient", "Employee"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => data.role !== "Employee" || data.employeeRole !== undefined,
    {
      message: "Please select an employee role",
      path: ["employeeRole"],
    },
  )
  .refine(
    (data) => data.employeeRole === undefined || data.employeeRole === "Doctor",
    {
      message:
        "Admin and front desk accounts must be created by an administrator",
      path: ["employeeRole"],
    },
  )
  .refine(
    (data) =>
      data.role !== "Employee" || Boolean(data.medicalLicenceNo?.trim()),
    {
      message: "Medical licence number is required for doctors",
      path: ["medicalLicenceNo"],
    },
  );

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
