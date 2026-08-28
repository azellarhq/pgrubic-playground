// Editors

import { editor } from "monaco-editor/esm/vs/editor/editor.api";
import "monaco-editor/esm/vs/basic-languages/sql/sql.contribution";

const defaultSql = "CREATE TABLE users (id INT, name TEXT);";

const sharedEditorOptions = {
  theme: "vs",
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbersMinChars: 0,
  lineDecorationsWidth: 0,
  overviewRulerLanes: 0,
  fontSize: 13,
  lineHeight: 21,
  fontFamily: "Roboto Mono, SFMono-Regular, Consolas, monospace",
  padding: { top: 10, bottom: 10 },
  automaticLayout: true,
};

const configEditor = editor.create(document.getElementById("configEditor"), {
  ...sharedEditorOptions,
  value: "",
  language: "toml",
  ariaLabel: "pgrubic configuration in TOML",
});

const sqlEditor = editor.create(document.getElementById("sqlEditor"), {
  ...sharedEditorOptions,
  value: "",
  language: "sql",
  ariaLabel: "SQL source",
});

const outputEditor = editor.create(document.getElementById("sqlOutput"), {
  ...sharedEditorOptions,
  value: "",
  language: "sql",
  readOnly: true,
  domReadOnly: true,
  renderLineHighlight: "none",
  ariaLabel: "Formatted or fixed SQL output",
});

export { defaultSql, configEditor, sqlEditor, outputEditor };
