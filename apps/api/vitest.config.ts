import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globals: false,
    env: {
      DATABASE_URL: "file:./prisma/test.db",
    },
  },
});
