import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { fetchEmployee } from "@/lib/api/employees";
import { formatCompensation, formatDate } from "@/lib/format";
import type { Employee } from "@/types/employee";

export function EmployeeDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const savedEmployee = (location.state as { employee?: Employee } | null)
    ?.employee;
  const [employee, setEmployee] = useState<Employee | null>(
    savedEmployee ?? null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    if (savedEmployee?.id === id) {
      setEmployee(savedEmployee);
      return;
    }

    fetchEmployee(id)
      .then(setEmployee)
      .catch((fetchError: Error) => setError(fetchError.message));
  }, [id, savedEmployee]);

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader />
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-4">
        <PageHeader />
        <p className="text-sm text-slate-500">Loading employee details…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader employeeId={employee.id} />

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="grid gap-8 md:grid-cols-2">
          <DetailItem label="Name" value={employee.fullName} />
          <DetailItem label="Employee Code" value={employee.employeeNumber} />
          <DetailItem label="Email" value={employee.email} />
          <DetailItem label="Phone" value={employee.phone ?? "—"} />
          <DetailItem label="Country" value={employee.country} />
          <DetailItem label="Department" value={employee.department} />
          <DetailItem label="Job Title" value={employee.jobTitle} />
          <DetailItem
            label="Salary"
            value={
              employee.compensation
                ? formatCompensation(
                    employee.compensation.amount,
                    employee.compensation.currency,
                  )
                : "—"
            }
          />
          <DetailItem label="Joining Date" value={formatDate(employee.joiningDate)} />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Status
            </p>
            <div className="mt-2">
              <StatusBadge status={employee.employmentStatus} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageHeader({ employeeId }: { employeeId?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/employees" aria-label="Back to employees">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-slate-900">Employee Details</h1>
      </div>
      {employeeId ? (
        <Button variant="outline" asChild>
          <Link to={`/employees/${employeeId}/edit`}>Edit</Link>
        </Button>
      ) : null}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-base text-slate-900">{value}</p>
    </div>
  );
}
