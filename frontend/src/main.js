// main.js

import { defaultConfig, configEditor, sqlEditor } from "./editors.js";
import { notify, copyToClipboard, printViolations, printErrors, ThemeToggle } from "./utils.js";
import {
  formatSql,
  lintSql,
  lintAndFixSql,
  generateShareLink,
  loadSharedlink,
  ConfigParseError,
} from "./core.js";

export async function setupEventListeners() {
  const API_BASE_URL = window.config.API_BASE_URL;

  const buttons = [
    "formatBtn",
    "lintBtn",
    "lintFixBtn",
    "shareBtn",
    "copyBtn",
    "resetConfigBtn",
  ].map((id) => document.getElementById(id));

  // Disable buttons initially
  const setButtonsDisabled = (disabled) => {
    buttons.forEach((btn) => { if(btn) btn.disabled = disabled; });
  };
  setButtonsDisabled(true);

  // Load shared config (async)
  await loadSharedlink({
    API_BASE_URL,
    configEditor,
    sqlEditor,
    notify,
    setButtonsDisabled,
  });

  const formatBtn = document.getElementById("formatBtn");
  if (formatBtn) formatBtn.addEventListener("click", () => {
    formatSql({ API_BASE_URL, configEditor, sqlEditor, notify, printErrors });
  });

  const lintBtn = document.getElementById("lintBtn");
  if (lintBtn) lintBtn.addEventListener("click", () => {
    lintSql({ API_BASE_URL, configEditor, sqlEditor, notify, printViolations, printErrors });
  });

  const lintFixBtn = document.getElementById("lintFixBtn");
  if (lintFixBtn) lintFixBtn.addEventListener("click", () => {
    lintAndFixSql({ API_BASE_URL, configEditor, sqlEditor, notify, printViolations, printErrors });
  });

  const shareBtn = document.getElementById("shareBtn");
  if (shareBtn) shareBtn.addEventListener("click", async () => {
    try {
      const url = await generateShareLink({ API_BASE_URL, configEditor, sqlEditor, notify });
      await navigator.clipboard.writeText(url);
      notify("Copied to clipboard!", "success");
    } catch (error) {
      if (error instanceof ConfigParseError) {
        notify("Error in config", "error");
      } else {
        notify("Operation failed!", "error");
      }
    }
  });

  const copyBtn = document.getElementById("copyBtn");
  if (copyBtn) copyBtn.addEventListener("click", async () => {
    await copyToClipboard("sqlOutput");
    notify("Copied to clipboard!", "success");
  });

  const resetBtn = document.getElementById("resetConfigBtn");
  if (resetBtn) resetBtn.addEventListener("click", () => {
    configEditor.setValue(defaultConfig);
    notify("Configuration reset to default!", "info");
  });

  // Hamburger menu
  const hamburger = document.getElementById("hamburger");
  if (hamburger) hamburger.addEventListener("click", () => {
    document.getElementById("top-links").classList.toggle("show");
  });
 
  ThemeToggle(); // click listener and handles Light → Dark → System
}

// Initialize after DOM is ready
document.addEventListener("DOMContentLoaded", setupEventListeners);
