// Core operations

import toml from "toml";

import { transformKeys } from "./editors";

/**
 * Formats the SQL code from the provided SQL editor using the configuration from the config editor.
 * Fetches the formatted SQL from the given API endpoint and updates the DOM with the results.
 *
 * @param {Object} params - The parameters for the function.
 * @param {string} params.API_BASE_URL - The base URL for the API.
 * @param {Object} params.configEditor - The editor containing the configuration in TOML format.
 * @param {Object} params.sqlEditor - The editor containing the SQL code to format.
 * @param {Function} params.notify - Function to display notifications.
 * @param {Function} params.printErrors - Function to display SQL formatting errors.
 */

async function formatSql({ API_BASE_URL, configEditor, sqlEditor, notify, printErrors }) {
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

  const sqlOutputBox = document.getElementById("sqlOutputBox");
  const sqlOutput = document.getElementById("sqlOutput");
  const sqlOutputLabel = document.getElementById("sqlOutputLabel");
  const lintOutput = document.getElementById("lintOutput");
  const lintViolationsSummary = document.getElementById(
    "lintViolationsSummary"
  );

  lintOutput.innerHTML = "Formatting...";
  lintViolationsSummary.innerHTML = "";

  sqlOutputLabel.textContent = "Formatted SQL";

  await fetch(API_BASE_URL + "/format", {
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
      if (data.errors.length > 0) {
        notify("Errors found in SQL!", "error");
      };
      lintOutput.innerHTML = printErrors(data.errors);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

  /**
   * Lints the SQL code from the provided SQL editor using the configuration from the config editor.
   * Fetches the linting results from the given API endpoint and updates the DOM with the results.
   *
   * @param {Object} params - The parameters for the function.
   * @param {string} params.API_BASE_URL - The base URL for the API.
   * @param {Object} params.configEditor - The editor containing the configuration in TOML format.
   * @param {Object} params.sqlEditor - The editor containing the SQL code to lint.
   * @param {Function} params.notify - Function to display notifications.
   * @param {Function} params.printViolations - Function to display SQL linting violations.
   * @param {Function} params.printErrors - Function to display SQL linting errors.
   */
async function lintSql({ API_BASE_URL, configEditor, sqlEditor, notify, printViolations, printErrors }) {
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

  await fetch(`${API_BASE_URL}/lint`, {
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
      lintOutput.innerHTML = printViolations(data.violations);
      lintOutput.innerHTML += printErrors(data.errors);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

  /**
   * Lints the SQL in the editor and attempts to fix the violations.
   *
   * @param {Object} params - The function parameters.
   * @param {string} params.API_BASE_URL - The base URL of the API.
   * @param {Object} params.configEditor - The editor containing the SQLFluff config.
   * @param {Object} params.sqlEditor - The editor containing the SQL code to lint.
   * @param {Function} params.notify - Function to display notifications.
   * @param {Function} params.printViolations - Function to display SQL linting violations.
   * @param {Function} params.printErrors - Function to display SQL linting errors.
   */
async function lintAndFixSql({ API_BASE_URL, configEditor, sqlEditor, notify, printViolations, printErrors }) {
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
  const sqlOutput = document.getElementById("sqlOutput");
  const sqlOutputLabel = document.getElementById("sqlOutputLabel");

  lintOutput.innerHTML = "Linting with fix...";
  sqlOutputLabel.textContent = "Fixed SQL";

  await fetch(API_BASE_URL + "/lint", {
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
      lintOutput.innerHTML += printErrors(data.errors);

      sqlOutput.textContent = data.fixed_source_code;
      sqlOutputBox.style.display = "flex";
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

export { formatSql, lintSql, lintAndFixSql };
