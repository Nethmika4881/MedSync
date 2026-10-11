import { redirect } from "next/navigation";

export default function NewDoctorPage() {
  redirect("/admin/staff/new?role=Doctor");
}
