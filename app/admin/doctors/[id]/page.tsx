import { notFound } from "next/navigation";
import { getAdminDoctorById } from "@/lib/actions/doctors";
import DoctorProfilePage from "./_client";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  const doctor = await getAdminDoctorById(id);

  if (!doctor) {
    notFound();
  }

  return <DoctorProfilePage doctor={doctor} />;
}
