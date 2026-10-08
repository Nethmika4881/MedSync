import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { redirect } from "next/navigation";
import StaffPage from "./_client";
import { getStaffDirectory } from "@/lib/actions/staff";
import { getBranches } from "@/lib/actions/branches";

type StaffPageSearchParams = {
  search?: string;
  branchID?: string;
  role?: string;
  status?: string;
  page?: string;
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<StaffPageSearchParams>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?clear=1");

  const [staffDetials, branches] = await Promise.all([
    getStaffDirectory({
      search: params.search ?? "",
      branchID: params.branchID || undefined,
      role: params.role || undefined,
      status: params.status ?? "all",
      page: params.page ?? 1,
      pageSize: 20,
    }),
    getBranches(),
  ]);
  const { staff, total, page, pageSize, totalPages } = staffDetials;

  return (
    <StaffPage
      user={user}
      staff={staff}
      branches={branches}
      total={total}
      page={page}
      pageSize={pageSize}
      totalPages={totalPages}
    />
  );
}
