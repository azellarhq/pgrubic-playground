import toml from "toml";

import { editor } from "monaco-editor/esm/vs/editor/editor.api";
import "monaco-editor/esm/vs/basic-languages/sql/sql.contribution";

import { defaultConfigTOML, transformKeys } from "./config";
import { notify, copyToClipboard, printViolations } from "./utils";

const configEditor = editor.create(document.getElementById("configEditor"), {
  value: defaultConfigTOML,
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
  value: "CREATE TABLE users (id INT, name TEXT);",
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

// Format SQL
async function formatSql() {
  var configObject;
  try {
    configObject = toml.parse(configEditor.getValue());
  } catch (error) {
    console.error(
      "Error in config. Parsing error on line " +
        error.line +
        ", column " +
        error.column +
        ": " +
        error.message
    );
    notify("Config error", "error");
    return;
  }

  const sqlOutputBox = document.getElementById("sqlOutputBox");
  const sqlOutput = document.getElementById("sqlOutput");
  const sqlOutputLabel = document.getElementById("sqlOutputLabel");
  const lintOutput = document.getElementById("lintOutput");
  const lintViolationsSummary = document.getElementById(
    "lintViolationsSummary"
  );

  lintOutput.innerHTML = "";
  lintViolationsSummary.innerHTML = "";

  sqlOutputLabel.textContent = "Formatted SQL";

  await fetch("/api/v1/format", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source_code: sqlEditor.getValue(),
      config: transformKeys(configObject),
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      sqlOutput.textContent = data.formatted_source_code;
      sqlOutputBox.style.display = data.formatted_source_code ? "flex" : "none";
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

// Lint SQL
async function lintSql() {
  var configObject;
  try {
    configObject = toml.parse(configEditor.getValue());
  } catch (error) {
    console.error(
      "Error in config. Parsing error on line " +
        error.line +
        ", column " +
        error.column +
        ": " +
        error.message
    );
    notify("Error in config", "error");
    return;
  }

  const lintOutput = document.getElementById("lintOutput");
  const lintViolationsSummary = document.getElementById(
    "lintViolationsSummary"
  );
  const sqlOutputBox = document.getElementById("sqlOutputBox");
  sqlOutputBox.style.display = "none";
  lintOutput.innerHTML = "Linting...";

  await fetch("http://localhost:8000/api/v1/lint", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source_code: sqlEditor.getValue(),
      config: transformKeys(configObject),
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.violations.length === 0 && data.errors.length === 0) {
        lintViolationsSummary.innerHTML = "All checks passed! 🎉🎉🎉.";
        lintViolationsSummary.classList.remove("has-violations");
        lintViolationsSummary.classList.add("no-violations");
        notify("No violations found!", "success");
      } else {
        lintViolationsSummary.innerHTML = `Hi! I found ${data.violations.length} violation(s) and ${data.errors.length} error(s) for you to look at!`;
        lintViolationsSummary.classList.remove("no-violations");
        lintViolationsSummary.classList.add("has-violations");
        if (data.errors.length > 0) {
          notify("Errors found in SQL!", "error");
        } else notify("Violations found!", "warning");
      }
      lintOutput.innerHTML = printViolations(data.violations || []);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

// Lint & Fix SQL
async function lintAndFixSql() {
  var configObject;
  try {
    configObject = toml.parse(configEditor.getValue());
  } catch (error) {
    console.error(
      "Parsing error on line " +
        error.line +
        ", column " +
        error.column +
        ": " +
        error.message
    );
    notify("Error in config", "error");
    return;
  }

  const lintOutput = document.getElementById("lintOutput");
  const lintViolationsSummary = document.getElementById(
    "lintViolationsSummary"
  );
  const sqlOutputBox = document.getElementById("sqlOutputBox");
  const sqlOutput = document.getElementById("sqlOutput");
  const sqlOutputLabel = document.getElementById("sqlOutputLabel");

  lintOutput.innerHTML = "Linting with fix...";
  sqlOutputLabel.textContent = "Fixed SQL";

  await fetch("http://localhost:8000/api/v1/lint", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source_code: sqlEditor.getValue(),
      config: transformKeys(configObject),
      with_fix: true,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.violations.length === 0 && data.errors.length === 0) {
        lintViolationsSummary.innerHTML = "All checks passed! 🎉🎉🎉.";
        lintViolationsSummary.classList.remove("has-violations");
        lintViolationsSummary.classList.add("no-violations");
        notify("No violations found!", "success");
      } else {
        lintViolationsSummary.innerHTML = `Hi! I found ${data.violations.length} violation(s) and ${data.errors.length} error(s) for you to look at!`;
        lintViolationsSummary.classList.remove("no-violations");
        lintViolationsSummary.classList.add("has-violations");
        if (data.errors.length > 0) {
          notify("Errors found in SQL!", "error");
        } else notify("Violations found!", "warning");
      }
      lintOutput.innerHTML = printViolations(data.violations);

      sqlOutput.textContent = data.fixed_source_code;
      sqlOutputBox.style.display = "flex";
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

// Hook Up Buttons Once DOM is Ready
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("formatBtn").onclick = formatSql;
  document.getElementById("lintBtn").onclick = lintSql;
  document.getElementById("lintFixBtn").onclick = lintAndFixSql;
  document.getElementById("copyBtn").onclick = function () {
    copyToClipboard("sqlOutput");
  };
  document.getElementById("resetConfigBtn").onclick = () => {
    configEditor.setValue(defaultConfigTOML);
    notify("Configuration reset to default!", "info");
  };
  // Hamburger Menu
  document.getElementById("hamburger").addEventListener("click", () => {
    document.getElementById("top-links").classList.toggle("show");
  });
});
