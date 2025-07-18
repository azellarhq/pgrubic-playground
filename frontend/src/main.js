// Entry point

import { defaultConfig, configEditor, sqlEditor } from "./editors";
import { notify, copyToClipboard, printViolations } from "./utils";

import { formatSql, lintSql, lintAndFixSql } from "./core";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Hook Up Buttons Once DOM is Ready
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("formatBtn").addEventListener("click", () => {
    formatSql({ API_BASE_URL, configEditor, sqlEditor, notify });
  });

  document.getElementById("lintBtn").addEventListener("click", () => {
    lintSql({ API_BASE_URL, configEditor, sqlEditor, notify, printViolations });
  });

  document.getElementById("lintFixBtn").addEventListener("click", () => {
    lintAndFixSql({ API_BASE_URL, configEditor, sqlEditor, notify, printViolations });
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
