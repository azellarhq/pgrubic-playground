// Entry point

import { defaultConfig, configEditor, sqlEditor } from "./editors";
import { notify, copyToClipboard, printViolations, printErrors } from "./utils";

import { formatSql, lintSql, lintAndFixSql } from "./core";

export function setupEventListeners() {
  const API_BASE_URL = window.config.API_BASE_URL;
  document.getElementById("formatBtn").addEventListener("click", () => {
    formatSql({ API_BASE_URL, configEditor, sqlEditor, notify, printErrors });
  });

  document.getElementById("lintBtn").addEventListener("click", () => {
    lintSql({ API_BASE_URL, configEditor, sqlEditor, notify, printViolations, printErrors });
  });

  document.getElementById("lintFixBtn").addEventListener("click", () => {
    lintAndFixSql({ API_BASE_URL, configEditor, sqlEditor, notify, printViolations, printErrors });
  });

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

// Add event listeners
document.addEventListener("DOMContentLoaded", setupEventListeners);
