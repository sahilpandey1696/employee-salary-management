"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchDashboardSummary } from "@/lib/api/dashboard";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { DashboardSummary } from "@/types/dashboard";

export function DashboardPanel() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchDashboardSummary();
        setSummary(data);
      } catch (loadError) {
        setSummary(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load dashboard summary",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadSummary();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Payroll distribution and compensation insights across your workforce.
        </p>
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : error ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      ) : summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard
              label="Total payroll"
              value={formatCurrency(summary.totalPayroll)}
            />
            <MetricCard
              label="Average salary"
              value={formatCurrency(summary.averageSalary)}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Country breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {summary.countryBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No employee data available yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Country</TableHead>
                      <TableHead className="text-right">Headcount</TableHead>
                      <TableHead className="text-right">Payroll</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.countryBreakdown.map((row) => (
                      <TableRow key={row.country}>
                        <TableCell className="font-medium">{row.country}</TableCell>
                        <TableCell className="text-right">{row.headcount}</TableCell>
                        <TableCell className="text-right">
                          {formatNumber(row.payroll)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-label="Loading dashboard" className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
