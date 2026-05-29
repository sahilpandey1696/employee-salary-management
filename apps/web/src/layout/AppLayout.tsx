import { LayoutGrid, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-sm font-bold text-white">
              HR
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900">
                Salary Management
              </p>
              <p className="text-xs text-slate-500">Enterprise HRMS</p>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) =>
                cn(
                  "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50",
                )
              }
            >
              <LayoutGrid className="h-4 w-4" />
              Dashboard
            </NavLink>
            <NavLink
              to="/employees"
              className={({ isActive }) =>
                cn(
                  "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50",
                )
              }
            >
              <Users className="h-4 w-4" />
              Employees
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
