// Entry point

import { defaultSql, configEditor, sqlEditor, outputEditor } from "./editors";
import { notify, copyToClipboard, printViolations, printErrors } from "./utils";

import {
  formatSql,
  lintSql,
  lintAndFixSql,
  generateShareLink,
  loadDefaultConfig,
  loadSharedlink,
  loadPgrubicVersion,
} from "./core";

const CONFIG_STORAGE_KEY = "pgrubic.config";
const SQL_STORAGE_KEY = "pgrubic.sql";

function readStoredValue(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStoredValue(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function removeStoredValue(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage is optional; resetting the editor must still succeed.
  }
}

async function runOperation({ button, busyLabel, buttons, operation }) {
  const label = button.textContent;

  buttons.forEach((item) => {
    item.disabled = true;
  });
  button.textContent = busyLabel;
  button.setAttribute("aria-busy", "true");

  try {
    await operation();
  } finally {
    button.textContent = label;
    button.removeAttribute("aria-busy");
    buttons.forEach((item) => {
      item.disabled = false;
    });
  }
}

/**
 * Sets up event listeners for various buttons and elements on the page.
 *
 * - Disables buttons at startup and loads shared link configuration.
 * - Adds click event listeners to buttons for formatting, linting,
 *   lint-fixing SQL, generating share links, copying output to clipboard,
 *   and resetting configuration to default.
 * - Toggles visibility of the top-links section when the hamburger icon is clicked.
 */

export async function setupEventListeners() {
  const API_BASE_URL = window.config.API_BASE_URL;

  loadPgrubicVersion({ API_BASE_URL });

  const buttons = [
    "formatBtn",
    "lintBtn",
    "lintFixBtn",
    "shareBtn",
    "copyBtn",
    "resetConfigBtn",
  ].map((id) => document.getElementById(id));
  const operationButtons = ["formatBtn", "lintBtn", "lintFixBtn"].map((id) =>
    document.getElementById(id),
  );

  const setButtonsDisabled = (disabled) => {
    for (const btn of buttons) {
      btn.disabled = disabled;
    }
  };

  // Disable buttons at startup
  setButtonsDisabled(true);

  const savedConfig = readStoredValue(CONFIG_STORAGE_KEY);
  const savedSql = readStoredValue(SQL_STORAGE_KEY);
  let defaultConfig = null;

  try {
    defaultConfig = await loadDefaultConfig({ API_BASE_URL });
  } catch {
    if (!savedConfig) {
      notify("Failed to load default configuration", "error");
      return;
    }

    notify(
      "Default configuration unavailable; using saved settings",
      "warning",
    );
  }

  const sharedSession = await loadSharedlink({
    API_BASE_URL,
    configEditor,
    sqlEditor,
    outputEditor,
    notify,
    setButtonsDisabled,
    initialConfig: savedConfig ?? defaultConfig,
    initialSql: savedSql ?? defaultSql,
  });
  document.getElementById("resetConfigBtn").disabled = defaultConfig === null;

  configEditor.onDidChangeModelContent(() => {
    const saved = writeStoredValue(CONFIG_STORAGE_KEY, configEditor.getValue());
    document
      .getElementById("configSaveStatus")
      .replaceChildren(saved ? "Saved locally" : "Not saved");
  });
  sqlEditor.onDidChangeModelContent(() => {
    const saved = writeStoredValue(SQL_STORAGE_KEY, sqlEditor.getValue());
    document
      .getElementById("sqlSaveStatus")
      .replaceChildren(saved ? "Saved locally" : "Not saved");
  });

  document
    .getElementById("configSaveStatus")
    .replaceChildren(
      sharedSession
        ? "Shared configuration"
        : savedConfig
          ? "Saved locally"
          : "Using defaults",
    );
  document
    .getElementById("sqlSaveStatus")
    .replaceChildren(
      sharedSession
        ? "Shared SQL"
        : savedSql
          ? "Saved locally"
          : "Using example",
    );

  document.getElementById("formatBtn").addEventListener("click", (event) => {
    runOperation({
      button: event.currentTarget,
      busyLabel: "Formatting…",
      buttons: operationButtons,
      operation: () =>
        formatSql({
          API_BASE_URL,
          configEditor,
          sqlEditor,
          outputEditor,
          notify,
          printErrors,
        }),
    });
  });

  document.getElementById("lintBtn").addEventListener("click", (event) => {
    runOperation({
      button: event.currentTarget,
      busyLabel: "Linting…",
      buttons: operationButtons,
      operation: () =>
        lintSql({
          API_BASE_URL,
          configEditor,
          sqlEditor,
          notify,
          printViolations,
          printErrors,
        }),
    });
  });

  document.getElementById("lintFixBtn").addEventListener("click", (event) => {
    runOperation({
      button: event.currentTarget,
      busyLabel: "Fixing…",
      buttons: operationButtons,
      operation: () =>
        lintAndFixSql({
          API_BASE_URL,
          configEditor,
          sqlEditor,
          outputEditor,
          notify,
          printViolations,
          printErrors,
        }),
    });
  });

  document.getElementById("shareBtn").addEventListener("click", async () => {
    const url = await generateShareLink({
      API_BASE_URL,
      configEditor,
      sqlEditor,
      outputEditor,
      notify,
    });

    if (!url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      notify("Copied to clipboard!", "success");
    } catch (error) {
      const message =
        error && typeof error.message === "string" && error.message
          ? error.message
          : "Failed to copy to clipboard.";

      notify(message, "error");
    }
  });

  document.getElementById("copyBtn").addEventListener("click", async () => {
    try {
      await copyToClipboard(outputEditor.getValue());
      notify("Copied to clipboard!", "success");
    } catch {
      notify("Failed to copy output", "error");
    }
  });

  document.getElementById("resetConfigBtn").addEventListener("click", () => {
    configEditor.setValue(defaultConfig);
    removeStoredValue(CONFIG_STORAGE_KEY);
    document
      .getElementById("configSaveStatus")
      .replaceChildren("Using defaults");
    notify("Configuration reset to default!", "info");
  });

  const hamburger = document.getElementById("hamburger");
  const topLinks = document.getElementById("top-links");
  const closeMenu = () => {
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.setAttribute("aria-label", "Open menu");
    topLinks.classList.remove("show");
  };

  hamburger.addEventListener("click", () => {
    const expanded = hamburger.getAttribute("aria-expanded") === "true";
    hamburger.setAttribute("aria-expanded", String(!expanded));
    hamburger.setAttribute("aria-label", expanded ? "Open menu" : "Close menu");
    topLinks.classList.toggle("show", !expanded);
  });
  topLinks.addEventListener("click", (event) => {
    if (event.target.closest("a, button")) {
      closeMenu();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      hamburger.focus();
    }
  });
}

/**
 * Points [pgrubic-repo] elements at the pgrubic repository, and [pgrubic-docs]
 * elements at their given path resolved against the documentation site, both
 * read from window.config. Links are left untouched when the corresponding
 * config value is missing or empty.
 */
export function resolveExternalLinks() {
  const repositoryUrl = window.config["PGRUBIC_REPOSITORY_URL"];

  if (typeof repositoryUrl === "string" && repositoryUrl) {
    document.querySelectorAll("[pgrubic-repo]").forEach((link) => {
      link.href = repositoryUrl;
    });
  }

  const documentationUrl = window.config["PGRUBIC_DOCUMENTATION_URL"];

  if (typeof documentationUrl === "string" && documentationUrl) {
    document.querySelectorAll("[pgrubic-docs]").forEach((link) => {
      link.href = new URL(
        link.getAttribute("pgrubic-docs"),
        documentationUrl,
      ).href;
    });
  }
}

document.addEventListener("DOMContentLoaded", setupEventListeners);
document.addEventListener("DOMContentLoaded", resolveExternalLinks);
