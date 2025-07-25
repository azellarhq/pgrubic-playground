// Core operations

import toml from "toml";

import { transformKeys, defaultConfig, defaultSql } from "./editors";

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
 * @param {Object} params.configEditor - The editor containing the pgrubic config.
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

/**
 * Generates a shareable link for the current SQL and configuration.
 *
 * @param {Object} params - The function parameters.
 * @param {string} params.API_BASE_URL - The base URL of the API.
 * @param {Object} params.configEditor - The editor containing the pgrubic config.
 * @param {Object} params.sqlEditor - The editor containing the SQL code to lint.
 * @param {Function} params.notify - Function to display notifications.
 *
 * @returns {Promise<void>} A promise that resolves when the link has been generated and copied to the clipboard.
 */
async function generateShareLink({ API_BASE_URL, configEditor, sqlEditor, notify }) {
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

  console.log(lintViolationsSummary.innerHTML);

  await fetch(API_BASE_URL + "/share", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source_code: sqlEditor.getValue(),
      config: transformKeys(configObject),
      lint_violations_summary: lintViolationsSummary.innerHTML,
      lint_output: lintOutput.innerHTML,
      sql_output_box_style: sqlOutputBox.style.display,
      sql_output_label: sqlOutputLabel.textContent,
      sql_output: sqlOutput.textContent,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      navigator.clipboard.writeText(window.location.origin + "/" + data.request_id);
      notify("Copied to clipboard!", "success");
    })
    .catch((error) => {
      console.error("Error:", error);
    })
}


/**
 * Loads the state from a shared link.
 *
 * If the link is invalid or expired, will clear the config and SQL editors and
 * display an error notification. If the link is valid, will load the request
 * from the API, set the config and SQL editors, and display a success
 * notification.
 *
 * @param {Object} params - The function parameters.
 * @param {string} params.API_BASE_URL - The base URL of the API.
 * @param {Object} params.configEditor - The editor containing the pgrubic config.
 * @param {Object} params.sqlEditor - The editor containing the SQL code to lint.
 * @param {Function} params.notify - Function to display notifications.
 * @param {Function} params.setButtonsDisabled - Function to set the disabled state of the buttons.
 */
async function loadSharedlink({ API_BASE_URL, configEditor, sqlEditor, notify, setButtonsDisabled }) {
  const path = window.location.pathname;
  const requestId = path.slice(1); // remove leading "/"

  if (!requestId) {
    configEditor.setValue(defaultConfig);
    sqlEditor.setValue(defaultSql);
    setButtonsDisabled(false);
    return;
  }

  const sqlOutputBox = document.getElementById("sqlOutputBox");
  const sqlOutput = document.getElementById("sqlOutput");
  const sqlOutputLabel = document.getElementById("sqlOutputLabel");
  const lintOutput = document.getElementById("lintOutput");
  const lintViolationsSummary = document.getElementById(
    "lintViolationsSummary"
  );

  await fetch(API_BASE_URL + "/share/" + requestId, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (response.status === 404) {
        notify("Invalid or expired link", "error");
        configEditor.setValue("");
        sqlEditor.setValue("");
        return null;
      }
      return response.json();
    })
    .then((data) => {
      if (data === null) return;
      configEditor.setValue(data.toml_config);
      sqlEditor.setValue(data.source_code);
      sqlOutputBox.style.display = data.sql_output_box_style;
      sqlOutputLabel.textContent = data.sql_output_label;
      sqlOutput.textContent = data.sql_output;
      lintViolationsSummary.innerHTML = data.lint_violations_summary;
      lintOutput.innerHTML = data.lint_output;
      notify("Loaded from shared link", "success");
      setButtonsDisabled(false);
    })
    .catch((error) => {
      console.error("Error:", error);
      notify("Failed to load shared link", "error");
      configEditor.setValue("");
      sqlEditor.setValue("");
    })
}


export { formatSql, lintSql, lintAndFixSql, generateShareLink, loadSharedlink };
