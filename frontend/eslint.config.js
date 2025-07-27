import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";

export default defineConfig([
  {
    extends: ["js/recommended"], files: ["**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.browser }, plugins: { js },
    rules: {
      "quotes": ["error", "double"],
      "semi": ["error", "always"],
    }
  },
]);
