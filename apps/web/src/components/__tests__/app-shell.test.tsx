import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "../app-shell";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("AppShell", () => {
  it("renders product branding and primary navigation", () => {
    render(<AppShell>Page content</AppShell>);

    const sidebar = screen.getByLabelText("Sidebar");
    const navigation = within(sidebar).getByRole("navigation", { name: "Main" });

    expect(within(sidebar).getByText("Salary Management")).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(within(navigation).getByRole("link", { name: "Employees" })).toHaveAttribute(
      "href",
      "/employees",
    );
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });
});
