// Core operations

import toml from "toml";
import { printOutputLines } from "./utils";

const REQUEST_TIMEOUT_MS = 10_000;

function fetchApi(url, options = {}) {
  const signal =
    typeof AbortSignal.timeout === "function"
      ? AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      : createTimeoutSignal();

  return fetch(url, {
    ...options,
    signal,
  });
}

function createTimeoutSignal() {
  const controller = new AbortController();

  setTimeout(() => {
    controller.abort(new DOMException("Request timed out", "TimeoutError"));
  }, REQUEST_TIMEOUT_MS);

  return controller.signal;
}

function notifyRequestFailure(error, notify) {
  notify(
    error?.name === "TimeoutError"
      ? "Request timed out after 10 seconds"
      : "Operation failed!",
    "error",
  );
}

async function notifyResponseFailure(response, notify) {
  if (response.status !== 422) {
    notify("Operation failed!", "error");
    return;
  }

  try {
    const { detail } = await response.json();
    const configErrors = Array.isArray(detail)
      ? detail.filter((error) => error.loc?.includes("config"))
      : [];

    if (configErrors.length > 0) {
      const messages = configErrors.map((error) => {
        const configIndex = error.loc.indexOf("config");
        const path = error.loc.slice(configIndex + 1).join(".");
        return `${path}: ${error.msg}`;
      });
      notify(`Configuration error: ${messages.join("; ")}`, "error");
      return;
    }
  } catch {
    // Fall through to the generic validation error.
  }

  notify("Invalid request", "error");
}

async function loadDefaultConfig({ API_BASE_URL }) {
  const response = await fetchApi(`${API_BASE_URL}/config/defaults`);

  if (!response.ok) {
    throw new Error("Failed to load default configuration");
  }

  return response.text();
}

/**
 * Formats the SQL code from the provided SQL editor using the configuration from the config editor.
 * Fetches the formatted SQL from the given API endpoint and updates the DOM with the results.
 *
 * @param {Object} params - The parameters for the function.
 * @param {string} params.API_BASE_URL - The base URL for the API.
 * @param {Object} params.configEditor - The editor containing the configuration in TOML format.
 * @param {Object} params.sqlEditor - The editor containing the SQL code to format.
 * @param {Object} params.outputEditor - The read-only formatted SQL editor.
 * @param {Function} params.notify - Function to display notifications.
 * @param {Function} params.printErrors - Function to display SQL formatting errors.
 */
async function formatSql({
  API_BASE_URL,
  configEditor,
  sqlEditor,
  outputEditor,
  notify,
  printErrors,
}) {
  let configObject;
  try {
    configObject = toml.parse(configEditor.getValue());
  } catch {
    notify("Error in config", "error");
    return;
  }

  const sqlOutputBox = document.getElementById("sqlOutputBox"),
    sqlOutputLabel = document.getElementById("sqlOutputLabel"),
    lintOutput = document.getElementById("lintOutput"),
    lintViolationsSummary = document.getElementById("lintViolationsSummary");

  lintOutput.textContent = "Formatting...";
  lintViolationsSummary.textContent = "";

  try {
    const response = await fetchApi(`${API_BASE_URL}/format`, {
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
      lintOutput.textContent = "";
      await notifyResponseFailure(response, notify);
      return;
    }

    const data = await response.json();

    sqlOutputBox.style.display = data.formatted_source_code ? "flex" : "none";
    sqlOutputLabel.textContent = "Formatted SQL";
    outputEditor.setValue(data.formatted_source_code);

    if (data.errors.length > 0) {
      notify("Errors found in SQL!", "error");
    }

    lintOutput.replaceChildren(printErrors(data.errors));
  } catch (error) {
    lintOutput.textContent = "";
    notifyRequestFailure(error, notify);
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
async function lintSql({
  API_BASE_URL,
  configEditor,
  sqlEditor,
  notify,
  printViolations,
  printErrors,
}) {
  let configObject;
  try {
    configObject = toml.parse(configEditor.getValue());
  } catch {
    notify("Error in config", "error");
    return;
  }

  const lintOutput = document.getElementById("lintOutput"),
    lintViolationsSummary = document.getElementById("lintViolationsSummary"),
    sqlOutputBox = document.getElementById("sqlOutputBox");

  lintOutput.textContent = "Linting...";

  try {
    const response = await fetchApi(`${API_BASE_URL}/lint`, {
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
      lintOutput.textContent = "";
      await notifyResponseFailure(response, notify);
      return;
    }

    const data = await response.json();
    sqlOutputBox.style.display = "none";

    if (data.violations.length === 0 && data.errors.length === 0) {
      lintViolationsSummary.textContent = "All checks passed.";
      lintViolationsSummary.classList.remove("has-violations");
      lintViolationsSummary.classList.add("no-violations");
      notify("No violations found!", "success");
    } else {
      lintViolationsSummary.textContent = `Found ${data.violations.length} violation(s) and ${data.errors.length} error(s).`;
      lintViolationsSummary.classList.remove("no-violations");
      lintViolationsSummary.classList.add("has-violations");
      if (data.errors.length > 0) {
        notify("Errors found in SQL!", "error");
      } else {
        notify("Violations found!", "warning");
      }
    }

    lintOutput.replaceChildren(
      printViolations(data.violations),
      printErrors(data.errors),
    );
  } catch (error) {
    lintOutput.textContent = "";
    notifyRequestFailure(error, notify);
  }
}

/**
 * Lints the SQL in the editor and attempts to fix the violations.
 *
 * @param {Object} params - The function parameters.
 * @param {string} params.API_BASE_URL - The base URL of the API.
 * @param {Object} params.configEditor - The editor containing the pgrubic config.
 * @param {Object} params.sqlEditor - The editor containing the SQL code to lint.
 * @param {Object} params.outputEditor - The read-only fixed SQL editor.
 * @param {Function} params.notify - Function to display notifications.
 * @param {Function} params.printViolations - Function to display SQL linting violations.
 * @param {Function} params.printErrors - Function to display SQL linting errors.
 */
async function lintAndFixSql({
  API_BASE_URL,
  configEditor,
  sqlEditor,
  outputEditor,
  notify,
  printViolations,
  printErrors,
}) {
  let configObject;
  try {
    configObject = toml.parse(configEditor.getValue());
  } catch {
    notify("Error in config", "error");
    return;
  }

  const lintOutput = document.getElementById("lintOutput"),
    lintViolationsSummary = document.getElementById("lintViolationsSummary"),
    sqlOutputBox = document.getElementById("sqlOutputBox"),
    sqlOutputLabel = document.getElementById("sqlOutputLabel");

  lintOutput.textContent = "Linting with fix...";

  try {
    const response = await fetchApi(`${API_BASE_URL}/lint`, {
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
      lintOutput.textContent = "";
      await notifyResponseFailure(response, notify);
      return;
    }

    const data = await response.json();

    if (data.violations.length === 0 && data.errors.length === 0) {
      lintViolationsSummary.textContent = "All checks passed.";
      lintViolationsSummary.classList.remove("has-violations");
      lintViolationsSummary.classList.add("no-violations");
      notify("No violations found!", "success");
    } else {
      lintViolationsSummary.textContent = `Found ${data.violations.length} violation(s) and ${data.errors.length} error(s).`;
      lintViolationsSummary.classList.remove("no-violations");
      lintViolationsSummary.classList.add("has-violations");
      if (data.errors.length > 0) {
        notify("Errors found in SQL!", "error");
      } else {
        notify("Violations found!", "warning");
      }
    }

    lintOutput.replaceChildren(
      printViolations(data.violations),
      printErrors(data.errors),
    );

    sqlOutputBox.style.display = data.fixed_source_code ? "flex" : "none";
    sqlOutputLabel.textContent = "Fixed SQL";
    outputEditor.setValue(data.fixed_source_code ?? "");
  } catch (error) {
    lintOutput.textContent = "";
    notifyRequestFailure(error, notify);
  }
}

/**
 * Generates a share link for the current config and SQL.
 *
 * @param {Object} params - The function parameters.
 * @param {string} params.API_BASE_URL - The base URL of the API.
 * @param {Object} params.configEditor - The editor containing the pgrubic config.
 * @param {Object} params.sqlEditor - The editor containing the SQL code to lint.
 * @param {Object} params.outputEditor - The read-only SQL output editor.
 * @param {Function} params.notify - Function to display notifications.
 * @returns {Promise<string | null>} A promise that resolves with the share link, or null on failure.
 */
async function generateShareLink({
  API_BASE_URL,
  configEditor,
  sqlEditor,
  outputEditor,
  notify,
}) {
  let configObject;
  try {
    configObject = toml.parse(configEditor.getValue());
  } catch {
    notify("Error in config", "error");
    return null;
  }

  const sqlOutputBox = document.getElementById("sqlOutputBox"),
    sqlOutputLabel = document.getElementById("sqlOutputLabel"),
    lintOutput = document.getElementById("lintOutput"),
    lintViolationsSummary = document.getElementById("lintViolationsSummary");

  try {
    const response = await fetchApi(`${API_BASE_URL}/share`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_code: sqlEditor.getValue(),
        config: configObject,
        lint_violations_summary: lintViolationsSummary.textContent,
        lint_violations_summary_class: lintViolationsSummary.classList.contains(
          "no-violations",
        )
          ? "no-violations"
          : lintViolationsSummary.classList.contains("has-violations")
            ? "has-violations"
            : "",
        lint_output:
          [...lintOutput.querySelectorAll(".lint-message")]
            .map((message) => message.textContent)
            .join("\n") || lintOutput.textContent,
        sql_output_box_style: sqlOutputBox.style.display,
        sql_output_label: sqlOutputLabel.textContent,
        sql_output: outputEditor.getValue(),
      }),
    });

    if (!response.ok) {
      lintOutput.textContent = "";
      await notifyResponseFailure(response, notify);
      return null;
    }

    const data = await response.json();
    return `${window.location.origin}/${data.request_id}`;
  } catch (error) {
    notifyRequestFailure(error, notify);
    return null;
  }
}

/**
 * Loads the state from a shared link.
 *
 * If the link cannot be loaded, restores the normal session and displays an
 * error notification. If the link is valid, loads the shared request and
 * displays a success notification.
 *
 * @param {Object} params - The function parameters.
 * @param {string} params.API_BASE_URL - The base URL of the API.
 * @param {Object} params.configEditor - The editor containing the pgrubic config.
 * @param {Object} params.sqlEditor - The editor containing the SQL code to lint.
 * @param {Object} params.outputEditor - The read-only SQL output editor.
 * @param {Function} params.notify - Function to display notifications.
 * @param {Function} params.setButtonsDisabled - Function to disable buttons.
 * @param {string} params.initialConfig - Configuration used for a normal session.
 * @param {string} params.initialSql - SQL used for a normal session.
 * @returns {Promise<boolean>} Whether a shared session was loaded.
 */
async function loadSharedlink({
  API_BASE_URL,
  configEditor,
  sqlEditor,
  outputEditor,
  notify,
  setButtonsDisabled,
  initialConfig,
  initialSql,
}) {
  const path = window.location.pathname,
    requestId = path.slice(1); // Remove leading "/"

  if (!requestId) {
    configEditor.setValue(initialConfig);
    sqlEditor.setValue(initialSql);
    setButtonsDisabled(false);
    return false;
  }

  const restoreInitialSession = () => {
    configEditor.setValue(initialConfig);
    sqlEditor.setValue(initialSql);
    setButtonsDisabled(false);
  };

  const sqlOutputBox = document.getElementById("sqlOutputBox"),
    sqlOutputLabel = document.getElementById("sqlOutputLabel"),
    lintOutput = document.getElementById("lintOutput"),
    lintViolationsSummary = document.getElementById("lintViolationsSummary");

  try {
    const response = await fetchApi(`${API_BASE_URL}/share/${requestId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok && response.status !== 404) {
      notify("Failed to load shared link", "error");
      restoreInitialSession();
      return false;
    }

    if (response.status === 404) {
      notify("Invalid or expired link", "error");
      restoreInitialSession();
      return false;
    }

    const data = await response.json();
    configEditor.setValue(data.toml_config);
    sqlEditor.setValue(data.source_code);
    sqlOutputBox.style.display =
      data.sql_output_box_style === "flex" ? "flex" : "none";
    sqlOutputLabel.textContent = data.sql_output_label;
    outputEditor.setValue(data.sql_output ?? "");
    lintViolationsSummary.textContent = data.lint_violations_summary;
    lintViolationsSummary.className = "lint-violations-summary p-4";
    if (
      ["no-violations", "has-violations"].includes(
        data.lint_violations_summary_class,
      )
    ) {
      lintViolationsSummary.classList.add(data.lint_violations_summary_class);
    }
    lintOutput.replaceChildren(printOutputLines(data.lint_output));
    notify("Loaded from shared link", "success");
    setButtonsDisabled(false);
    return true;
  } catch (error) {
    notifyRequestFailure(error, notify);
    restoreInitialSession();
    return false;
  }
}

/**
 * Loads pgrubic version.
 *
 * Fetches the pgrubic version from the API and updates the DOM with the version.
 *
 * @param {Object} params - The function parameters.
 * @param {string} params.API_BASE_URL - The base URL of the API.
 */
async function loadPgrubicVersion({ API_BASE_URL }) {
  const pgrubicVersion = document.getElementById("pgrubicVersion");

  try {
    const response = await fetchApi(`${API_BASE_URL}/pgrubic-version`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      pgrubicVersion.textContent = "Unavailable";
      return;
    }

    const { version } = await response.json();
    pgrubicVersion.textContent = version;
  } catch {
    pgrubicVersion.textContent = "Unavailable";
    return;
  }
}

export {
  loadDefaultConfig,
  formatSql,
  lintSql,
  lintAndFixSql,
  generateShareLink,
  loadSharedlink,
  loadPgrubicVersion,
};
