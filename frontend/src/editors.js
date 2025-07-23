// Editors

import { editor } from "monaco-editor/esm/vs/editor/editor.api";
import "monaco-editor/esm/vs/basic-languages/sql/sql.contribution";

const defaultConfig = `[lint]
postgres-target-version = 14
select = []
ignore = []
fixable = []
unfixable = []
ignore-noqa = false
disallowed-schemas = []
allowed-extensions = []
allowed-languages = []
disallowed-data_types = []
required-columns = []
timestamp-column-suffix = "_at"
date-column-suffix = "_date"
regex-partition = "^.+$"
regex-index = "^.+$"
regex-constraint-primary_key = "^.+$"
regex-constraint-unique_key = "^.+$"
regex-constraint-foreign_key = "^.+$"
regex-constraint-check = "^.+$"
regex-constraint-exclusion = "^.+$"
regex-sequence = "^.+$"

[format]
comma-at-beginning = true
new-line-before-semicolon = false
remove-pg-catalog-from-functions = true
lines-between-statements = 1`;

const defaultSql = "CREATE TABLE users (id INT, name TEXT);"

/**
 * Replaces hyphens with underscores in a given string.
 *
 * @param {string} str - The string whose hyphens need to be replaced.
 * @returns {string} - The new string with hyphens replaced by underscores.
 */
function replaceHyphensWithUnderscores(str) {
  return str.replace(/-/g, "_");
}

/**
 * Recursively transforms the keys of an object or array by replacing hyphens with underscores.
 *
 * The function takes an object or array as an argument and returns a new object or array with
 * transformed keys. If the argument is an array, the function applies itself recursively to each
 * element of the array. If the argument is an object, the function applies itself recursively to
 * each value in the object, and then replaces the keys of the object with the result of calling
 * `replaceHyphensWithUnderscores` on each key. If the argument is neither an array nor an object,
 * the function simply returns the argument unchanged.
 *
 * @param {Object|Array} obj - The object or array whose keys need to be transformed.
 * @returns {Object|Array} - A new object or array with transformed keys.
 */
function transformKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(transformKeys);
  } else if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [replaceHyphensWithUnderscores(k), transformKeys(v)])
    );
  } else {
    return obj;
  }
}

const configEditor = editor.create(document.getElementById("configEditor"), {
  value: "",
  language: "toml",
  theme: "vs",
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbersMinChars: 0,
  lineDecorationsWidth: 0,
  overviewRulerLanes: 0,
  fontSize: 14,
  fontFamily: "monospace",
});

const sqlEditor = editor.create(document.getElementById("sqlEditor"), {
  value: "",
  language: "sql",
  theme: "vs",
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbersMinChars: 0,
  lineDecorationsWidth: 0,
  overviewRulerLanes: 0,
  fontSize: 14,
  fontFamily: "monospace",
});

export { transformKeys, defaultConfig, defaultSql, configEditor, sqlEditor };
