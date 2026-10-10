"use server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./getcurrentuser";
import { appointmentReportSchema } from "../schemas";
import db from "../db";

export async function getBranchAppointmentReport(unsafeData: unknown = {}) {
  const user = await getCurrentUser();

  if (!user) redirect("/login?clear=1");

  if (user.role != "admin") throw new Error("Unauthorized");

  const passed = appointmentReportSchema.safeParse(unsafeData);

  if (!passed.success) throw new Error("Try again! Dirty Data ");

  const filters = passed.data;

  //$1::date what does is the input comes in convert to postgres  variables. it calles variables casting
  //but here in this case since the db hasving available time in date data type we dont have to convert too.but to be explicit and clear we have used as ::date
  //since branch id  is optional we use this : $3::uuid is null or b.branch_id = $3 ->if the $3 is null then this filter not applied so all the rows get returned and if not null then branch id filter also apply
  const result = await db.query(
    `
    select count(*)::int as "totalAppointments" ,
    count(*) filter (where a.status='Completed') ::int as "completed",
    count(*) filter (where a.status='Scheduled') ::int as "scheduled",
    count(*) filter (where a.status='Cancelled') ::int as "cancelled",t.available_date::text as "date",b.branch_id as "branchID",b.branch_name as "branchName" from appointment a 
    join time_slot t on t.time_slot_id=a.time_slot_id
    join branch b on b.branch_id = t.branch_id

    where (t.available_date between $1::date and $2::date) and ($3::uuid is null or b.branch_id = $3)
    group by t.available_date , b.branch_id,b.branch_name
    order by t.available_date desc , b.branch_name asc
`,
    [filters.startDate, filters.endDate, filters.branchID ?? null],
  );

  return result.rows;
}

export async function getDoctorRevenueReport(unsafe: unknown = {}) {
  const user = await getCurrentUser();

  if (!user) redirect("/login?clear=1");

  if (user.role != "admin") throw new Error("Unauthorized");

  const passed = appointmentReportSchema.safeParse(unsafe);

  if (!passed.success) throw new Error("Try again! Dirty Data ");

  const filters = passed.data;
  //coalesce :it returns the first null value
  const result = await db.query(
    `
    select doctor.doctor_id::uuid  as "doctorID" ,count(appointment.appointment_id)::int as "consultations",app_user.full_name::text as doctor,sum(invoice.net_amount) :: float8 as "revenue" ,coalesce(specialization.title,'Not Assigned') as "specialization"
    from doctor 
    join app_user on app_user.user_id = doctor.doctor_id
    join time_slot  on time_slot.doctor_id=doctor.doctor_id
    join appointment on appointment.time_slot_id = time_slot.time_slot_id
    join invoice on invoice.appointment_id = appointment.appointment_id
    left join doctor_specialization on doctor_specialization.doctor_id=doctor.doctor_id
    left join specialization on specialization.specialization_id=doctor_specialization.specialization_id
    where (appointment.status='Completed') and (time_slot.available_date between $1::date and $2::date) and ($3::uuid is null or time_slot.branch_id=$3)
    group by doctor.doctor_id,app_user.full_name,specialization.title order by revenue desc
    `,
    [filters.startDate, filters.endDate, filters.branchID ?? null],
  );

  return result.rows;
}
