"use client";

import React, { useState } from "react";
import {
  ColumnDef,
  flexRender,
  SortingState,
  useTable,
  tableFeatures,
  rowSortingFeature,
  rowPaginationFeature,
  globalFilteringFeature,
  columnFilteringFeature,
  rowSelectionFeature,
  columnVisibilityFeature,
  createSortedRowModel,
  createPaginatedRowModel,
  createFilteredRowModel
} from "@tanstack/react-table";
import { useDoctorStore } from "@/lib/stores/doctorStore";
import { Doctor } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowUpDown, DollarSign, Search } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getAvatarColor, getInitials, cn } from "@/lib/utils";

const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  globalFilteringFeature,
  columnFilteringFeature,
  rowSelectionFeature,
  columnVisibilityFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filteredRowModel: createFilteredRowModel(),
});

const columns: ColumnDef<typeof features, Doctor>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex w-full items-center justify-center hover:text-slate-900 transition-colors"
        >
          Doctor Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </button>
      );
    },
    cell: ({ row }) => {
      const doctor = row.original;
      const colorClass = getAvatarColor(doctor.name);
      return (
        <div className="flex items-center gap-3 py-1">
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0", colorClass)}>
            {getInitials(doctor.name)}
          </div>
          <div>
            <p className="font-semibold text-slate-900">Dr. {doctor.name}</p>
            <p className="text-xs text-slate-500">{doctor.specialization}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "branchName",
    header: "Primary Branch",
    cell: ({ row }) => <span className="text-slate-600 font-medium">{row.getValue("branchName")}</span>,
  },
  {
    accessorKey: "consultationFee",
    header: "Consultation Fee",
    cell: ({ row }) => {
      const doctor = row.original;
      // We will use a custom component for the cell to handle state locally before saving
      return <FeeCell doctor={doctor} />;
    },
  },
];

// Custom Cell for Fee editing
const FeeCell = ({ doctor }: { doctor: Doctor }) => {
  const [fee, setFee] = useState<string>(doctor.consultationFee.toString());
  const updateDoctor = useDoctorStore((s) => s.updateDoctor);

  const handleSave = () => {
    const numFee = parseInt(fee, 10);
    if (isNaN(numFee) || numFee < 0) {
      toast.error("Invalid fee amount");
      return;
    }
    updateDoctor(doctor.doctorId, { consultationFee: numFee });
    toast.success(`Fee for Dr. ${doctor.name} updated to $${numFee}`);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-32">
        <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          type="number"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          className="pl-8 h-9 text-slate-900 font-medium rounded-lg bg-slate-50 border-slate-200 focus:bg-white"
        />
      </div>
      <Button
        size="sm"
        onClick={handleSave}
        disabled={fee === doctor.consultationFee.toString()}
        className={fee === doctor.consultationFee.toString() ? "opacity-0" : "opacity-100 transition-opacity bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-secondary)]"}
      >
        Save
      </Button>
    </div>
  );
};

export default function DoctorFeesPage() {
  const { doctors } = useDoctorStore();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");



  const table = useTable({
    data: doctors,
    columns,
    features,
    onSortingChange: setSorting,
    state: {
      sorting,
      globalFilter,
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId);
      if (value == null) return false;
      return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
    },
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-10">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/admin/doctors">
          <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Fee Configuration</h2>
          <p className="text-slate-500 text-sm">Manage consultation fees across all doctors globally.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search doctors..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 h-10 bg-white border-slate-200 rounded-xl w-full focus-visible:ring-1 focus-visible:ring-[var(--brand-primary)]"
            />
          </div>
          <div className="text-sm text-slate-500 font-medium">
            {table.getFilteredRowModel().rows.length} Doctors total
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b-slate-200">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="py-3 text-slate-600 font-semibold text-xs uppercase tracking-wider text-center">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-slate-50/60 transition-colors border-b-slate-100"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-slate-500">
                    No doctors found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end space-x-2 py-4 px-6 bg-slate-50 border-t border-slate-200">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-lg h-9 border-slate-200"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-lg h-9 border-slate-200"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
