import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

describe("Web test infrastructure", () => {
  it("renders with React Testing Library and jsdom", () => {
    render(<span role="status">ready</span>);
    expect(screen.getByRole("status")).toHaveTextContent("ready");
  });
});
