import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardPanel } from "../dashboard-panel";
import { fetchDashboardSummary } from "@/lib/api/dashboard";

vi.mock("@/lib/api/dashboard", () => ({
  fetchDashboardSummary: vi.fn(),
}));

const summary = {
  totalPayroll: 210_000,
  averageSalary: 70_000,
  countryBreakdown: [
    { country: "DE", payroll: 0, headcount: 1 },
    { country: "UK", payroll: 60_000, headcount: 1 },
    { country: "US", payroll: 150_000, headcount: 2 },
  ],
};

describe("DashboardPanel", () => {
  beforeEach(() => {
    vi.mocked(fetchDashboardSummary).mockReset();
  });

  it("shows loading skeletons while data is loading", () => {
    vi.mocked(fetchDashboardSummary).mockReturnValue(new Promise(() => undefined));

    render(<DashboardPanel />);

    expect(screen.getByLabelText("Loading dashboard")).toBeInTheDocument();
  });

  it("renders payroll metrics and country breakdown", async () => {
    vi.mocked(fetchDashboardSummary).mockResolvedValue(summary);

    render(<DashboardPanel />);

    expect(await screen.findByText("Total payroll")).toBeInTheDocument();
    expect(screen.getByText("$210,000.00")).toBeInTheDocument();
    expect(screen.getByText("Average salary")).toBeInTheDocument();
    expect(screen.getByText("$70,000.00")).toBeInTheDocument();
    expect(screen.getByText("US")).toBeInTheDocument();
    expect(screen.getByText("150,000")).toBeInTheDocument();
  });

  it("shows an error state when the summary request fails", async () => {
    vi.mocked(fetchDashboardSummary).mockRejectedValue(new Error("Service unavailable"));

    render(<DashboardPanel />);

    expect(await screen.findByText("Service unavailable")).toBeInTheDocument();
  });
});
