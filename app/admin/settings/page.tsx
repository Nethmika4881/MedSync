import { getCurrentUser } from "@/lib/actions/getcurrentuser";
import { getProfile } from "@/lib/actions/admin-settings";
import SettingsPage from "./_client";
import { redirect } from "next/navigation";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?clear=1");

  const initialProfile = await getProfile();

  return (
    <SettingsPage 
      user={user} 
      initialProfile={initialProfile} 
    />
  );
}