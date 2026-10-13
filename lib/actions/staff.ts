"use server";
import db from "../db";
import { createStaffSchema, staffDirectorySchema } from "../schemas";
import { getCurrentUser } from "./getcurrentuser";
import { redirect } from "next/navigation";
import { generateSalt, hashPassword } from "./passwordHasher";
import { revalidatePath } from "next/cache";
export async function getStaffDirectory(unsafeData: unknown = {}) {
  const user = await getCurrentUser();

  //why here write "/login?clear=1" instead of "/login" ? -> it is because clear=1 remove authentication cookies or session data ...
  if (!user) redirect("/login?clear=1");

  if (user.role != "admin") throw new Error("Unauthorized");
  const parsedData = staffDirectorySchema.safeParse(unsafeData);

  if (!parsedData.success) {
    throw new Error("Invalid staff directory filters");
  }

  const filters = parsedData.data;

  // console.log(filters);

  const active = filters.status === "all" ? null : filters.status === "active";

  const limit = filters.pageSize;
  const offset = (filters.page - 1) * filters.pageSize;

  //here phone means a alias so we can now use this results as phone.___ .lateral means allow this sub query to use outer values like a.contact_id and on true means attach this subquery result to employee
  //AND ($X::TYPE IS NULL OR column = $X)
  //If the filter value is NULL → don't filter. Otherwise → apply the filter.
  const result = await db.query(
    `select 
                                e.employee_id as "employeeID",
                                e.branch_id as "branchID",
                                e.role,
                                e.joined_date as "joinedDate",
                                e.is_active as "isActive",
                                a.full_name as "fullName",
                                a.email,
                                b.branch_name as "branchName",
                                phone.number as "phone"
                                from employee e
                                join app_user a
                                on a.user_id=e.employee_id
                                join branch b 
                                on b.branch_id=e.branch_id
 
                                left join lateral(
                                select c.number
                                from contact_number c
                                where c.contact_id=a.contact_id
                                order by c.is_primary desc
                                limit 1) phone on true
                                where(
                                $1 = ''
                                or a.full_name ilike '%' || $1 || '%'
                                or a.email ilike '%' || $1 || '%'
                                )
                                and ($2::UUID is null or e.branch_id=$2) 
                                and ($3::employee_role_enum is null or e.role=$3 )
                                and ($4::boolean is null or e.is_active=$4)
                                order by a.full_name
                                limit $5 offset $6       
                                `,
    [
      filters.search,
      filters.branchID ?? null,
      filters.role ?? null,
      active,
      limit,
      offset,
    ],
  );

  const counttotal = await db.query(
    `select  count(*):: int as total
            from employee e
             join app_user a
             on a.user_id=e.employee_id
           
              where(
              $1 = ''
              or a.full_name ilike '%' || $1 || '%'
              or a.email ilike '%' || $1 || '%'
              )
              and ($2::UUID is null or e.branch_id=$2) 
              and ($3::employee_role_enum is null or e.role=$3 )
              and ($4::boolean is null or e.is_active=$4)      
                                `,
    [filters.search, filters.branchID ?? null, filters.role ?? null, active],
  );

  const total = counttotal.rows[0].total;

  return {
    staff: result.rows,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.ceil(total / filters.pageSize),
  };
}

//here we use db transaction to create a staf member becauase otherwise db can be dirty.
//here we dont use db.query()
//because in db.query(),db means the pool
//it automatically find a available  connection to execute the query
//after running that statement it release the connection back to pool
//why here in transactions db.query() usage is more dangerous ?
//if the pool has 3 diff connections with db if we ran,
//await db.query("BEGIN");
//await db.query("INSERT INTO address ...");
//await db.query("INSERT INTO app_user ...");
//await db.query("COMMIT");
//the problem is that each this statement can use diff connections
//so it is not suitable in transactions so we have to make a db client and use it for whole transaction process

//if cant use like this syntax because in one db.query() we cant write multiple commands so this method is correct.
// await db.query(
//   `
//   BEGIN;

//   INSERT INTO address (city)
//   VALUES ($1);

//   INSERT INTO app_user (email)
//   VALUES ($2);

//   COMMIT;
//   `,
//   ["Colombo", "test@gmail.com"]
// );

//thats why we have to use one client in whole transaction

export async function createStaff(dirtyData: unknown = {}) {
  const user = await getCurrentUser();

  if (!user) redirect("/login?clear=1");
  if (user.role !== "admin") throw new Error("Unauthorized");
  const passed = createStaffSchema.safeParse(dirtyData);

  if (!passed.success) {
    return {
      success: false,
      error: passed.error.issues[0]?.message ?? "Invalid staff member details.",
    };
  }

  const data = passed.data;
  const client = await db.connect();
  try {
    await client.query("begin"); //start to track the changes happening in the datbase but not permenanetly saved to db

    const branchDetails = await client.query(
      `
      select branch_id,branch_name from branch
      where branch_id = $1
        and (is_active = true or manager_id is null);
      `,
      [data.branchID],
    );

    if (branchDetails.rowCount === 0) {
      throw new Error("The selected branch cannot accept staff members");
    }
    const addressDetails = await client.query(
      `
      insert into address(address_line1,address_line2,city,province,postal_code,country)
      values($1,$2,$3,$4,$5,$6) 
      returning address_id;
      `,
      [
        data.addressLine1,
        data.addressLine2,
        data.city,
        data.province,
        data.postalCode,
        data.country,
      ],
    );

    const addressID = addressDetails.rows[0].address_id;

    const contactResult = await client.query(`
      insert into contact default values returning contact_id;
      `);

    const contactID = contactResult.rows[0].contact_id;

    await client.query(
      `
      insert into contact_number(contact_id,number_type,number,is_primary)
      values ($1,$2,$3,$4);
      `,
      [contactID, "Mobile", data.phone, true],
    );

    const salt = generateSalt();
    const hashedPassword = await hashPassword(data.password, salt);
    const userDetails = await client.query(
      `
      insert into app_user(address_id,contact_id,user_type,full_name,nic,email,gender,dob,password_hash,salt)
      values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      returning user_id`,
      [
        addressID,
        contactID,
        "Employee",
        `${data.firstName + " " + data.lastName}`,
        data.nic,
        data.email,
        data.gender,
        data.dob,
        hashedPassword,
        salt,
      ],
    );

    const userID = userDetails.rows[0].user_id;

    await client.query(
      `
      insert into employee (employee_id,branch_id,role,joined_date)
      values($1,$2,$3,$4)  
      `,
      [userID, data.branchID, data.role, data.joinedDate || null],
    );

    if (data.role === "Doctor") {
      await client.query(
        `
        insert into doctor(doctor_id,room_no,medical_licence_no,consultation_fee,years_experience,qualification )
        values ($1,$2,$3,$4,$5,$6)`,

        [
          userID,
          data.roomNo || null,
          data.medicalLicenceNo || null,
          data.consultationFee || 1500,
          data.yearsExperience || null,
          data.qualification || null,
        ],
      );

      const existingSpecialization = await client.query(
        `select specialization_id from specialization where lower(title) = lower($1) limit 1`,
        [data.specialization],
      );
      let specializationID = existingSpecialization.rows[0]?.specialization_id;
      if (!specializationID) {
        const specializationResult = await client.query(
          `insert into specialization (title) values ($1) returning specialization_id`,
          [data.specialization],
        );

        specializationID = specializationResult.rows[0].specialization_id;
      }
      await client.query(
        `insert into doctor_specialization ( doctor_id, specialization_id ) values ($1, $2)`,
        [userID, specializationID],
      );
    }
    await client.query("commit"); //save to db permenantly
    revalidatePath("/admin/staff");
    revalidatePath("/admin/doctors");
    revalidatePath("/patient/find-doctors");
    return {
      success: true,
      message: "staff member created successfully",
      employeeID: userID,
    };
  } catch (err) {
    await client.query("rollback"); //revert changes back if there was any errors
    console.error("unable to create staff : " + err);
  } finally {
    client.release();
  }
}
