import { Globe, UserCheck, UserX } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchDashboardInsights } from "@/lib/api/dashboard";
import { formatCompensation, formatNumber } from "@/lib/format";
import type { DashboardInsights } from "@/types/dashboard";

const DEPARTMENT_COLORS = [
  "#6366f1",
  "#14b8a6",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

export function DashboardPage() {
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardInsights()
      .then(setInsights)
      .catch((fetchError: Error) => setError(fetchError.message));
  }, []);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (insights === null) {
    return <p className="text-sm text-slate-500">Loading dashboard…</p>;
  }

  const workforce = insights.workforceStatus.map((item) => ({
    name: item.status === "ACTIVE" ? "Active" : "Inactive",
    value: item.count,
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
          Analytics
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Salary Insights Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Organization-wide compensation trends, workforce distribution, and pay
          benchmarks.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          label="Active Employees"
          value={formatNumber(insights.kpis.activeEmployees)}
          icon={<UserCheck className="h-5 w-5 text-emerald-600" />}
        />
        <KpiCard
          label="Inactive Employees"
          value={formatNumber(insights.kpis.inactiveEmployees)}
          icon={<UserX className="h-5 w-5 text-slate-500" />}
        />
        <KpiCard
          label="Countries"
          value={formatNumber(insights.kpis.countries)}
          icon={<Globe className="h-5 w-5 text-indigo-500" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Average Salary by Country">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={insights.averageSalaryByCountry}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="country" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatCompensation(Number(value))} />
              <Bar dataKey="average" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Employees by Department"
          subtitle={`${formatNumber(
            insights.employeesByDepartment.reduce((sum, row) => sum + row.count, 0),
          )} total headcount`}
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={insights.employeesByDepartment}
                dataKey="count"
                nameKey="department"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
              >
                {insights.employeesByDepartment.map((entry, index) => (
                  <Cell
                    key={entry.department}
                    fill={DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Workforce Status"
          subtitle="Active vs inactive split"
          footer={`Total: ${formatNumber(
            workforce.reduce((sum, row) => sum + row.value, 0),
          )} employees`}
        >
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={workforce} dataKey="value" nameKey="name" innerRadius={65} outerRadius={95}>
                <Cell fill="#4f46e5" />
                <Cell fill="#c7d2fe" />
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 10 Highest Paid">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={insights.topHighestPaid} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatCompensation(Number(value))} />
              <Bar dataKey="amount" fill="#4f46e5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 10 Lowest Paid">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={insights.topLowestPaid} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatCompensation(Number(value))} />
              <Bar dataKey="amount" fill="#93c5fd" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Average Salary by Department">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={insights.averageSalaryByDepartment}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="department" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatCompensation(Number(value))} />
              <Bar dataKey="average" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Median Salary by Country"
          subtitle="Line trend across regions"
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={insights.medianSalaryByCountry}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="country" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatCompensation(Number(value))} />
              <Line
                type="monotone"
                dataKey="median"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ fill: "#6366f1", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">{icon}</div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  footer?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
      {footer ? <p className="mt-3 text-xs text-slate-500">{footer}</p> : null}
    </div>
  );
}
