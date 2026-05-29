import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppLayout } from "@/layout/AppLayout";

describe("App shell", () => {
  it("renders enterprise branding", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<AppLayout />} path="/">
            <Route path="dashboard" element={<div>Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Salary Management")).toBeInTheDocument();
    expect(screen.getByText("Enterprise HRMS")).toBeInTheDocument();
  });
});
