import {
  ArrowDown,
  ArrowUp,
  Eye,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteEmployee, fetchEmployees } from "@/lib/api/employees";
import { formatCompensation, getInitials } from "@/lib/format";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { Employee } from "@/types/employee";

const SORTABLE_COLUMNS = [
  { key: "fullName", label: "Employee" },
  { key: "email", label: "Email" },
  { key: "country", label: "Location" },
  { key: "department", label: "Department" },
  { key: "jobTitle", label: "Role" },
  { key: "employmentStatus", label: "Status" },
] as const;

export function EmployeesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") ?? "",
  );
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [data, setData] = useState<{
    items: Employee[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  const page = Number(searchParams.get("page") ?? "1");
  const sortBy = searchParams.get("sortBy") ?? "fullName";
  const sortDir = (searchParams.get("sortDir") ?? "asc") as "asc" | "desc";
  const employmentStatus = searchParams.get("employmentStatus") ?? "ALL";

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    const currentSearch = searchParams.get("search") ?? "";
    if (debouncedSearch !== currentSearch) {
      updateParams({ search: debouncedSearch || undefined, page: "1" });
    }
  }, [debouncedSearch, searchParams, updateParams]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchEmployees({
      page,
      pageSize: 20,
      search: debouncedSearch || undefined,
      employmentStatus: employmentStatus === "ALL" ? undefined : employmentStatus,
      sortBy,
      sortDir,
    })
      .then(setData)
      .catch((fetchError: Error) => {
        if (!controller.signal.aborted) {
          setError(fetchError.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [page, debouncedSearch, employmentStatus, sortBy, sortDir]);

  const toggleSort = (column: string) => {
    if (sortBy === column) {
      updateParams({
        sortBy: column,
        sortDir: sortDir === "asc" ? "desc" : "asc",
      });
      return;
    }
    updateParams({ sortBy: column, sortDir: "asc" });
  };

  const rangeStart = data === null || data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const rangeEnd =
    data === null ? 0 : Math.min(data.page * data.pageSize, data.total);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
            Workforce
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Employees</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Manage your organization directory, compensation, and employment status
            in one place.
          </p>
        </div>
        <Button
          className="bg-indigo-500 hover:bg-indigo-600"
          onClick={() => navigate("/employees/new")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add employee
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-700">
          <Filter className="h-4 w-4" />
          Search &amp; filters
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-10"
              placeholder="Search by code, name, or email..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <Select
            value={employmentStatus}
            onValueChange={(value) =>
              updateParams({ employmentStatus: value, page: "1" })
            }
          >
            <SelectTrigger className="w-full md:w-[220px]">
              <SelectValue placeholder="Employment status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Employment status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Team directory</h2>
            <p className="text-sm text-slate-500">
              {data ? `${data.total.toLocaleString()} total employees` : "—"}
            </p>
          </div>
          <p className="text-sm text-slate-500">
            {data && data.total > 0
              ? `${rangeStart.toLocaleString()}–${rangeEnd.toLocaleString()} of ${data.total.toLocaleString()}`
              : "0 results"}
          </p>
        </div>

        {error ? (
          <p className="px-6 py-8 text-sm text-red-600">{error}</p>
        ) : loading ? (
          <p className="px-6 py-8 text-sm text-slate-500">Loading employees…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {SORTABLE_COLUMNS.map((column) => (
                    <th key={column.key} className="px-4 py-3 font-medium">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-slate-800"
                        onClick={() => toggleSort(column.key)}
                      >
                        {column.label}
                        {sortBy === column.key ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUp className="h-3 w-3 opacity-30" />
                        )}
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3 font-medium">Compensation</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((employee) => (
                  <tr
                    key={employee.id}
                    className="border-b border-slate-50 hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                          {getInitials(employee.fullName)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {employee.fullName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {employee.employeeNumber}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{employee.email}</td>
                    <td className="px-4 py-4 text-slate-600">{employee.country}</td>
                    <td className="px-4 py-4 text-slate-600">{employee.department}</td>
                    <td className="px-4 py-4 text-slate-600">{employee.jobTitle}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={employee.employmentStatus} />
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {employee.compensation
                        ? formatCompensation(
                            employee.compensation.amount,
                            employee.compensation.currency,
                          )
                        : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/employees/${employee.id}`} aria-label="View">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            to={`/employees/${employee.id}/edit`}
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => setDeleteTarget(employee)}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.totalPages > 0 ? (
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onPageChange={(nextPage) => updateParams({ page: String(nextPage) })}
          />
        ) : null}
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteTarget?.fullName} from the
              directory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!deleteTarget) return;
                await deleteEmployee(deleteTarget.id);
                setDeleteTarget(null);
                const refreshed = await fetchEmployees({
                  page,
                  pageSize: 20,
                  search: debouncedSearch || undefined,
                  employmentStatus:
                    employmentStatus === "ALL" ? undefined : employmentStatus,
                  sortBy,
                  sortDir,
                });
                setData(refreshed);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
