import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import prettier from "prettier";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

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
  prettier,
  prettierConfig,
  {
    plugins: { prettier: prettierPlugin },
    rules: {
      "prettier/prettier": "error",
    },
  },
]);
