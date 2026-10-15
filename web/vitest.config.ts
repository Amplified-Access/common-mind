import path from "node:path";

import { defineConfig } from "vitest/config";

// Unit tests for lib/ logic (AGENTS.md → Testing). Components with
// behaviour would add jsdom and @testing-library/react.
export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/.next/**"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
