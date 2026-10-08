import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { redirect } from "next/navigation";
import StaffPage from "./_client";
import { getStaffDirectory } from "@/lib/actions/staff";
import { getBranches } from "@/lib/actions/branches";
export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?clear=1");

  const [staffDetials, branches] = await Promise.all([
    getStaffDirectory(),
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
