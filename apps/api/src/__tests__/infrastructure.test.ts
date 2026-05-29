import { describe, expect, it } from "vitest";

describe("API test infrastructure", () => {
  it("executes tests with Vitest and TypeScript", () => {
    expect(process.env.NODE_ENV ?? "test").toBe("test");
  });
});
