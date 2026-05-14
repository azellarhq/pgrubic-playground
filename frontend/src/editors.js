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
allowed-extensions = []
allowed-languages = []
disallowed-schemas = []
disallowed-data-types = []
required-columns = []
timestamp-column-suffix = "_at"
date-column-suffix = "_date"
regex-partition = "^.+$"
regex-index = "^.+$"
regex-constraint-primary-key = "^.+$"
regex-constraint-unique-key = "^.+$"
regex-constraint-foreign-key = "^.+$"
regex-constraint-check = "^.+$"
regex-constraint-exclusion = "^.+$"
regex-sequence = "^.+$"

[format]
comma-at-beginning = true
new-line-before-semicolon = false
remove-pg-catalog-from-functions = true
lines-between-statements = 1`;

const defaultSql = "CREATE TABLE users (id INT, name TEXT);";

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

function setTheme(isDark) {
  const theme = isDark ? "vs-dark" : "vs";
  if (configEditor) configEditor.updateOptions({ theme });
  if (sqlEditor) sqlEditor.updateOptions({ theme });
}

export { defaultConfig, defaultSql, configEditor, sqlEditor, setTheme };
