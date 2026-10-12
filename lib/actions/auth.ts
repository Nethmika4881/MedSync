"use server";

import db from "../db";
import {
  comparePassword,
  generateSalt,
  hashPassword,
} from "../actions/passwordHasher";
import { RegisterFormValues, registerSchema, signInSchema, userLoginRoles } from "../schemas";
import { createUserSession, removeUserFromSession } from "./sessions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

function getDashboard(role: string) {
  if (role === "Admin") return "/admin/dashboard";
  if (role === "Doctor") return "/doctor/dashboard";
  if (role === "Patient") return "/patient/dashboard";
  if (role === "FrontDesk") return "/front-desk/dashboard";
  return "/";
}

type signinschema = z.infer<typeof signInSchema>;
export async function signIn(unsafeData: signinschema) {
  const { success, data } = signInSchema.safeParse(unsafeData);

  if (!success) return "Unable to log you in";

  let dashboard = "/";

  try {
    const result = await db.query(
      `SELECT u.user_id, u.password_hash, u.salt,
              CASE WHEN u.user_type = 'Patient' THEN 'Patient'
                   ELSE e.role::text END AS login_role
       FROM app_user u
       LEFT JOIN employee e ON e.employee_id = u.user_id
       WHERE u.email = $1 AND u.is_active = true
         AND (u.user_type = 'Patient' OR e.is_active = true)`,
      [data.email],
    );
    const user = result.rows[0];

    if (!user || !user.password_hash || !user.salt) return "Unable to log you in";

    const role = z.enum(userLoginRoles).safeParse(user.login_role);
    if (!role.success) return "Unable to log you in";

    const isCorrectPassword = await comparePassword({
      hashedPassword: user.password_hash,
      password: data.password,
      salt: user.salt,
    });
    if (!isCorrectPassword) return "Unable to log you in";

    await createUserSession({ id: user.user_id, role: role.data }, await cookies());
    dashboard = getDashboard(role.data);
  } catch (error) {
    console.error("[auth/signIn] Sign in failed:", error);
    return "Unable to log you in. Please try again.";
  }

  redirect(dashboard);
}

export default async function registerFunction(unsafeData: RegisterFormValues) {
  const { success, data } = registerSchema.safeParse(unsafeData);

  if (!success) return "Please check your details. Only patients and doctors can register here.";

  const loginRole = data.role === "Employee" ? data.employeeRole : "Patient";
  if (!loginRole) return "Please select Patient or Doctor";
  let userId = "";

  try {
    const existingUser = await db.query(
      `SELECT user_id, email, nic FROM app_user WHERE email = $1 OR nic = $2`,
      [data.email, data.nic],
    );
    if (existingUser.rows.length > 0) {
      const match = existingUser.rows[0];
      if (match.email === data.email) {
        return "An account with this email already exists";
      }
      return "An account with this NIC number already exists";
    }

    const salt = generateSalt();
    const hashedPassword = await hashPassword(data.password, salt);

    const client = await db.connect();
    try {
      await client.query("BEGIN");

      const addressResult = await client.query(
        `insert into address (address_line1, address_line2, city, province, postal_code, country)
          VALUES ($1, $2, $3, $4, $5, $6)
          returning address_id`,
        [
          data.addressLine1,
          data.addressLine2,
          data.city,
          data.province,
          data.postalCode,
          data.country,
        ],
      );

      const addressID = addressResult.rows[0].address_id;

      const contactResult = await client.query(
        `
          insert into contact default
          values
          returning contact_id
          `,
      );

      const contactID = contactResult.rows[0].contact_id;
      await client.query(
        `
          insert into contact_number(contact_id,number_type,number)
          values ($1,'Mobile',$2)
          returning contact_id
          `,
        [contactID, data.phoneNumber],
      );

      const user = await client.query(
        `insert into app_user (salt,address_id,contact_id,user_type,full_name, nic, email, gender,dob, password_hash)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          returning user_id,user_type`,
        [
          salt,
          addressID,
          contactID,
          data.role,
          data.fullName,
          data.nic,
          data.email,
          data.gender,
          data.dob,
          hashedPassword,
        ],
      );

      if (user.rows[0].user_type === "Employee") {
        await client.query(
          `
          insert into employee(employee_id,branch_id,role,joined_date)
          values($1,$2,$3,$4)
          `,
          [
            user.rows[0].user_id,
            data.branchId,
            data.employeeRole,
            data.joinedDate || null,
          ],
        );

        if (data.employeeRole === "Doctor") {
          await client.query(
            `
            insert into doctor(doctor_id,room_no,medical_licence_no,consultation_fee,years_experience,qualification)
            values($1,$2,$3,$4,$5,$6)
            `,
            [
              user.rows[0].user_id,
              data.roomNo,
              data.medicalLicenceNo,
              data.consultationFee ?? 1500,
              data.yearsExperience,
              data.qualification,
            ],
          );
        }
      } else if (user.rows[0].user_type === "Patient") {
        await client.query(
          `
          insert into patient(patient_id,blood_group,registered_branch_id,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship)
          values($1,$2,$3,$4,$5,$6)
          `,
          [
            user.rows[0].user_id,
            data.bloodGroup,
            data.branchId,
            data.emergencyContactName,
            data.emergencyContactPhone,
            data.emergencyContactRelationship,
          ],
        );
      }

      await client.query("COMMIT");
      userId = user.rows[0].user_id;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    await createUserSession(
      {
        id: userId,
        role: loginRole,
      },
      await cookies(),
    );
  } catch (error: any) {
    console.error("[auth/register] Registration failed:", error);
    if (error?.code === "23505") {
      if (error?.detail?.includes("email")) return "An account with this email already exists";
      if (error?.detail?.includes("nic")) return "An account with this NIC number already exists";
    }
    return userId
      ? "Your account was created, but automatic sign in failed. Please sign in."
      : error?.message || "Unable to register. Please check your details and try again.";
  }

  redirect(getDashboard(loginRole));
}

export async function logOut() {
  await removeUserFromSession(await cookies());

  redirect("/");
}
