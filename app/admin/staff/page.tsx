import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { redirect } from "next/navigation";
import StaffPage from "./_client";
import { getStaffDirectory } from "@/lib/actions/staff";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?clear=1");

  const staffDetials = await getStaffDirectory();
  const { staff, total, page, pageSize, totalPages } = staffDetials;

  return (
    <StaffPage
      user={user}
      staff={staff}
      total={total}
      page={page}
      pageSize={pageSize}
      totalPages={totalPages}
    />
  );
}
