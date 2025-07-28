import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";

export default defineConfig([
  {
    ignores: [".vite/**/*", "node_modules", "dist/", "build/"],
  },
  {
    extends: ["js/recommended"],
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: { globals: globals.browser },
    plugins: { js },
    rules: {
      quotes: ["error", "double"],
      semi: ["error", "always"],
      "no-console": "error",
      indent: ["error", 2],
    },
  },
]);
