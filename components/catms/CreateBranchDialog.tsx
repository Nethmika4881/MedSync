"use client";

import { useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const branchSchema = z.object({
  branchName: z.string().trim().min(1, "Enter a branch name.").max(100),
  addressLine1: z.string().trim().min(1, "Enter an address.").max(100),
  addressLine2: z.string().trim().max(100),
  city: z.string().trim().min(1, "Enter a city.").max(50),
  province: z.string().trim().max(50),
  postalCode: z.string().trim().max(10),
  country: z.string().trim().max(50),
  phone: z.string().trim().max(20),
  phoneType: z.enum(["Mobile", "Home", "Work"]),
  openedDate: z.string(),
  isActive: z.boolean(),
});

type BranchFormValues = z.infer<typeof branchSchema>;

type TextField = {
  name:
    | "branchName"
    | "addressLine1"
    | "addressLine2"
    | "city"
    | "province"
    | "postalCode"
    | "country"
    | "phone";
  label: string;
  maxLength: number;
  required?: boolean;
  type?: "text" | "tel";
};

const textFields: TextField[] = [
  { name: "branchName", label: "Branch name", maxLength: 100, required: true },
  { name: "addressLine1", label: "Address line 1", maxLength: 100, required: true },
  { name: "addressLine2", label: "Address line 2", maxLength: 100 },
  { name: "city", label: "City", maxLength: 50, required: true },
  { name: "province", label: "Province", maxLength: 50 },
  { name: "postalCode", label: "Postal code", maxLength: 10 },
  { name: "country", label: "Country", maxLength: 50 },
  { name: "phone", label: "Phone number", maxLength: 20, type: "tel" },
];

const defaultValues: BranchFormValues = {
  branchName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  province: "",
  postalCode: "",
  country: "Sri Lanka",
  phone: "",
  phoneType: "Work",
  openedDate: "",
  isActive: true,
};

export function CreateBranchDialog(): ReactElement {
  const [open, setOpen] = useState(false);
  const [previewMessage, setPreviewMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues,
  });

  function handleOpenChange(nextOpen: boolean): void {
    setOpen(nextOpen);
    if (!nextOpen) {
      reset(defaultValues);
      setPreviewMessage("");
    }
  }

  function handleValidPreview(values: BranchFormValues): void {
    setPreviewMessage(
      `Details for ${values.branchName} passed validation. No branch has been created or saved.`
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          className="h-10 rounded-xl bg-[var(--brand-primary)] px-5 text-white hover:bg-[var(--brand-secondary)]"
        >
          <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" />
          New Branch
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New branch</DialogTitle>
          <DialogDescription>
            Enter the branch details. Fields marked * are required.
          </DialogDescription>
        </DialogHeader>

        <form
          noValidate
          className="space-y-6"
          onSubmit={handleSubmit(handleValidPreview)}
          onChange={() => setPreviewMessage("")}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {textFields.map((field) => {
              const inputId = `branch-${field.name}`;
              const error = errors[field.name];

              return (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={inputId}>
                    {field.label}{field.required ? " *" : ""}
                  </Label>
                  <Input
                    id={inputId}
                    type={field.type ?? "text"}
                    maxLength={field.maxLength}
                    required={field.required}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${inputId}-error` : undefined}
                    {...register(field.name)}
                  />
                  {error && (
                    <p id={`${inputId}-error`} className="text-sm text-destructive" role="alert">
                      {error.message}
                    </p>
                  )}
                </div>
              );
            })}

            <div className="space-y-2">
              <Label htmlFor="branch-phoneType">Phone type</Label>
              <select
                id="branch-phoneType"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register("phoneType")}
              >
                <option value="Work">Work</option>
                <option value="Mobile">Mobile</option>
                <option value="Home">Home</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch-openedDate">Opening date</Label>
              <Input id="branch-openedDate" type="date" {...register("openedDate")} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="branch-isActive"
              type="checkbox"
              className="h-4 w-4 accent-[var(--brand-primary)]"
              {...register("isActive")}
            />
            <Label htmlFor="branch-isActive">Active branch</Label>
          </div>

          <p className="text-sm text-muted-foreground">
            Preview only: checking details does not save a branch. Closing this form clears its contents.
          </p>

          {previewMessage && (
            <p role="status" className="rounded-md border border-border bg-muted p-3 text-sm">
              {previewMessage}
            </p>
          )}

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              type="submit"
              className="bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-secondary)]"
            >
              Check details
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}