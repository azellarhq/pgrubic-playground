// Test entry point

import { describe, it, beforeEach, vi, expect } from "vitest";

import * as core from "../src/core";
import * as utils from "../src/utils";
import { setupEventListeners, resolveExternalLinks } from "../src/main";
import { configEditor, defaultConfig } from "../src/editors";

// Mocks
vi.mock("../src/editors", () => ({
  configEditor: {
    getValue: vi.fn(),
    setValue: vi.fn(),
  },

  sqlEditor: {
    getValue: vi.fn(),
    setValue: vi.fn(),
  },

  defaultConfig: "",

  defaultSql: "",
}));

describe("Main button event listeners", () => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue() },
  });

  beforeEach(() => {
    // Mock DOM
    document.body.innerHTML = `
      <button id="formatBtn"></button>
      <button id="lintBtn"></button>
      <button id="lintFixBtn"></button>
      <button id="copyBtn"></button>
      <button id="shareBtn"></button>
      <button id="resetConfigBtn"></button>
      <div id="hamburger"></div>
      <div id="top-links"></div>
    `;

    // Spy functions
    vi.spyOn(core, "formatSql").mockResolvedValue();
    vi.spyOn(core, "lintSql").mockResolvedValue();
    vi.spyOn(core, "lintAndFixSql").mockResolvedValue();
    vi.spyOn(core, "generateShareLink").mockResolvedValue();
    vi.spyOn(utils, "copyToClipboard").mockImplementation(() => {});
    vi.spyOn(utils, "notify").mockImplementation(() => {});
    vi.spyOn(core, "loadPgrubicVersion").mockResolvedValue();

    return setupEventListeners();
  });

  it("calls formatSql on formatBtn click", async () => {
    document.getElementById("formatBtn").click();
    expect(core.formatSql).toHaveBeenCalled();
  });

  it("calls lintSql on lintBtn click", async () => {
    document.getElementById("lintBtn").click();
    expect(core.lintSql).toHaveBeenCalled();
  });

  it("calls lintAndFixSql on lintFixBtn click", async () => {
    document.getElementById("lintFixBtn").click();
    expect(core.lintAndFixSql).toHaveBeenCalled();
  });

  it("calls copyToClipboard on copyBtn click and notifies", async () => {
    await document.getElementById("copyBtn").click();
    expect(utils.copyToClipboard).toHaveBeenCalledWith("sqlOutput");
    expect(utils.notify).toHaveBeenCalledWith(
      "Copied to clipboard!",
      "success",
    );
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

  it("shareBtn notifies on clipboard write failure with error message", async () => {
    const shareLink = "https://fake.share/link";

    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new DOMException("Permission denied", "NotAllowedError"),
    );

    core.generateShareLink.mockResolvedValue(shareLink);

    await document.getElementById("shareBtn").click();
    await Promise.resolve();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(shareLink);

    expect(utils.notify).toHaveBeenCalledWith("Permission denied", "error");
  });

  it("shareBtn notifies on clipboard write failure without error message", async () => {
    const shareLink = "https://fake.share/link";

    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new DOMException("", "NotAllowedError"),
    );

    core.generateShareLink.mockResolvedValue(shareLink);

    await document.getElementById("shareBtn").click();
    await Promise.resolve();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(shareLink);

    expect(utils.notify).toHaveBeenCalledWith(
      "Failed to copy to clipboard.",
      "error",
    );
  });

  it("resets config and notifies on resetConfigBtn click", () => {
    document.getElementById("resetConfigBtn").click();
    expect(configEditor.setValue).toHaveBeenCalledWith(defaultConfig);
    expect(utils.notify).toHaveBeenCalledWith(
      "Configuration reset to default!",
      "info",
    );
  });

  it("toggles top-links visibility on hamburger click", () => {
    const topLinks = document.getElementById("top-links");
    expect(topLinks.classList.contains("show")).toBe(false);

    document.getElementById("hamburger").click();
    expect(topLinks.classList.contains("show")).toBe(true);

    document.getElementById("hamburger").click();
    expect(topLinks.classList.contains("show")).toBe(false);
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
