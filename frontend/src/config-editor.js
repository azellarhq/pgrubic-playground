import { editor } from "monaco-editor";
import { notify } from "./utils";

const defaultConfigTOML = `[lint]
postgres-target-version = 14
select = []
ignore = []
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

export const configEditor = editor.create(document.getElementById("configEditor"), {
  value: defaultConfigTOML,
  language: "toml",
  theme: "vs-light",
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbersMinChars: 0,
  lineDecorationsWidth: 0,
  overviewRulerLanes: 0,
});

document.getElementById("resetConfigBtn").onclick = () => {
  configEditor.setValue(defaultConfigTOML);
  notify("Configuration reset to default!", "info");
};
