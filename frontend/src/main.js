// Entry point

import { defaultConfig, configEditor, sqlEditor } from "./editors";
import { notify, copyToClipboard, printViolations, printErrors } from "./utils";

import { formatSql, lintSql, lintAndFixSql } from "./core";

const API_BASE_URL = window.config.API_BASE_URL

// Hook Up Buttons Once DOM is Ready
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("formatBtn").addEventListener("click", () => {
    formatSql({ API_BASE_URL, configEditor, sqlEditor, notify, printErrors });
  });

  document.getElementById("lintBtn").addEventListener("click", () => {
    lintSql({ API_BASE_URL, configEditor, sqlEditor, notify, printViolations, printErrors });
  });

  document.getElementById("lintFixBtn").addEventListener("click", () => {
    lintAndFixSql({ API_BASE_URL, configEditor, sqlEditor, notify, printViolations, printErrors });
  });

  document.getElementById("copyBtn").onclick = function () {
    copyToClipboard("sqlOutput");
  };

  document.getElementById("resetConfigBtn").onclick = () => {
    configEditor.setValue(defaultConfig);
    notify("Configuration reset to default!", "info");
  };

  // Hamburger Menu
  document.getElementById("hamburger").addEventListener("click", () => {
    document.getElementById("top-links").classList.toggle("show");
  });
});
