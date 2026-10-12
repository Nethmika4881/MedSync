"use server";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { generateSalt, hashPassword } from "@/lib/actions/passwordHasher";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export interface RegisterPatientInput {
    firstName: string;
    lastName: string;
    nic: string;
    email: string;
    phone: string;
    dob: string;
    gender: "Male" | "Female" | "Other";
    bloodGroup: string;
    addressLine1?: string;
    city?: string;
    emergencyContactName?: string;
    emergencyContactRelation?: string;
    emergencyContactPhone?: string;
    branchId?: string;
}

export async function registerBranchPatient(input: RegisterPatientInput) {
    const user = await getCurrentUser();
    if (!user || (user.role !== "receptionist" && user.role !== "admin")) {
        return { success: false, error: "Unauthorized: Front desk or admin access required." };
    }

    const branchId = user.role === "admin" ? (input.branchId || user.branchId) : user.branchId;
    if (!branchId) {
        return { success: false, error: "Active branch ID is required for patient registration." };
    }

    const client = await db.connect();
    try {
        await client.query("BEGIN");

        // 1. Create Address
        const addressRes = await client.query(
            `INSERT INTO address (address_line1, city, country)
       VALUES ($1, $2, 'Sri Lanka')
       RETURNING address_id`,
            [input.addressLine1 || "N/A", input.city || "Colombo"]
        );
        const addressId = addressRes.rows[0].address_id;

        // 2. Create Contact and primary Contact Number
        const contactRes = await client.query(
            `INSERT INTO contact DEFAULT VALUES RETURNING contact_id`
        );
        const contactId = contactRes.rows[0].contact_id;

        await client.query(
            `INSERT INTO contact_number (contact_id, number_type, number, is_primary)
       VALUES ($1, 'Mobile', $2, true)`,
            [contactId, input.phone]
        );

        // 3. Create App User with hashed random temporary password
        const fullName = `${input.firstName} ${input.lastName}`.trim();
        const salt = generateSalt();
        const temporaryPassword = `Tmp#${crypto.randomBytes(6).toString("base64url")}`;
        const passwordHash = await hashPassword(temporaryPassword, salt);

        const userRes = await client.query(
            `INSERT INTO app_user (
         address_id, contact_id, user_type, full_name, nic, email,
         gender, dob, password_hash, salt, is_active
       )
       VALUES ($1, $2, 'Patient', $3, $4, $5, $6, $7, $8, $9, true)
       RETURNING user_id`,
            [
                addressId,
                contactId,
                fullName,
                input.nic,
                input.email,
                input.gender,
                input.dob,
                passwordHash,
                salt,
            ]
        );
        const newUserId = userRes.rows[0].user_id;

        // 4. Create Patient Record linked to App User and Branch
        await client.query(
            `INSERT INTO patient (
         patient_id, blood_group, registered_branch_id,
         emergency_contact_name, emergency_contact_phone, emergency_contact_relationship
       )
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                newUserId,
                input.bloodGroup || "O+",
                branchId,
                input.emergencyContactName || null,
                input.emergencyContactPhone || null,
                input.emergencyContactRelation || null,
            ]
        );

        await client.query("COMMIT");

        revalidatePath("/front-desk/patients");
        revalidatePath("/front-desk/dashboard");

        return {
            success: true,
            patientId: newUserId,
            temporaryPassword,
            message: `Patient ${fullName} registered successfully!`,
        };
    } catch (error: any) {
        await client.query("ROLLBACK");
        console.error("[registerBranchPatient] Transaction failed:", error);

        if (error.code === "23505") {
            if (error.detail?.includes("nic")) {
                return { success: false, error: "A patient with this National ID (NIC) is already registered." };
            }
            if (error.detail?.includes("email")) {
                return { success: false, error: "A patient with this Email address is already registered." };
            }
        }

        return {
            success: false,
            error: error.message || "Failed to register patient. Please check the details and try again.",
        };
    } finally {
        client.release();
    }
}
