"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fetchEmployees } from "@/lib/api/employees";
import { COUNTRIES, DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { EmployeeSalaryDialog } from "@/components/employees/employee-salary-dialog";
import type { Employee } from "@/types/employee";
import type { EmployeeListResponse } from "@/types/employee";

function formatResultsLabel(data: EmployeeListResponse): string {
  if (data.total === 0) {
    return "Showing 0 employees";
  }

  const start = (data.page - 1) * data.pageSize + 1;
  const end = Math.min(data.page * data.pageSize, data.total);
  return `Showing ${start}–${end} of ${data.total} employees`;
}

export function EmployeeListPanel() {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<EmployeeListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEmployees() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchEmployees(
          {
            page,
            pageSize: DEFAULT_PAGE_SIZE,
            search: debouncedSearch || undefined,
            country: country || undefined,
          },
          controller.signal,
        );
        setData(response);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        setData(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load employees",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadEmployees();

    return () => {
      controller.abort();
    };
  }, [country, debouncedSearch, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, country]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Employees</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Search, filter, and browse employee records.
        </p>
      </div>

      <Card>
        <CardHeader className="gap-4 space-y-0 md:flex-row md:items-end md:justify-between">
          <CardTitle className="text-base">Employee directory</CardTitle>
          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
            <div className="relative md:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search employees"
                className="pl-9"
                placeholder="Search name or ID"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Select
              value={country || "all"}
              onValueChange={(value) =>
                setCountry(value === "all" ? "" : value)
              }
            >
              <SelectTrigger aria-label="Filter by country" className="md:w-44">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                {COUNTRIES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <EmployeeTableSkeleton />
          ) : error ? (
            <div
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          ) : data?.items.length === 0 ? (
            <div className="rounded-lg border border-dashed px-4 py-12 text-center">
              <p className="font-medium">No employees found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or country filter.
              </p>
            </div>
          ) : data ? (
            <>
              <p className="text-sm text-muted-foreground">
                {formatResultsLabel(data)}
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        {employee.employeeNumber}
                      </TableCell>
                      <TableCell>{employee.fullName}</TableCell>
                      <TableCell>{employee.country}</TableCell>
                      <TableCell>{employee.department ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedEmployee(employee)}
                        >
                          Manage salary
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Page {data.page} of {Math.max(data.totalPages, 1)}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.page >= data.totalPages}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {selectedEmployee ? (
        <EmployeeSalaryDialog
          employee={selectedEmployee}
          open
          onOpenChange={(open) => {
            if (!open) {
              setSelectedEmployee(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}

function EmployeeTableSkeleton() {
  return (
    <div aria-label="Loading employees" className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}
