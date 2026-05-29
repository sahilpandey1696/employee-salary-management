import { ArrowLeft, UserPlus } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createEmployee,
  fetchEmployee,
  fetchNextEmployeeCode,
  updateEmployee,
} from "@/lib/api/employees";
import { COUNTRIES, CURRENCIES } from "@/lib/constants";

type FormState = {
  firstName: string;
  lastName: string;
  employeeNumber: string;
  email: string;
  phone: string;
  country: string;
  department: string;
  jobTitle: string;
  currency: string;
  annualSalary: string;
  joiningDate: string;
  employmentStatus: string;
};

const emptyForm: FormState = {
  firstName: "",
  lastName: "",
  employeeNumber: "",
  email: "",
  phone: "",
  country: "",
  department: "",
  jobTitle: "",
  currency: "USD",
  annualSalary: "1",
  joiningDate: new Date().toISOString().slice(0, 10),
  employmentStatus: "ACTIVE",
};

export function EmployeeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCode, setLoadingCode] = useState(!isEdit);
  const [loadingEmployee, setLoadingEmployee] = useState(isEdit);
  const savedCompensation = useRef<{ amount: number; currency: string } | null>(
    null,
  );
  const salaryEditable = !isEdit || form.employmentStatus === "ACTIVE";

  useEffect(() => {
    if (isEdit && id) {
      setLoadingEmployee(true);
      fetchEmployee(id)
        .then((employee) => {
        savedCompensation.current = employee.compensation;
        setForm({
          firstName: employee.firstName,
          lastName: employee.lastName,
          employeeNumber: employee.employeeNumber,
          email: employee.email,
          phone: employee.phone ?? "",
          country: employee.country,
          department: employee.department,
          jobTitle: employee.jobTitle,
          currency: (employee.compensation?.currency ?? "USD").toUpperCase(),
          annualSalary:
            employee.compensation === null
              ? ""
              : String(employee.compensation.amount),
          joiningDate: employee.joiningDate.slice(0, 10),
          employmentStatus: employee.employmentStatus,
        });
      })
        .finally(() => setLoadingEmployee(false));
      return;
    }

    let cancelled = false;
    setLoadingCode(true);

    fetchNextEmployeeCode()
      .then(({ employeeNumber }) => {
        if (!cancelled) {
          setForm((current) => ({ ...current, employeeNumber }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load the next employee code. Please refresh the page.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingCode(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const updateField = (field: keyof FormState, value: string) => {
    if (field === "employmentStatus" && !isEdit) {
      return;
    }

    if (field === "employmentStatus") {
      setForm((current) => {
        const next = {
          ...current,
          employmentStatus: value,
          annualSalary: value === "ACTIVE" ? current.annualSalary : "",
        };

        if (value !== "ACTIVE") {
          return next;
        }

        if (current.annualSalary.trim().length > 0) {
          return next;
        }

        const savedAmount = savedCompensation.current?.amount;
        return {
          ...next,
          annualSalary:
            savedAmount === undefined ? "" : String(savedAmount),
          currency: savedCompensation.current?.currency ?? current.currency,
        };
      });
      return;
    }

    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    if (form.country.trim().length === 0) {
      setError("Please select a country.");
      setSubmitting(false);
      return;
    }

    const isActive = form.employmentStatus === "ACTIVE";
    const salaryText = form.annualSalary.trim();
    const parsedSalary =
      salaryText.length === 0 ? undefined : Number(salaryText);

    if (isActive) {
      if (
        parsedSalary === undefined ||
        !Number.isFinite(parsedSalary) ||
        parsedSalary <= 0
      ) {
        setError(
          "Active employees must have an annual salary greater than zero.",
        );
        setSubmitting(false);
        return;
      }
    } else if (
      parsedSalary !== undefined &&
      (!Number.isFinite(parsedSalary) || parsedSalary <= 0)
    ) {
      setError("Annual salary must be greater than zero when provided.");
      setSubmitting(false);
      return;
    }

    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone || undefined,
      country: form.country,
      department: form.department,
      jobTitle: form.jobTitle,
      employmentStatus: isEdit ? form.employmentStatus : "ACTIVE",
      joiningDate: new Date(form.joiningDate).toISOString(),
      currency: form.currency,
      ...(parsedSalary !== undefined ? { annualSalary: parsedSalary } : {}),
    };

    try {
      const saved =
        isEdit && id
          ? await updateEmployee(id, payload)
          : await createEmployee(payload);
      navigate(`/employees/${saved.id}`, {
        state: { employee: saved },
        replace: true,
      });
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Save failed";
      setError(message);
      if (!isEdit) {
        fetchNextEmployeeCode().then(({ employeeNumber }) => {
          setForm((current) => ({ ...current, employeeNumber }));
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/employees" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEdit ? "Edit employee" : "Add employee"}
          </h1>
          <p className="text-sm text-slate-500">
            Fill in the form to {isEdit ? "update" : "add"} someone to the directory.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Personal Details</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="First name" value={form.firstName} onChange={(value) => updateField("firstName", value)} />
            <Field label="Last name" value={form.lastName} onChange={(value) => updateField("lastName", value)} />
            <div className="md:col-span-2">
              <Field
                label="Employee code"
                value={loadingCode ? "" : form.employeeNumber}
                onChange={(value) => updateField("employeeNumber", value)}
                disabled={isEdit || loadingCode}
                placeholder={loadingCode ? "Generating code…" : undefined}
                hint={isEdit ? undefined : "Auto-generated code"}
              />
            </div>
            <div>
              <Label>Country</Label>
              <Select
                value={form.country}
                onValueChange={(value) => updateField("country", value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countryOptions(form.country).map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Field label="Work email" value={form.email} onChange={(value) => updateField("email", value)} type="email" />
            <Field label="Phone number" value={form.phone} onChange={(value) => updateField("phone", value)} />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Job &amp; Compensation</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Job title" value={form.jobTitle} onChange={(value) => updateField("jobTitle", value)} />
            <Field label="Department" value={form.department} onChange={(value) => updateField("department", value)} />
            <div>
              <Label>Currency</Label>
              <Select
                value={form.currency}
                onValueChange={(value) => updateField("currency", value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions(form.currency).map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Field
              label="Annual salary"
              value={form.annualSalary}
              onChange={(value) => updateField("annualSalary", value)}
              inputMode="decimal"
              disabled={!salaryEditable || loadingEmployee}
              placeholder="Enter annual salary"
              required={salaryEditable}
              hint={
                salaryEditable
                  ? "Required — enter annual salary"
                  : "Set employment status to Active to enter salary"
              }
            />
            <Field
              label="Joining date"
              value={form.joiningDate}
              onChange={(value) => updateField("joiningDate", value)}
              type="date"
            />
            {isEdit ? (
              <div>
                <Label>Employment status</Label>
                <Select
                  value={form.employmentStatus}
                  onValueChange={(value) => updateField("employmentStatus", value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
        </section>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" asChild>
            <Link to="/employees">Cancel</Link>
          </Button>
          <Button
            type="submit"
            className="bg-indigo-500 hover:bg-indigo-600"
            disabled={submitting}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {isEdit ? "Save changes" : "Create employee"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function countryOptions(current: string): string[] {
  const trimmed = current.trim();
  if (trimmed.length === 0 || COUNTRIES.includes(trimmed as (typeof COUNTRIES)[number])) {
    return [...COUNTRIES];
  }
  return [trimmed, ...COUNTRIES];
}

function currencyOptions(current: string): string[] {
  const normalized = current.trim().toUpperCase();
  if (normalized.length === 0 || CURRENCIES.includes(normalized as (typeof CURRENCIES)[number])) {
    return [...CURRENCIES];
  }
  return [normalized, ...CURRENCIES];
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  disabled,
  hint,
  placeholder,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: "decimal" | "numeric";
  disabled?: boolean;
  hint?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        className="mt-2 disabled:bg-slate-100 disabled:text-slate-500"
        type={type}
        inputMode={inputMode}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        required={required && !disabled}
      />
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
