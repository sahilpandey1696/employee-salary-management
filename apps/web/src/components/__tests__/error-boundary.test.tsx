import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "../error-boundary";

function BrokenComponent(): never {
  throw new Error("Render failure");
}

describe("ErrorBoundary", () => {
  it("renders a fallback when a child component throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Something went wrong loading this section.",
    );
  });
});
