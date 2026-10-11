"use server";

import db from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { revalidatePath } from "next/cache";

export type AdminProfileData = {
  userId: string;
  fullName: string;
  email: string;
  nic: string;
  gender: string | null;
  dob: string;
  role: string;
  lastLogin: string | null;
  createdAt: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
};

export async function getProfile(): Promise<AdminProfileData | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const result = await db.query(
    `
    SELECT 
      u.user_id as "userId",
      u.full_name as "fullName",
      u.email,
      u.nic,
      u.gender::text as gender,
      to_char(u.dob, 'YYYY-MM-DD') as dob,
      u.user_type::text as role,
      to_char(u.last_login, 'DD Mon YYYY, HH:MI AM') as "lastLogin",
      to_char(u.created_at, 'DD Mon YYYY') as "createdAt",
      coalesce(cn.number, '') as "phoneNumber",
      coalesce(a.address_line1, '') as "addressLine1",
      coalesce(a.address_line2, '') as "addressLine2",
      coalesce(a.city, '') as "city",
      coalesce(a.province, '') as "province",
      coalesce(a.postal_code, '') as "postalCode"
    FROM app_user u
    LEFT JOIN address a ON a.address_id = u.address_id
    LEFT JOIN contact c ON c.contact_id = u.contact_id
    LEFT JOIN contact_number cn ON cn.contact_id = c.contact_id AND cn.is_primary = TRUE
    WHERE u.user_id = $1
    LIMIT 1;
    `,
    [user.userId]
  );

  return result.rows[0] ?? null;
}

export async function updateProfile(data: {
  fullName: string;
  email: string;
  gender: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const userRecord = await db.query(
    `SELECT user_id, address_id, contact_id FROM app_user WHERE user_id = $1LIMIT 1;`,
    [user.userId]
  );

  if (userRecord.rows.length === 0) {
    throw new Error("User record not found in the database.");
  }

  const { user_id, address_id, contact_id } = userRecord.rows[0];

  await db.query(
    `
    UPDATE app_user 
    SET full_name = $1, email = $2, gender = $3::gender_enum, updated_at = NOW()
    WHERE user_id = $4
    `,
    [data.fullName, data.email, data.gender, user_id]
  );

  if (address_id) {
    await db.query(
      `
      UPDATE address
      SET address_line1 = $1, address_line2 = $2, city = $3, province = $4, postal_code = $5, updated_at = NOW()
      WHERE address_id = $6
      `,
      [data.addressLine1, data.addressLine2, data.city, data.province, data.postalCode, address_id,]
    );
  }

  if (contact_id && data.phoneNumber.trim()) {
    const existingPhone = await db.query(
      `
      SELECT contact_number_id FROM contact_number 
      WHERE contact_id = $1 AND is_primary = TRUE
      LIMIT 1;
      `,
      [contact_id]
    );

    if (existingPhone.rows.length > 0) {
      await db.query(
        `UPDATE contact_number SET number = $1 WHERE contact_number_id = $2`,
        [data.phoneNumber.trim(), existingPhone.rows[0].contact_number_id]
      );
    } else {
      await db.query(
        `
        INSERT INTO contact_number (contact_id, number_type, number, is_primary)
        VALUES ($1, 'Mobile', $2, TRUE)
        `,
        [contact_id, data.phoneNumber.trim()]
      );
    }
  }

  revalidatePath("/admin/settings");
  return { success: true, message: "Profile updated successfully." };
}

export async function updatePassword(data: {currentPass: string; newPass: string;}) 
{
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const userRes = await db.query(
    `SELECT user_id, password_hash FROM app_user WHERE user_id = $1 LIMIT 1;`,
    [user.userId]
  );

  if (userRes.rows.length === 0) {
    throw new Error("User record not found.");
  }

  const { user_id, password_hash } = userRes.rows[0];

  if (password_hash !== data.currentPass) {
    throw new Error("Current password does not match our records.");
  }

  if (data.currentPass === data.newPass) {
  throw new Error("New password must be different from your current password.");
}

  await db.query(
    `UPDATE app_user SET password_hash = $1, updated_at = NOW() WHERE user_id = $2`,
    [data.newPass, user_id]
  );

  return { success: true, message: "Password updated successfully." };
}