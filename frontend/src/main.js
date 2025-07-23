// Entry point

import { defaultConfig, configEditor, sqlEditor } from "./editors";
import { notify, copyToClipboard, printViolations, printErrors } from "./utils";

import { formatSql, lintSql, lintAndFixSql, generateShareLink, loadSharedRequest } from "./core";

// /**
//  * Sets up event listeners for various UI elements.
//  *
//  * - Binds click events to buttons for formatting, linting, lint-fixing SQL,
//  *   copying output, resetting configuration, and toggling visibility of top links.
//  * - Utilizes functions from core and utils modules to perform actions.
//  */

// export function setupEventListeners() {
//   const API_BASE_URL = window.config.API_BASE_URL;

//   loadSharedRequest({ API_BASE_URL, configEditor, sqlEditor, notify });

//   document.getElementById("formatBtn").addEventListener("click", () => {
//     formatSql({ API_BASE_URL, configEditor, sqlEditor, notify, printErrors });
//   });

//   document.getElementById("lintBtn").addEventListener("click", () => {
//     lintSql({ API_BASE_URL, configEditor, sqlEditor, notify, printViolations, printErrors });
//   });

//   document.getElementById("lintFixBtn").addEventListener("click", () => {
//     lintAndFixSql({ API_BASE_URL, configEditor, sqlEditor, notify, printViolations, printErrors });
//   });

//   document.getElementById("shareBtn").addEventListener("click", () => {
//     generateShareLink({ API_BASE_URL, configEditor, sqlEditor, notify });
//   });

//   document.getElementById("copyBtn").onclick = () => {
//     copyToClipboard("sqlOutput");
//     notify("Copied to clipboard!", "success");
//   };

//   document.getElementById("resetConfigBtn").onclick = () => {
//     configEditor.setValue(defaultConfig);
//     notify("Configuration reset to default!", "info");
//   };

//   document.getElementById("hamburger").addEventListener("click", () => {
//     document.getElementById("top-links").classList.toggle("show");
//   });

// }

// document.addEventListener("DOMContentLoaded", setupEventListeners);
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

  setButtonsDisabled(true); // Disable on startup

  loadSharedRequest({ API_BASE_URL, configEditor, sqlEditor, notify, setButtonsDisabled });

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
