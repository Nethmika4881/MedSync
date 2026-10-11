import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { redirect } from "next/navigation";
import { getBranchInvoices } from "@/lib/actions/frontdesk-billing";
import BillingPage from "./_client";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?clear=1");

  const initialInvoices = await getBranchInvoices(user.branchId);

  return <BillingPage user={user} initialInvoices={initialInvoices} />;
}
