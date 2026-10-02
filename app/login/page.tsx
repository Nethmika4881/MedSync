import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { redirect } from "next/navigation";
import LoginPageClient from "./_client";

export default async function LoginPage() {
  const user = await getCurrentUser();
  
  if (user) {
    const roleRoutes: Record<string, string> = {
      admin: "/admin",
      doctor: "/doctor",
      receptionist: "/front-desk",
      patient: "/patient",
    };
    const route = roleRoutes[user.role] || "/login";
    if (route !== "/login") {
      redirect(`${route}/dashboard`);
    }
  }

  return <LoginPageClient />;
}
