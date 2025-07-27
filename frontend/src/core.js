// Core operations

import { defaultConfig, defaultSql } from "./editors";

import toml from "toml";

class ConfigParseError extends Error { }

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
  let configObject;
  try {
    configObject = toml.parse(configEditor.getValue());
  } catch (error) {
    console.error(
      `Error in config. Parsing error on line ${error.line
      }, column ${error.column
      }: ${error.message}`
    );
    notify("Error in config", "error");
    return;
  }

  const sqlOutputBox = document.getElementById("sqlOutputBox"),
    sqlOutput = document.getElementById("sqlOutput"),
    sqlOutputLabel = document.getElementById("sqlOutputLabel"),
    lintOutput = document.getElementById("lintOutput"),
    lintViolationsSummary = document.getElementById(
      "lintViolationsSummary"
    );

  lintOutput.innerHTML = "Formatting...";
  lintViolationsSummary.innerHTML = "";

  try {
    const response = await fetch(`${API_BASE_URL}/format`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_code: sqlEditor.getValue(),
        config: configObject,
      }),
    });

    if (!response.ok) {
      lintOutput.innerHTML = "";
      notify("Operation failed!", "error");
      return;
    }

    const data = await response.json();

    sqlOutputBox.style.display = data.formatted_source_code ? "flex" : "none";
    sqlOutputLabel.textContent = "Formatted SQL";
    sqlOutput.textContent = data.formatted_source_code;

    if (data.errors.length > 0) {
      notify("Errors found in SQL!", "error");
    };

    lintOutput.innerHTML = printErrors(data.errors);
  } catch (error) {
    console.error(error);
  }
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
  let configObject;
  try {
    configObject = toml.parse(configEditor.getValue());
  } catch (error) {
    console.error(
      `Error in config. Parsing error on line ${error.line
      }, column ${error.column
      }: ${error.message}`
    );
    notify("Error in config", "error");
    return;
  }

  const lintOutput = document.getElementById("lintOutput"),
    lintViolationsSummary = document.getElementById(
      "lintViolationsSummary"
    ),
    sqlOutputBox = document.getElementById("sqlOutputBox");

  lintOutput.innerHTML = "Linting...";

  try {
    const response = await fetch(`${API_BASE_URL}/lint`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_code: sqlEditor.getValue(),
        config: configObject,
      }),
    });

    if (!response.ok) {
      lintOutput.innerHTML = "";
      notify("Operation failed!", "error");
      return;
    }

    const data = await response.json();
    sqlOutputBox.style.display = "none";

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
      } else { notify("Violations found!", "warning"); }
    }

    lintOutput.innerHTML = printViolations(data.violations);
    lintOutput.innerHTML += printErrors(data.errors);
  } catch (error) {
    console.error(error);
  }
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
  let configObject;
  try {
    configObject = toml.parse(configEditor.getValue());
  } catch (error) {
    console.error(
      `Error in config. Parsing error on line ${error.line
      }, column ${error.column
      }: ${error.message}`
    );
    notify("Error in config", "error");
    return;
  }

  const lintOutput = document.getElementById("lintOutput"),
    lintViolationsSummary = document.getElementById(
      "lintViolationsSummary"
    ),
    sqlOutputBox = document.getElementById("sqlOutputBox"),
    sqlOutput = document.getElementById("sqlOutput"),
    sqlOutputLabel = document.getElementById("sqlOutputLabel");

  lintOutput.innerHTML = "Linting with fix...";

  try {
    const response = await fetch(`${API_BASE_URL}/lint`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_code: sqlEditor.getValue(),
        config: configObject,
        with_fix: true,
      }),
    });

    if (!response.ok) {
      lintOutput.innerHTML = "";
      notify("Operation failed!", "error");
      return;
    }

    const data = await response.json();

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
      } else { notify("Violations found!", "warning"); }
    }

    lintOutput.innerHTML = printViolations(data.violations);
    lintOutput.innerHTML += printErrors(data.errors);

    sqlOutputBox.style.display = data.fixed_source_code ? "flex" : "none";
    sqlOutputLabel.textContent = "Fixed SQL";
    sqlOutput.textContent = data.fixed_source_code;

  } catch (error) {
    console.error(error);
  }
}

/**
 * Generates a share link for the current config and SQL.
 *
 * @param {Object} params - The function parameters.
 * @param {string} params.API_BASE_URL - The base URL of the API.
 * @param {Object} params.configEditor - The editor containing the pgrubic config.
 * @param {Object} params.sqlEditor - The editor containing the SQL code to lint.
 *
 * @returns {Promise<string>} A promise that resolves with the share link.
 */
async function generateShareLink({ API_BASE_URL, configEditor, sqlEditor }) {
  let configObject;
  try {
    configObject = toml.parse(configEditor.getValue());
  } catch (error) {
    // error.name = "configParseError";
    // error.message = "Error in config";
    throw new ConfigParseError("Error in config", error);
  }

  const sqlOutputBox = document.getElementById("sqlOutputBox"),
    sqlOutput = document.getElementById("sqlOutput"),
    sqlOutputLabel = document.getElementById("sqlOutputLabel"),
    lintOutput = document.getElementById("lintOutput"),
    lintViolationsSummary = document.getElementById(
      "lintViolationsSummary"
    );

  const response = await fetch(`${API_BASE_URL}/share`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source_code: sqlEditor.getValue(),
      config: configObject,
      lint_violations_summary: lintViolationsSummary.innerHTML,
      lint_violations_summary_class: lintViolationsSummary.className,
      lint_output: lintOutput.innerHTML,
      sql_output_box_style: sqlOutputBox.style.display,
      sql_output_label: sqlOutputLabel.textContent,
      sql_output: sqlOutput.textContent,
    }),
  });

  if (!response.ok) {
    lintOutput.innerHTML = "";
    throw new Error("Operation failed!");
  }

  const data = await response.json();
  return `${window.location.origin}/${data.request_id}`;
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
  const path = window.location.pathname,
    requestId = path.slice(1); // Remove leading "/"

  if (!requestId) {
    configEditor.setValue(defaultConfig);
    sqlEditor.setValue(defaultSql);
    setButtonsDisabled(false);
    return;
  }

  const sqlOutputBox = document.getElementById("sqlOutputBox"),
    sqlOutput = document.getElementById("sqlOutput"),
    sqlOutputLabel = document.getElementById("sqlOutputLabel"),
    lintOutput = document.getElementById("lintOutput"),
    lintViolationsSummary = document.getElementById(
      "lintViolationsSummary"
    );

  await fetch(`${API_BASE_URL}/share/${requestId}`, {
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
      if (data === null) { return; }
      configEditor.setValue(data.toml_config);
      sqlEditor.setValue(data.source_code);
      sqlOutputBox.style.display = data.sql_output_box_style;
      sqlOutputLabel.textContent = data.sql_output_label;
      sqlOutput.textContent = data.sql_output;
      lintViolationsSummary.innerHTML = data.lint_violations_summary;
      lintViolationsSummary.className = data.lint_violations_summary_class;
      lintOutput.innerHTML = data.lint_output;
      notify("Loaded from shared link", "success");
      setButtonsDisabled(false);
    })
    .catch((error) => {
      console.error("Error:", error);
      notify("Failed to load shared link", "error");
      configEditor.setValue("");
      sqlEditor.setValue("");
    });
}

export { formatSql, lintSql, lintAndFixSql, generateShareLink, loadSharedlink, ConfigParseError };
