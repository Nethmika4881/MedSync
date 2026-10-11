"use server";
// lib/actions/doctors.ts
// Patient-facing doctor directory queries.
// Uses only the actual migration-defined schema (V3, V4, V5).
// No schema was modified to support this file.
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import db from "@/lib/db";
export interface AdminDoctorProfile {
  doctorId: string;
  name: string;
  email: string;
  phone: string;
  nic: string;
  gender: string;
  dateOfBirth: string;
  branchId: string;
  branchName: string;
  medicalLicenceNo: string;
  specialization: string;
  roomNo: string;
  consultationFee: number;
  yearsExperience: number;
  qualification: string;
  isActive: boolean;
  isAvailable: boolean;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  avatar: string;
}
const doctorIdSchema = z.string().uuid();
export interface DoctorDirectoryItem {
  doctorId: string;
  name: string;
  specialization: string; // first specialization title, or "General Practice" fallback
  consultationFee: number;
  experience: number; // years_experience (nullable → 0)
  branchId: string;
  branchName: string;
  education: string; // qualification column
  isAvailable: boolean;
  avatar: string; // initials derived from full_name
  // Fields NOT in schema — hardcoded safe defaults so existing DoctorCard renders
  rating: number;
  reviewCount: number;
  bio: string;
  phone: string;
  email: string;
}

export interface BranchOption {
  branchId: string;
  name: string;
}

export interface SpecializationOption {
  title: string;
}

/**
 * Returns all active doctors joined with their primary branch,
 * first specialization, and display fields derived from app_user.
 *
 * availability filter: doctor.is_available (the doctor's own availability flag —
 * NOT appointment-slot availability, which would require checking time_slot capacity.
 * The schema supports slot-level availability via time_slot.max_tickets vs
 * COUNT(appointment) but that query is out of scope for a directory listing).
 */
export async function getDoctorDirectory(): Promise<DoctorDirectoryItem[]> {
  const { rows } = await db.query(`
    SELECT
      d.doctor_id                         AS "doctorId",
      u.full_name                         AS "name",
      UPPER(LEFT(u.full_name, 2))         AS "avatar",
      COALESCE(s.title, 'General Practice') AS "specialization",
      d.consultation_fee                  AS "consultationFee",
      COALESCE(d.years_experience, 0)     AS "experience",
      e.branch_id                         AS "branchId",
      b.branch_name                       AS "branchName",
      COALESCE(d.qualification, '')       AS "education",
      d.is_available                      AS "isAvailable",
      u.email                             AS "email"
    FROM doctor d
    JOIN employee  e ON e.employee_id = d.doctor_id
    JOIN app_user  u ON u.user_id     = e.employee_id
    JOIN branch    b ON b.branch_id   = e.branch_id
    -- Left join: a doctor with no specialization still appears
    LEFT JOIN doctor_specialization ds ON ds.doctor_id = d.doctor_id
    LEFT JOIN specialization        s  ON s.specialization_id = ds.specialization_id
    WHERE e.is_active = true
      AND d.is_available IS NOT NULL
    -- One row per doctor — take first specialization alphabetically
    ORDER BY u.full_name ASC, s.title ASC NULLS LAST
  `);

  // Deduplicate: keep only the first row per doctor (first spec alphabetically)
  const seen = new Set<string>();
  const deduped: DoctorDirectoryItem[] = [];
  for (const row of rows) {
    if (!seen.has(row.doctorId)) {
      seen.add(row.doctorId);
      deduped.push({
        ...row,
        // These fields do not exist in the current schema.
        // Safe neutral defaults preserve the existing DoctorCard layout.
        rating: 0,
        reviewCount: 0,
        bio: "",
        phone: "",
      });
    }
  }
  return deduped;
}

/**
 * Returns all active branches for the branch filter dropdown.
 * Source: branch table (V3).
 */
export async function getBranchOptions(): Promise<BranchOption[]> {
  const { rows } = await db.query(`
    SELECT branch_id AS "branchId", branch_name AS "name"
    FROM branch
    WHERE is_active = true
    ORDER BY branch_name ASC
  `);
  return rows as BranchOption[];
}

/**
 * Returns all specializations that at least one active doctor holds.
 * Source: specialization + doctor_specialization + doctor + employee (V3).
 */
export async function getSpecializationOptions(): Promise<
  SpecializationOption[]
> {
  const { rows } = await db.query(`
    SELECT DISTINCT s.title
    FROM specialization s
    JOIN doctor_specialization ds ON ds.specialization_id = s.specialization_id
    JOIN doctor   d ON d.doctor_id   = ds.doctor_id
    JOIN employee e ON e.employee_id = d.doctor_id
    WHERE e.is_active = true
    ORDER BY s.title ASC
  `);
  return rows as SpecializationOption[];
}

export async function getAdminDoctorById(
  unsafeDoctorId: unknown,
): Promise<AdminDoctorProfile | null> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?clear=1");
  }

  if (currentUser.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const parsedDoctorId = doctorIdSchema.safeParse(unsafeDoctorId);

  if (!parsedDoctorId.success) {
    return null;
  }

  const result = await db.query(
    `
    select
      profile.doctor_id as "doctorId",
      profile.full_name as "name",
      profile.email,
      coalesce(profile.phone, '') as "phone",
      profile.nic,
      coalesce(profile.gender, '') as "gender",
      coalesce(to_char(profile.dob, 'YYYY-MM-DD'), '') as "dateOfBirth",
      profile.branch_id as "branchId",
      profile.branch_name as "branchName",
      profile.medical_licence_no as "medicalLicenceNo",
      coalesce(
        profile.specializations,
        'General Practice'
      ) as "specialization",
      coalesce(profile.room_no, '') as "roomNo",
      profile.consultation_fee as "consultationFee",
      coalesce(profile.years_experience, 0) as "yearsExperience",
      coalesce(profile.qualification, '') as "qualification",
      employee.is_active as "isActive",
      coalesce(profile.is_available, true) as "isAvailable",
      profile.address_line1 as "addressLine1",
      coalesce(profile.address_line2, '') as "addressLine2",
      profile.city,
      coalesce(profile.province, '') as "province",
      coalesce(profile.postal_code, '') as "postalCode",
      upper(left(profile.full_name, 2)) as "avatar"
    from v_doctor_profile profile
    inner join employee
      on employee.employee_id = profile.doctor_id
    where profile.doctor_id = $1
    limit 1
  `,
    [parsedDoctorId.data],
  );
  const doctor = result.rows[0];

  if (!doctor) {
    return null;
  }

  return {
    doctorId: doctor.doctorId,
    name: doctor.name,
    email: doctor.email,
    phone: doctor.phone,
    nic: doctor.nic,
    gender: doctor.gender,
    dateOfBirth: doctor.dateOfBirth,
    branchId: doctor.branchId,
    branchName: doctor.branchName,
    medicalLicenceNo: doctor.medicalLicenceNo,
    specialization: doctor.specialization,
    roomNo: doctor.roomNo,
    consultationFee: Number(doctor.consultationFee),
    yearsExperience: Number(doctor.yearsExperience),
    qualification: doctor.qualification,
    isActive: Boolean(doctor.isActive),
    isAvailable: Boolean(doctor.isAvailable),
    addressLine1: doctor.addressLine1,
    addressLine2: doctor.addressLine2,
    city: doctor.city,
    province: doctor.province,
    postalCode: doctor.postalCode,
    avatar: doctor.avatar,
  };
}
