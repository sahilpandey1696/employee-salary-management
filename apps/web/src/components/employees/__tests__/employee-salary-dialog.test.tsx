import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmployeeSalaryDialog } from "../employee-salary-dialog";
import {
  createEmployeeSalary,
  fetchEmployeeSalary,
  updateEmployeeSalary,
} from "@/lib/api/salary";

vi.mock("@/lib/api/salary", () => ({
  fetchEmployeeSalary: vi.fn(),
  createEmployeeSalary: vi.fn(),
  updateEmployeeSalary: vi.fn(),
}));

const employee = {
  id: "emp-1",
  employeeNumber: "E100",
  fullName: "Alice Anderson",
  country: "US",
  department: "Engineering",
};

const activeSalary = {
  id: "sal-1",
  employeeId: "emp-1",
  amount: 85_000,
  currency: "USD",
  effectiveFrom: "2024-03-01T00:00:00.000Z",
  isActive: true,
};

describe("EmployeeSalaryDialog", () => {
  beforeEach(() => {
    vi.mocked(fetchEmployeeSalary).mockReset();
    vi.mocked(createEmployeeSalary).mockReset();
    vi.mocked(updateEmployeeSalary).mockReset();
  });

  it("shows salary details when an active record exists", async () => {
    vi.mocked(fetchEmployeeSalary).mockResolvedValue(activeSalary);

    render(
      <EmployeeSalaryDialog
        employee={employee}
        open
        onOpenChange={() => undefined}
      />,
    );

    expect(await screen.findByText("$85,000.00")).toBeInTheDocument();
    expect(screen.getByText("USD")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit salary" })).toBeInTheDocument();
  });

  it("shows a create form when no active salary exists", async () => {
    vi.mocked(fetchEmployeeSalary).mockResolvedValue(null);

    render(
      <EmployeeSalaryDialog
        employee={employee}
        open
        onOpenChange={() => undefined}
      />,
    );

    expect(await screen.findByText("No salary on file")).toBeInTheDocument();
    expect(screen.getByLabelText("Salary amount")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create salary" })).toBeInTheDocument();
  });

  it("creates a salary record from the form", async () => {
    vi.mocked(fetchEmployeeSalary).mockResolvedValue(null);
    vi.mocked(createEmployeeSalary).mockResolvedValue({
      ...activeSalary,
      amount: 72_000,
    });

    const user = userEvent.setup();

    render(
      <EmployeeSalaryDialog
        employee={employee}
        open
        onOpenChange={() => undefined}
      />,
    );

    await screen.findByText("No salary on file");
    await user.clear(screen.getByLabelText("Salary amount"));
    await user.type(screen.getByLabelText("Salary amount"), "72000");
    await user.click(screen.getByRole("button", { name: "Create salary" }));

    await waitFor(() => {
      expect(createEmployeeSalary).toHaveBeenCalledWith("emp-1", {
        amount: 72_000,
        currency: "USD",
        effectiveFrom: expect.any(String),
      });
    });
  });

  it("requires confirmation before updating a salary", async () => {
    vi.mocked(fetchEmployeeSalary).mockResolvedValue(activeSalary);
    vi.mocked(updateEmployeeSalary).mockResolvedValue({
      ...activeSalary,
      amount: 90_000,
    });

    const user = userEvent.setup();

    render(
      <EmployeeSalaryDialog
        employee={employee}
        open
        onOpenChange={() => undefined}
      />,
    );

    await screen.findByText("$85,000.00");
    await user.click(screen.getByRole("button", { name: "Edit salary" }));
    await user.clear(screen.getByLabelText("Salary amount"));
    await user.type(screen.getByLabelText("Salary amount"), "90000");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      screen.getByText("Confirm salary update"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm update" }));

    await waitFor(() => {
      expect(updateEmployeeSalary).toHaveBeenCalledWith("emp-1", {
        amount: 90_000,
      });
    });
  });
});
