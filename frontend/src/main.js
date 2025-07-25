// Entry point

import { defaultConfig, configEditor, sqlEditor } from "./editors";
import { notify, copyToClipboard, printViolations, printErrors } from "./utils";

import { formatSql, lintSql, lintAndFixSql, generateShareLink, loadSharedlink } from "./core";

/**
 * Sets up event listeners for various buttons and elements on the page.
 *
 * - Disables buttons at startup and loads shared link configuration.
 * - Adds click event listeners to buttons for formatting, linting,
 *   lint-fixing SQL, generating share links, copying output to clipboard,
 *   and resetting configuration to default.
 * - Toggles visibility of the top-links section when the hamburger icon is clicked.
 */

export function setupEventListeners() {
  const API_BASE_URL = window.config.API_BASE_URL;

  const buttons = [
    "formatBtn",
    "lintBtn",
    "lintFixBtn",
    "shareBtn",
    "copyBtn",
    "resetConfigBtn",
  ].map(id => document.getElementById(id));

  const setButtonsDisabled = (disabled) => {
    for (const btn of buttons) {
      if (btn) btn.disabled = disabled;
    }
  };

  setButtonsDisabled(true);

  loadSharedlink({ API_BASE_URL, configEditor, sqlEditor, notify, setButtonsDisabled });

  document.getElementById("formatBtn").addEventListener("click", () => {
    formatSql({ API_BASE_URL, configEditor, sqlEditor, notify, printErrors });
  });

  document.getElementById("lintBtn").addEventListener("click", () => {
    lintSql({ API_BASE_URL, configEditor, sqlEditor, notify, printViolations, printErrors });
  });

  document.getElementById("lintFixBtn").addEventListener("click", () => {
    lintAndFixSql({ API_BASE_URL, configEditor, sqlEditor, notify, printViolations, printErrors });
  });

  document.getElementById("shareBtn").onclick = () => {
    generateShareLink({ API_BASE_URL, configEditor, sqlEditor, notify });
  };

  document.getElementById("copyBtn").onclick = () => {
    copyToClipboard("sqlOutput");
    notify("Copied to clipboard!", "success");
  };

  document.getElementById("resetConfigBtn").onclick = () => {
    configEditor.setValue(defaultConfig);
    notify("Configuration reset to default!", "info");
  };

  document.getElementById("hamburger").addEventListener("click", () => {
    document.getElementById("top-links").classList.toggle("show");
  });
}

document.addEventListener("DOMContentLoaded", setupEventListeners);
