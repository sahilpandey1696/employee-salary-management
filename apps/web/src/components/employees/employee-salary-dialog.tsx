"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createEmployeeSalary,
  fetchEmployeeSalary,
  updateEmployeeSalary,
} from "@/lib/api/salary";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Employee } from "@/types/employee";
import type { Salary } from "@/types/salary";

type EmployeeSalaryDialogProps = {
  employee: Employee;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
};

type PanelMode = "view" | "edit" | "create";

export function EmployeeSalaryDialog({
  employee,
  open,
  onOpenChange,
  onSaved,
}: EmployeeSalaryDialogProps) {
  const [salary, setSalary] = useState<Salary | null>(null);
  const [mode, setMode] = useState<PanelMode>("view");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);

  const loadSalary = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const record = await fetchEmployeeSalary(employee.id);
      setSalary(record);
      setMode(record === null ? "create" : "view");
      setAmount(record === null ? "" : String(record.amount));
    } catch (loadError) {
      setSalary(null);
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load salary",
      );
    } finally {
      setIsLoading(false);
    }
  }, [employee.id]);

  useEffect(() => {
    if (open) {
      void loadSalary();
    }
  }, [loadSalary, open]);

  async function handleCreate() {
    setIsSaving(true);
    setError(null);

    try {
      const parsedAmount = parseAmount(amount);
      const record = await createEmployeeSalary(employee.id, {
        amount: parsedAmount,
        currency: "USD",
        effectiveFrom: new Date().toISOString(),
      });
      setSalary(record);
      setMode("view");
      onSaved?.();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to create salary");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate() {
    setIsSaving(true);
    setError(null);

    try {
      const parsedAmount = parseAmount(amount);
      const record = await updateEmployeeSalary(employee.id, {
        amount: parsedAmount,
      });
      setSalary(record);
      setMode("view");
      setConfirmOpen(false);
      onSaved?.();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update salary");
    } finally {
      setIsSaving(false);
    }
  }

  function requestUpdateConfirmation() {
    try {
      setPendingAmount(parseAmount(amount));
      setConfirmOpen(true);
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : "Invalid salary amount",
      );
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent aria-describedby="salary-dialog-description">
          <DialogHeader>
            <DialogTitle>Salary record</DialogTitle>
            <DialogDescription id="salary-dialog-description">
              {employee.fullName} · {employee.employeeNumber}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div aria-label="Loading salary" className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error && mode === "view" && salary === null ? (
            <div
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          ) : mode === "view" && salary ? (
            <div className="space-y-4">
              <dl className="grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Amount</dt>
                  <dd className="font-semibold">
                    {formatCurrency(salary.amount, salary.currency)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Currency</dt>
                  <dd>{salary.currency}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Effective from</dt>
                  <dd>{formatDate(salary.effectiveFrom)}</dd>
                </div>
              </dl>
              <Button
                type="button"
                onClick={() => {
                  setMode("edit");
                  setAmount(String(salary.amount));
                  setError(null);
                }}
              >
                Edit salary
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {salary === null ? (
                <p className="text-sm text-muted-foreground">No salary on file</p>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="salary-amount">Salary amount</Label>
                <Input
                  id="salary-amount"
                  aria-label="Salary amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </div>

              {error ? (
                <p className="text-sm text-red-700" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="flex justify-end gap-2">
                {mode === "edit" ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setMode("view");
                        setAmount(String(salary?.amount ?? ""));
                        setError(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={requestUpdateConfirmation}
                      disabled={isSaving}
                    >
                      Save changes
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    onClick={() => void handleCreate()}
                    disabled={isSaving}
                  >
                    Create salary
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) {
            setPendingAmount(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm salary update</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAmount === null
                ? "Apply this salary update?"
                : `Update ${employee.fullName}'s salary to ${formatCurrency(
                    pendingAmount,
                    salary?.currency ?? "USD",
                  )}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleUpdate()}
              disabled={isSaving}
            >
              Confirm update
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function parseAmount(value: string): number {
  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Salary amount must be greater than zero");
  }

  if (Math.abs(parsed * 100 - Math.round(parsed * 100)) >= 1e-8) {
    throw new Error("Salary amount must have at most two decimal places");
  }

  return parsed;
}
