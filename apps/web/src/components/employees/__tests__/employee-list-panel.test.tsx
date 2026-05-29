import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmployeeListPanel } from "../employee-list-panel";
import { fetchEmployees } from "@/lib/api/employees";

vi.mock("@/lib/api/employees", () => ({
  fetchEmployees: vi.fn(),
}));

const mockEmployees = {
  items: [
    {
      id: "1",
      employeeNumber: "E100",
      fullName: "Alice Anderson",
      country: "US",
      department: "Engineering",
    },
  ],
  total: 1,
  page: 1,
  pageSize: 25,
  totalPages: 1,
};

describe("EmployeeListPanel", () => {
  beforeEach(() => {
    vi.mocked(fetchEmployees).mockReset();
  });

  it("shows a loading skeleton while employees are loading", () => {
    vi.mocked(fetchEmployees).mockReturnValue(new Promise(() => undefined));

    render(<EmployeeListPanel />);

    expect(screen.getByLabelText("Loading employees")).toBeInTheDocument();
  });

  it("renders employees after a successful fetch", async () => {
    vi.mocked(fetchEmployees).mockResolvedValue(mockEmployees);

    render(<EmployeeListPanel />);

    expect(await screen.findByText("Alice Anderson")).toBeInTheDocument();
    expect(screen.getByText("E100")).toBeInTheDocument();
    expect(screen.getByText("Showing 1–1 of 1 employees")).toBeInTheDocument();
  });

  it("shows an empty state when no employees match", async () => {
    vi.mocked(fetchEmployees).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 25,
      totalPages: 0,
    });

    render(<EmployeeListPanel />);

    expect(await screen.findByText("No employees found")).toBeInTheDocument();
  });

  it("shows an error state when the fetch fails", async () => {
    vi.mocked(fetchEmployees).mockRejectedValue(new Error("Network error"));

    render(<EmployeeListPanel />);

    expect(await screen.findByText("Network error")).toBeInTheDocument();
  });

  it("requests filtered results when search changes", async () => {
    vi.mocked(fetchEmployees).mockResolvedValue(mockEmployees);
    const user = userEvent.setup();

    render(<EmployeeListPanel />);
    await screen.findByText("Alice Anderson");

    await user.type(screen.getByLabelText("Search employees"), "alice");

    await waitFor(
      () => {
        expect(fetchEmployees).toHaveBeenLastCalledWith(
          expect.objectContaining({ search: "alice", page: 1 }),
        );
      },
      { timeout: 800 },
    );
  });
});
