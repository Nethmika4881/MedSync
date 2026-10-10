import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { redirect } from "next/navigation";
import ReportsPage from "./_client";
import { getBranchAppointmentReport } from "@/lib/actions/reports";

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
  if (!user) redirect("/login?clear=1");

  const today = new Date();

  const thirtyDaysBefore = new Date(today);
  thirtyDaysBefore.setDate(today.getDate() - 30);

  const reportDetails = await getBranchAppointmentReport({
    startDate: params.startDate || thirtyDaysBefore.toISOString().slice(0, 10), //toisostring what does is pass date as a string
    endDate: params.endDate ?? today.toISOString().slice(0, 10), //slice(0,10) takes 10 characters from the 0th character
    branchID: params.branchID,
  });

  console.log(reportDetails);
  return <ReportsPage user={user} reportDetails={reportDetails} />;
}
