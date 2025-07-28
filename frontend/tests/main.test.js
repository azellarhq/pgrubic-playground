// Test entry point

import { describe, it, beforeEach, vi, expect } from "vitest";

import * as core from "../src/core";
import * as utils from "../src/utils";
import { setupEventListeners } from "../src/main";
import { configEditor, defaultConfig } from "../src/editors";

describe("Main button event listeners", () => {
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

  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue() },
  });

  window.config = { API_BASE_URL: "/api" };

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

    setupEventListeners();
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

  it("calls copyToClipboard on copyBtn click and notifies", () => {
    document.getElementById("copyBtn").click();
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
    core.generateShareLink.mockResolvedValue("https://fake.share/link");

    await document.getElementById("shareBtn").click();
    await Promise.resolve();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "https://fake.share/link",
    );
    expect(utils.notify).toHaveBeenCalledWith(
      "Copied to clipboard!",
      "success",
    );
  });

  it("generateShareLink notifies with config error message on ConfigParseError", async () => {
    const error = new core.ConfigParseError("Error in config");
    core.generateShareLink.mockRejectedValue(error);

    await document.getElementById("shareBtn").click();
    await Promise.resolve();

    expect(utils.notify).toHaveBeenCalledWith("Error in config", "error");
  });

  it("notifies with generic error message on unexpected error", async () => {
    core.generateShareLink.mockRejectedValue(new Error("Network down"));

    await document.getElementById("shareBtn").click();
    await Promise.resolve();

    expect(utils.notify).toHaveBeenCalledWith("Operation failed!", "error");
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
