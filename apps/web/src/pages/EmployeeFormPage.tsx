import { ArrowLeft, UserPlus } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
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

  useEffect(() => {
    if (isEdit && id) {
      fetchEmployee(id).then((employee) => {
        setForm({
          firstName: employee.firstName,
          lastName: employee.lastName,
          employeeNumber: employee.employeeNumber,
          email: employee.email,
          phone: employee.phone ?? "",
          country: employee.country,
          department: employee.department,
          jobTitle: employee.jobTitle,
          currency: employee.compensation?.currency ?? "USD",
          annualSalary: String(employee.compensation?.amount ?? 1),
          joiningDate: employee.joiningDate.slice(0, 10),
          employmentStatus: employee.employmentStatus,
        });
      });
      return;
    }

    fetchNextEmployeeCode().then(({ employeeNumber }) => {
      setForm((current) => ({ ...current, employeeNumber }));
    });
  }, [id, isEdit]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      employeeNumber: form.employeeNumber,
      email: form.email,
      phone: form.phone || undefined,
      country: form.country,
      department: form.department,
      jobTitle: form.jobTitle,
      employmentStatus: form.employmentStatus,
      joiningDate: new Date(form.joiningDate).toISOString(),
      currency: form.currency,
      annualSalary: Number(form.annualSalary),
    };

    try {
      const saved =
        isEdit && id
          ? await updateEmployee(id, payload)
          : await createEmployee(payload);
      navigate(`/employees/${saved.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Save failed");
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
                value={form.employeeNumber}
                onChange={(value) => updateField("employeeNumber", value)}
                disabled={isEdit}
                hint={isEdit ? undefined : "Auto-generated code"}
              />
            </div>
            <Field label="Country" value={form.country} onChange={(value) => updateField("country", value)} />
            <Field label="Work email" value={form.email} onChange={(value) => updateField("email", value)} type="email" />
            <Field label="Phone number" value={form.phone} onChange={(value) => updateField("phone", value)} />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Job &amp; Compensation</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Job title" value={form.jobTitle} onChange={(value) => updateField("jobTitle", value)} />
            <Field label="Department" value={form.department} onChange={(value) => updateField("department", value)} />
            <Field label="Currency" value={form.currency} onChange={(value) => updateField("currency", value)} />
            <Field
              label="Annual salary"
              value={form.annualSalary}
              onChange={(value) => updateField("annualSalary", value)}
              type="number"
            />
            <Field
              label="Joining date"
              value={form.joiningDate}
              onChange={(value) => updateField("joiningDate", value)}
              type="date"
            />
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

function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        className="mt-2"
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        required
      />
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
