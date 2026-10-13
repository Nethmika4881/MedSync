import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  Receipt,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/catms/StatusPill";
import { getAdminPatientOverview } from "@/lib/actions/admin-patients";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const currencyFormatter = new Intl.NumberFormat("en-LK", {
  minimumFractionDigits: 2,
});

function formatCurrency(value: number): string {
  return `Rs. ${currencyFormatter.format(Number(value) || 0)}`;
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return date.toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminPatientOverviewPage({ params }: PageProps) {
  const { id } = await params;
  const overview = await getAdminPatientOverview(id);

  if (!overview) {
    notFound();
  }

  const { patient, appointments, billing, invoices } = overview;

  const address =
    [
      patient.addressLine1,
      patient.addressLine2,
      patient.city,
      patient.province,
      patient.postalCode,
      patient.country,
    ]
      .filter(Boolean)
      .join(", ") || "Not recorded";

  const billingCards = [
    {
      label: "Invoices",
      value: billing.invoiceCount.toLocaleString(),
      icon: Receipt,
      iconClass: "text-blue-600",
      iconBackground: "bg-blue-50",
    },
    {
      label: "Total billed",
      value: formatCurrency(billing.totalBilled),
      icon: CreditCard,
      iconClass: "text-violet-600",
      iconBackground: "bg-violet-50",
    },
    {
      label: "Total paid",
      value: formatCurrency(billing.totalPaid),
      icon: WalletCards,
      iconClass: "text-emerald-600",
      iconBackground: "bg-emerald-50",
    },
    {
      label: "Outstanding",
      value: formatCurrency(billing.totalDue),
      icon: Receipt,
      iconClass: billing.totalDue > 0 ? "text-amber-600" : "text-emerald-600",
      iconBackground: billing.totalDue > 0 ? "bg-amber-50" : "bg-emerald-50",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/patients"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-teal-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to patient directory
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Patient Overview
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Read-only operational and account information.
          </p>
        </div>

        <span
          className={
            patient.isActive
              ? "inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
              : "inline-flex w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
          }
        >
          {patient.isActive ? "Active patient" : "Inactive patient"}
        </span>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />

        <div>
          <p className="font-semibold">Audited read-only access</p>

          <p className="mt-0.5 text-teal-800">
            This access has been recorded. Clinical notes, diagnoses and
            prescriptions are not included.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <div className="h-24 bg-gradient-to-r from-teal-600 to-cyan-600" />

        <CardContent className="relative p-6 pt-0">
          <div className="-mt-10 mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-slate-100 text-2xl font-bold text-slate-700 shadow-md">
              {patient.fullName
                .split(" ")
                .map((name) => name.charAt(0))
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div className="min-w-0 flex-1 pb-1">
              <h2 className="truncate text-2xl font-bold text-slate-900">
                {patient.fullName}
              </h2>

              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                  NIC: {patient.nic}
                </span>

                <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                  {patient.gender}
                </span>

                <span className="rounded-lg bg-rose-50 px-2.5 py-1 font-medium text-rose-700">
                  Blood group: {patient.bloodGroup || "Not recorded"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 border-t border-slate-100 pt-6 md:grid-cols-3">
            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Contact details
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span className="text-slate-700">
                    {patient.phone || "No phone recorded"}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span className="break-all text-slate-700">
                    {patient.email}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span className="text-slate-700">{address}</span>
                </div>
              </div>
            </section>

            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Emergency contact
              </h3>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <UserRound className="h-4 w-4 text-slate-500" />
                </div>

                <div className="text-sm">
                  <p className="font-semibold text-slate-800">
                    {patient.emergencyContactName || "Not recorded"}
                  </p>

                  <p className="mt-1 text-slate-500">
                    {patient.emergencyContactRelationship ||
                      "Relationship not recorded"}
                  </p>

                  <p className="mt-1 text-slate-600">
                    {patient.emergencyContactPhone || "Phone not recorded"}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Registration
              </h3>

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Date of birth</dt>
                  <dd className="font-medium text-slate-800">
                    {formatDate(patient.dob)}
                  </dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Registered</dt>
                  <dd className="font-medium text-slate-800">
                    {formatDate(patient.registeredAt)}
                  </dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Branch</dt>
                  <dd className="text-right font-medium text-slate-800">
                    {patient.branchName}
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-400">Patient ID</p>

            <p className="mt-1 break-all font-mono text-xs text-slate-600">
              {patient.patientId}
            </p>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Billing summary</h2>

          <p className="text-sm text-slate-500">
            Aggregated account totals across all branches.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {billingCards.map((item) => (
            <Card
              key={item.label}
              className="rounded-2xl border-slate-200 shadow-sm"
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.iconBackground}`}
                >
                  <item.icon className={`h-5 w-5 ${item.iconClass}`} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">
                    {item.label}
                  </p>

                  <p className="mt-1 truncate text-lg font-bold text-slate-900">
                    {item.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-5 w-5 text-teal-600" />
            Recent appointments
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {appointments.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              No appointments found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold">Doctor</th>
                    <th className="px-6 py-3 font-semibold">Branch</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {appointments.map((appointment) => (
                    <tr key={appointment.appointmentId}>
                      <td className="px-6 py-4 text-slate-700">
                        <p className="font-medium">
                          {formatDate(appointment.appointmentDate)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {appointment.startTime}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        Dr. {appointment.doctorName}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {appointment.branchName}
                      </td>

                      <td className="px-6 py-4">
                        <StatusPill status={appointment.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5 text-teal-600" />
            Recent invoices
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              No invoices found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Invoice</th>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold">Total</th>
                    <th className="px-6 py-3 font-semibold">Paid</th>
                    <th className="px-6 py-3 font-semibold">Due</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {invoices.map((invoice) => (
                    <tr key={invoice.invoiceId}>
                      <td className="px-6 py-4">
                        <span
                          className="block max-w-40 truncate font-mono text-xs text-slate-600"
                          title={invoice.invoiceId}
                        >
                          {invoice.invoiceId}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {invoice.invoiceDate}
                      </td>

                      <td className="px-6 py-4 font-medium text-slate-800">
                        {formatCurrency(invoice.netAmount)}
                      </td>

                      <td className="px-6 py-4 text-emerald-700">
                        {formatCurrency(invoice.paidAmount)}
                      </td>

                      <td className="px-6 py-4 font-medium text-amber-700">
                        {formatCurrency(invoice.dueAmount)}
                      </td>

                      <td className="px-6 py-4">
                        <StatusPill status={invoice.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
