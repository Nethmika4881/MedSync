import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { redirect } from "next/navigation";
import ReportsPage from "./_client";
import {
  getBranchAppointmentReport,
  getDoctorRevenueReport,
  getInsuranceReport,
  getOutstandingBalanceReport,
  getTreatmentReport,
} from "@/lib/actions/reports";
import { getBranches } from "@/lib/actions/branches";

type ReportsSearchParams = {
  startDate?: string;
  endDate?: string;
  branchID?: string;
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<ReportsSearchParams>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/login?clear=1");
  }

  const today = new Date();

  const thirtyDaysBefore = new Date(today);
  thirtyDaysBefore.setDate(today.getDate() - 30);

  const [
    reportDetails,
    branchDetails,
    doctorRevenueDetails,
    outstandingBalanceDetails,
    treatmentDetails,
    insuranceDetails,
  ] =
    await Promise.all([
      getBranchAppointmentReport({
        startDate:
          params.startDate || thirtyDaysBefore.toISOString().slice(0, 10), //toisostring what does is pass date as a string
        endDate: params.endDate ?? today.toISOString().slice(0, 10), //slice(0,10) takes 10 characters from the 0th character
        branchID: params.branchID,
      }),
      getBranches(),
      getDoctorRevenueReport({
        startDate:
          params.startDate || thirtyDaysBefore.toISOString().slice(0, 10), //toisostring what does is pass date as a string
        endDate: params.endDate ?? today.toISOString().slice(0, 10), //slice(0,10) takes 10 characters from the 0th character
        branchID: params.branchID,
      }),
      getOutstandingBalanceReport({
        startDate:
          params.startDate || thirtyDaysBefore.toISOString().slice(0, 10),
        endDate: params.endDate ?? today.toISOString().slice(0, 10),
        branchID: params.branchID,
      }),
      getTreatmentReport({
        startDate:
          params.startDate || thirtyDaysBefore.toISOString().slice(0, 10),
        endDate: params.endDate ?? today.toISOString().slice(0, 10),
        branchID: params.branchID,
      }),
      getInsuranceReport({
        startDate:
          params.startDate || thirtyDaysBefore.toISOString().slice(0, 10),
        endDate: params.endDate ?? today.toISOString().slice(0, 10),
        branchID: params.branchID,
      }),
    ]);

  console.log(reportDetails);
  console.log(branchDetails);

  return (
    <ReportsPage
      user={user}
      startDate={
        params.startDate ?? thirtyDaysBefore.toISOString().slice(0, 10)
      }
      endDate={params.endDate ?? today.toISOString().slice(0, 10)}
      branchID={params.branchID}
      reportDetails={reportDetails}
      branchDetails={branchDetails}
      doctorRevenueDetails={doctorRevenueDetails}
      outstandingBalanceDetails={outstandingBalanceDetails}
      treatmentDetails={treatmentDetails}
      insuranceDetails={insuranceDetails}
    />
  );
}