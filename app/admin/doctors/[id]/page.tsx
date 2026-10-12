import { notFound } from "next/navigation";
import {
  getAdminDoctorById,
  getAdminDoctorAppointments,
} from "@/lib/actions/doctors";
import DoctorProfilePage from "./_client";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  const [doctor, appointments] = await Promise.all([
    getAdminDoctorById(id),
    getAdminDoctorAppointments(id),
  ]);

  if (!doctor) {
    notFound();
  }

  return <DoctorProfilePage doctor={doctor} appointments={appointments} />;
}
