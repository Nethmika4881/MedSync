"use server";
import db from "../db";
import { staffDirectorySchema } from "../schemas";
import { getCurrentUser } from "./getcurrentuser";
import { redirect } from "next/navigation";
export async function getStaffDirectory(unsafeData: unknown = {}) {
  const user = await getCurrentUser();
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
