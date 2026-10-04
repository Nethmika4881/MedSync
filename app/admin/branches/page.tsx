import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { redirect } from "next/navigation";
import BranchesPage from "./_client";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // const mockUser = {
  //   id: "mock-123",
  //   name: "Local Admin",
  //   email: "admin@localhost",
  //   role: "admin" 
  //   };
  return <BranchesPage user={user} />;
}
