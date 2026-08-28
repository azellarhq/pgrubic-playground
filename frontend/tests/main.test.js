// Test entry point

import { describe, it, beforeEach, vi, expect } from "vitest";

import * as core from "../src/core";
import * as utils from "../src/utils";
import { setupEventListeners, resolveExternalLinks } from "../src/main";
import { configEditor, sqlEditor } from "../src/editors";
import { setEditorTheme } from "../src/editors";

const defaultConfig = "[lint]\nselect = []";

// Mocks
vi.mock("../src/editors", () => ({
  configEditor: {
    getValue: vi.fn(),
    setValue: vi.fn(),
    onDidChangeModelContent: vi.fn(),
  },

  sqlEditor: {
    getValue: vi.fn(),
    setValue: vi.fn(),
    onDidChangeModelContent: vi.fn(),
  },
  outputEditor: {
    getValue: vi.fn(() => "formatted sql"),
    setValue: vi.fn(),
  },
  setEditorTheme: vi.fn(),
  defaultSql: "SELECT 1;",
}));

describe("Main button event listeners", () => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue() },
  });

  beforeEach(() => {
    // Mock DOM
    document.body.innerHTML = `
      <button id="formatBtn">Format</button>
      <button id="lintBtn">Lint</button>
      <button id="lintFixBtn">Lint + Fix</button>
      <button id="copyBtn"></button>
      <button id="shareBtn"></button>
      <button id="resetConfigBtn"></button>
      <button id="themeSelector"></button>
      <button id="hamburger"></button>
      <div id="top-links"></div>
      <span id="configSaveStatus"></span>
      <span id="sqlSaveStatus"></span>
    `;

    // Spy functions
    vi.spyOn(core, "formatSql").mockResolvedValue();
    vi.spyOn(core, "lintSql").mockResolvedValue();
    vi.spyOn(core, "lintAndFixSql").mockResolvedValue();
    vi.spyOn(core, "generateShareLink").mockResolvedValue();
    vi.spyOn(utils, "copyToClipboard").mockImplementation(() => {});
    vi.spyOn(utils, "notify").mockImplementation(() => {});
    vi.spyOn(core, "loadPgrubicVersion").mockResolvedValue();
    vi.spyOn(core, "loadDefaultConfig").mockResolvedValue(defaultConfig);
    localStorage.clear();

    return setupEventListeners();
  });

  it.each([
    ["formatBtn", "formatSql"],
    ["lintBtn", "lintSql"],
    ["lintFixBtn", "lintAndFixSql"],
  ])("dispatches %s to %s", (buttonId, operation) => {
    document.getElementById(buttonId).click();
    expect(core[operation]).toHaveBeenCalled();
  });

  it("uses and persists an explicit theme", async () => {
    localStorage.setItem("pgrubic.theme", "dark");

    await setupEventListeners();

    const selector = document.getElementById("themeSelector");
    expect(selector.dataset.theme).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(setEditorTheme).toHaveBeenCalledWith("dark");

    selector.click();

    expect(localStorage.getItem("pgrubic.theme")).toBe("auto");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(setEditorTheme).toHaveBeenLastCalledWith("light");
    expect(selector.getAttribute("aria-label")).toBe("Switch to light mode");
  });

  it("follows system theme changes in auto mode", async () => {
    let handleThemeChange;
    const mediaQuery = {
      matches: true,
      addEventListener: vi.fn((event, handler) => {
        handleThemeChange = handler;
      }),
      removeEventListener: vi.fn(),
    };
    window.matchMedia.mockReturnValue(mediaQuery);
    localStorage.setItem("pgrubic.theme", "unsupported");

    await setupEventListeners();

    expect(document.getElementById("themeSelector").dataset.theme).toBe("auto");
    expect(document.documentElement.dataset.theme).toBe("dark");

    mediaQuery.matches = false;
    handleThemeChange();
    expect(document.documentElement.dataset.theme).toBe("light");

    document.getElementById("themeSelector").dataset.theme = "dark";
    handleThemeChange();
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("disables SQL actions while an operation is running", async () => {
    let finishFormatting;
    core.formatSql.mockReturnValue(
      new Promise((resolve) => {
        finishFormatting = resolve;
      }),
    );

    document.getElementById("formatBtn").click();

    expect(document.getElementById("formatBtn").textContent).toBe(
      "Formatting…",
    );
    expect(document.getElementById("lintBtn").disabled).toBe(true);
    expect(document.getElementById("lintFixBtn").disabled).toBe(true);

    finishFormatting();
    await Promise.resolve();
    await Promise.resolve();

    expect(document.getElementById("formatBtn").textContent).toBe("Format");
    expect(document.getElementById("lintBtn").disabled).toBe(false);
  });

  it("calls copyToClipboard on copyBtn click and notifies", async () => {
    await document.getElementById("copyBtn").click();
    expect(utils.copyToClipboard).toHaveBeenCalledWith("formatted sql");
    expect(utils.notify).toHaveBeenCalledWith(
      "Copied to clipboard!",
      "success",
    );
  });

  it("reports clipboard failures when copying SQL output", async () => {
    utils.copyToClipboard.mockRejectedValueOnce(new Error("denied"));

    document.getElementById("copyBtn").click();
    await Promise.resolve();

    expect(utils.notify).toHaveBeenCalledWith("Failed to copy output", "error");
  });

  it("calls generateShareLink on shareBtn click", () => {
    document.getElementById("shareBtn").click();
    expect(core.generateShareLink).toHaveBeenCalled();
  });

  it("shareBtn writes share link to clipboard and notifies on success", async () => {
    const shareLink = "https://fake.share/link";

    core.generateShareLink.mockResolvedValue(shareLink);

    await document.getElementById("shareBtn").click();
    await Promise.resolve();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(shareLink);
    expect(utils.notify).toHaveBeenCalledWith(
      "Copied to clipboard!",
      "success",
    );
  });

  it.each([
    ["Permission denied", "Permission denied"],
    ["", "Failed to copy to clipboard."],
  ])(
    "reports clipboard failures with message %j",
    async (errorMessage, expectedMessage) => {
      const shareLink = "https://fake.share/link";

      vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
        new DOMException(errorMessage, "NotAllowedError"),
      );

      core.generateShareLink.mockResolvedValue(shareLink);

      await document.getElementById("shareBtn").click();
      await Promise.resolve();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(shareLink);

      expect(utils.notify).toHaveBeenCalledWith(expectedMessage, "error");
    },
  );

  it("resets config and notifies on resetConfigBtn click", () => {
    localStorage.setItem("pgrubic.config", "edited config");
    document.getElementById("resetConfigBtn").click();
    expect(configEditor.setValue).toHaveBeenCalledWith(defaultConfig);
    expect(localStorage.getItem("pgrubic.config")).toBeNull();
    expect(utils.notify).toHaveBeenCalledWith(
      "Configuration reset to default!",
      "info",
    );
  });

  it("restores and persists the last edited config and SQL", async () => {
    const savedConfig = `[lint]
select = ["TP001"]`;
    const savedSql = "SELECT 42;";
    localStorage.setItem("pgrubic.config", savedConfig);
    localStorage.setItem("pgrubic.sql", savedSql);

    await setupEventListeners();

    expect(configEditor.setValue).toHaveBeenCalledWith(savedConfig);
    expect(sqlEditor.setValue).toHaveBeenCalledWith(savedSql);

    const saveConfig = configEditor.onDidChangeModelContent.mock.lastCall[0];
    const saveSql = sqlEditor.onDidChangeModelContent.mock.lastCall[0];
    configEditor.getValue.mockReturnValue(savedConfig);
    sqlEditor.getValue.mockReturnValue(savedSql);
    saveConfig();
    saveSql();

    expect(localStorage.getItem("pgrubic.config")).toBe(savedConfig);
    expect(localStorage.getItem("pgrubic.sql")).toBe(savedSql);
  });

  it("continues when browser storage cannot be read or written", async () => {
    const getItem = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new DOMException("denied");
      });

    await setupEventListeners();
    getItem.mockRestore();

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("denied");
    });
    configEditor.onDidChangeModelContent.mock.lastCall[0]();
    sqlEditor.onDidChangeModelContent.mock.lastCall[0]();

    expect(document.getElementById("configSaveStatus").textContent).toBe(
      "Not saved",
    );
    expect(document.getElementById("sqlSaveStatus").textContent).toBe(
      "Not saved",
    );
  });

  it("labels a successfully loaded shared session", async () => {
    vi.spyOn(core, "loadSharedlink").mockResolvedValueOnce(true);

    await setupEventListeners();

    expect(document.getElementById("configSaveStatus").textContent).toBe(
      "Shared configuration",
    );
    expect(document.getElementById("sqlSaveStatus").textContent).toBe(
      "Shared SQL",
    );
  });

  it("uses saved state when default configuration is unavailable", async () => {
    const savedConfig = "[lint]\nselect = []";
    const savedSql = "SELECT 42;";
    localStorage.setItem("pgrubic.config", savedConfig);
    localStorage.setItem("pgrubic.sql", savedSql);
    core.loadDefaultConfig.mockRejectedValueOnce(new Error("offline"));

    await setupEventListeners();

    expect(configEditor.setValue).toHaveBeenLastCalledWith(savedConfig);
    expect(sqlEditor.setValue).toHaveBeenLastCalledWith(savedSql);
    expect(document.getElementById("formatBtn").disabled).toBe(false);
    expect(document.getElementById("resetConfigBtn").disabled).toBe(true);
    expect(utils.notify).toHaveBeenCalledWith(
      "Default configuration unavailable; using saved settings",
      "warning",
    );
  });

  it("keeps controls disabled when defaults fail without saved config", async () => {
    core.loadDefaultConfig.mockRejectedValueOnce(new Error("offline"));

    await setupEventListeners();

    expect(document.getElementById("formatBtn").disabled).toBe(true);
    expect(document.getElementById("resetConfigBtn").disabled).toBe(true);
    expect(utils.notify).toHaveBeenCalledWith(
      "Failed to load default configuration",
      "error",
    );
  });

  it("toggles top-links visibility on hamburger click", () => {
    const hamburger = document.getElementById("hamburger");
    const topLinks = document.getElementById("top-links");
    expect(topLinks.classList.contains("show")).toBe(false);

    hamburger.click();
    expect(topLinks.classList.contains("show")).toBe(true);
    expect(hamburger.getAttribute("aria-expanded")).toBe("true");

    hamburger.click();
    expect(topLinks.classList.contains("show")).toBe(false);
    expect(hamburger.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes the mobile menu from a link or the Escape key", async () => {
    const hamburger = document.getElementById("hamburger");
    const topLinks = document.getElementById("top-links");
    const link = document.createElement("a");
    topLinks.appendChild(link);

    hamburger.click();
    link.click();
    expect(topLinks.classList.contains("show")).toBe(false);

    hamburger.click();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(topLinks.classList.contains("show")).toBe(false);
    expect(document.activeElement).toBe(hamburger);

    hamburger.click();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(topLinks.classList.contains("show")).toBe(true);

    topLinks.click();
    expect(topLinks.classList.contains("show")).toBe(true);
  });
});

describe("resolveExternalLinks", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <a id="repoLink" pgrubic-repo></a>
      <a id="rulesLink" pgrubic-docs="rules"></a>
      <a id="formatterLink" pgrubic-docs="formatter"></a>
      <a id="lintLink" pgrubic-docs="linter"></a>
      <a id="settingsLink" pgrubic-docs="settings"></a>
    `;
  });

  it("points [pgrubic-repo] links at PGRUBIC_REPOSITORY_URL", () => {
    resolveExternalLinks();

    expect(document.getElementById("repoLink").href).toBe(
      window.config.PGRUBIC_REPOSITORY_URL,
    );
  });

  it("resolves each [pgrubic-docs] link against PGRUBIC_DOCUMENTATION_URL", () => {
    resolveExternalLinks();

    expect(document.getElementById("rulesLink").href).toBe(
      new URL("rules", window.config.PGRUBIC_DOCUMENTATION_URL).href,
    );
    expect(document.getElementById("formatterLink").href).toBe(
      new URL("formatter", window.config.PGRUBIC_DOCUMENTATION_URL).href,
    );
  });

  it("leaves [pgrubic-repo] hrefs untouched when PGRUBIC_REPOSITORY_URL is missing or empty", () => {
    const repoLink = document.getElementById("repoLink");
    repoLink.href = "https://example.com/fallback";

    delete window.config.PGRUBIC_REPOSITORY_URL;
    resolveExternalLinks();
    expect(repoLink.href).toBe("https://example.com/fallback");

    window.config.PGRUBIC_REPOSITORY_URL = "";
    resolveExternalLinks();
    expect(repoLink.href).toBe("https://example.com/fallback");
  });

  it("leaves [pgrubic-docs] hrefs untouched when PGRUBIC_DOCUMENTATION_URL is missing or empty", () => {
    const rulesLink = document.getElementById("rulesLink");
    rulesLink.href = "https://example.com/fallback";

    delete window.config.PGRUBIC_DOCUMENTATION_URL;
    resolveExternalLinks();
    expect(rulesLink.href).toBe("https://example.com/fallback");

    window.config.PGRUBIC_DOCUMENTATION_URL = "";
    resolveExternalLinks();
    expect(rulesLink.href).toBe("https://example.com/fallback");
  });
});
