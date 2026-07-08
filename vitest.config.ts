import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    passWithNoTests: false,
    coverage: {
      provider: "v8",
      include: [
        "src/lib/core/ai-review/deterministic-review.ts",
        "src/lib/core/ai-review/validate-output.ts",
        "src/lib/core/ai-review/transcript-sanitizer.ts"
      ],
      reporter: ["text", "json-summary"]
    }
  }
});
