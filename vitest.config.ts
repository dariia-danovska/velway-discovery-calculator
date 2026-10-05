import { defineConfig } from "vitest/config";

export default defineConfig({
  define: { __INTERNAL_PASS_HASH__: JSON.stringify("") },
  test: { include: ["tests/**/*.test.ts"] },
});
