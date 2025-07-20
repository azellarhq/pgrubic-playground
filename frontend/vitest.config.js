import { coverageConfigDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    silent: true,
    environment: "jsdom",
    setupFiles: "./vitest.setup.js",
    coverage: {
      // thresholds: {
      //   lines: 100,
      //   functions: 100,
      //   branches: 100
      // },
      exclude: ["public/config.js", ...coverageConfigDefaults.exclude],
      reporter: ['text', 'json-summary', 'json'],
      reportOnFailure: true,
    }
  },
})
