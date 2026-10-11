"use server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./getcurrentuser";
import { appointmentReportSchema } from "../schemas";
import db from "../db";

export async function getBranchAppointmentReport(unsafeData: unknown = {}) {
  try{
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
  catch (error) {
    console.error("Error in getBranchAppointmentReport:", error);
    throw new Error("An error occurred while fetching the report data.");
  }
}

export async function getDoctorRevenueReport(unsafe: unknown = {}) {
  try {
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
  catch (error) {
    console.error("Error in getDoctorRevenueReport:", error);
    throw new Error("An error occurred while fetching the report data.");
  }
}

// Report 3: patients who still owe money, with what was billed and paid in the period.
// Same filters as the other reports: the invoice's visit date (time_slot.available_date) and branch.
export async function getOutstandingBalanceReport(unsafe: unknown = {}) {
  try {
    const user = await getCurrentUser();

    if (!user) redirect("/login?clear=1");

    if (user.role != "admin") throw new Error("Unauthorized");

    const passed = appointmentReportSchema.safeParse(unsafe);

    if (!passed.success) throw new Error("Try again! Dirty Data ");

    const filters = passed.data;

    //invoice.paid_amount and due_amount are kept up to date by the front-desk payment flow.
    //having sum(due) > 0 keeps only patients who still owe something in this period.
    const result = await db.query(
      `
      select invoice.patient_id::text as "patientID",
            app_user.full_name::text as "patientName",
            max(time_slot.available_date)::text as "lastVisit",
            sum(invoice.net_amount)::float8 as "totalBilled",
            sum(invoice.paid_amount)::float8 as "amountPaid",
            sum(invoice.due_amount)::float8 as "outstanding",
            count(*) filter (where invoice.due_amount > 0)::int as "unpaidInvoices"
      from invoice
      join appointment on appointment.appointment_id = invoice.appointment_id
      join time_slot on time_slot.time_slot_id = appointment.time_slot_id
      join app_user on app_user.user_id = invoice.patient_id
      where (time_slot.available_date between $1::date and $2::date)
        and ($3::uuid is null or time_slot.branch_id = $3)
      group by invoice.patient_id, app_user.full_name
      having sum(invoice.due_amount) > 0
      order by "outstanding" desc, "patientName" asc
      `,
      [filters.startDate, filters.endDate, filters.branchID ?? null],
    );

    return result.rows;
  } 
  catch (error) {
    console.error("Error in getOutstandingBalanceReport:", error);
    throw new Error("An error occurred while fetching the report data.");
  }
}
export async function getTreatmentReport(unsafe: unknown = {}) {
  try {
    const user = await getCurrentUser();

    if (!user) redirect("/login?clear=1");
    if (user.role != "admin") throw new Error("Unauthorized");

    const passed = appointmentReportSchema.safeParse(unsafe);
    if (!passed.success) throw new Error("Try again! Dirty Data ");

    const filters = passed.data;

    const result = await db.query(
      `
      select 
        tc.category::text as "category",
        coalesce(sum(at.quantity), count(*))::int as "count",
        coalesce(sum(at.line_total), 0)::float8 as "revenue"
      from appointment_treatment at
      join treatment_catalogue tc on tc.treatment_service_code = at.treatment_service_code
      join appointment a on a.appointment_id = at.appointment_id
      join time_slot ts on ts.time_slot_id = a.time_slot_id
      where (a.status != 'Cancelled')
        and (ts.available_date between $1::date and $2::date)
        and ($3::uuid is null or ts.branch_id = $3)
      group by tc.category
      order by "revenue" desc, "count" desc
      `,
      [filters.startDate, filters.endDate, filters.branchID ?? null],
    );

    return result.rows;
  }
  catch(error){
    console.error("Error in getTreatmentReport:", error);
    throw new Error("An error occurred while fetching the report data.");
  }
}
export async function getInsuranceReport(unsafe: unknown = {}) {
  try {
    const user = await getCurrentUser();

    if (!user) redirect("/login?clear=1");
    if (user.role != "admin") throw new Error("Unauthorized");

    const passed = appointmentReportSchema.safeParse(unsafe);
    if (!passed.success) throw new Error("Try again! Dirty Data ");

    const filters = passed.data;

    const result = await db.query(
      `
      select
        to_char(date_trunc('month', time_slot.available_date), 'FMMonth YYYY')::text as "month",
        date_trunc('month', time_slot.available_date) as "month_order",
        coalesce(sum(invoice.net_amount), 0)::float8 as "totalRevenue",
        coalesce(sum(
          case 
            when insurance.insurance_id is not null 
            then (invoice.net_amount * (100 - coalesce(insurance_package.copayment_percentage, 0)) / 100.0)
            else 0 
          end
        ), 0)::float8 as "insuranceCovered"
      from invoice
      join appointment on appointment.appointment_id = invoice.appointment_id
      join time_slot on time_slot.time_slot_id = appointment.time_slot_id
      left join insurance on insurance.patient_id = appointment.patient_id and insurance.status = 'Active'
      left join insurance_package on insurance_package.insurance_package_id = insurance.insurance_package_id
      where (time_slot.available_date between $1::date and $2::date)
        and ($3::uuid is null or time_slot.branch_id = $3)
      group by date_trunc('month', time_slot.available_date)
      order by "month_order" desc
      `,
      [filters.startDate, filters.endDate, filters.branchID ?? null],
    );

    return result.rows.map((row) => {
      const totalRevenue = Math.round(Number(row.totalRevenue) || 0);
      const insuranceCovered = Math.round(Number(row.insuranceCovered) || 0);
      const outOfPocket = Math.max(0, totalRevenue - insuranceCovered);
      const insuranceRatio =
        totalRevenue > 0
          ? `${Math.round((insuranceCovered / totalRevenue) * 100)}%`
          : "0%";

      return {
        month: row.month,
        totalRevenue,
        insuranceCovered,
        outOfPocket,
        insuranceRatio,
      };
    });
  } catch (error) {
    console.error("Error in getInsuranceReport:", error);
    throw new Error("An error occurred while fetching the report data.");
  }
}
