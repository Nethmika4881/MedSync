"use server";

import db from "../db";
import { generateSalt, hashPassword } from "../actions/passwordHasher";
import { RegisterFormValues, registerSchema } from "../schemas";
import { createUserSession, removeUserFromSession } from "./sessions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function registerFunction(unsafeData: RegisterFormValues) {
  const { success, data } = registerSchema.safeParse(unsafeData);

  console.log("role : " + data?.role);
  if (!success) return "unable to register";

  const existingUser = await db.query(
    `select count(*) as count from app_user where email=$1`,
    [data.email],
  );

  if (existingUser.rows[0].count > 0) return "Already existing email.Try again";

  try {
    const salt = generateSalt();
    const hashedPassword = await hashPassword(data.password, salt);
    console.log(hashedPassword);

    const addressResult = await db.query(
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

    console.log(addressID);
    const contactResult = await db.query(
      `
        insert into contact default
        values
        returning contact_id
        `,
    );

    const contactID = contactResult.rows[0].contact_id;
    console.log(contactID);
    await db.query(
      `
        insert into contact_number(contact_id,number)
        values ($1,$2)
        returning contact_id
        `,
      [contactID, data.phoneNumber],
    );

    console.log(data.role);
    const user = await db.query(
      `insert into app_user (address_id,contact_id,user_type,full_name, nic, email, gender,dob, password_hash)
        VALUES ($1, $2, $3, $4, $5, $6,$7,$8,$9)
        returning user_id,user_type`,
      [
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

    console.log(user);

    if (user == null) return "";

    if (user.rows[0].user_type == "Employee") {
      /**/

      await db.query(
        `
        insert into employee(employee_id,branch_id,role,joined_date)
        values($1,$2,$3,$4)
        `,
        [
          user.rows[0].user_id,
          data.branchId,
          "Doctor",
          data.joinedDate,
        ] /* TODO : should be check this branch id before adding into the table is this a valid branch id and admin should be able to set branches to this doctos from the UI*/,
      );

      await db.query(
        `
        insert into doctor(doctor_id,room_no,medical_licence_no,consultation_fee,years_experience,qualification)
        values($1,$2,$3,$4,$5,$6)
        `,
        [
          user.rows[0].user_id,
          data.roomNo,
          data.medicalLicenceNo,
          data.consultationFee,
          data.yearsExperience,
          data.qualification,
        ],
      );
    } else if (user.rows[0].user_type == "Patient") {
      /* */
      await db.query(
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

    await createUserSession(
      {
        id: user.rows[0].user_id,
        role: user.rows[0].user_type === "Employee" ? "Doctor" : "Patient",
      },
      await cookies(),
    );

    if (user == null) return "unable to create user";
  } catch (error) {
    console.error(error);
  }

  redirect("/");
}

export async function logOut() {
  await removeUserFromSession(await cookies());

  redirect("/");
}
