// Test core operations

import { describe, it, expect, vi } from "vitest";
import {
  formatSql,
  lintSql,
  lintAndFixSql,
  generateShareLink,
  loadSharedlink,
} from "../src/core";
import { ConfigParseError } from "../src/core";

import toml from "toml";

describe("Core Functions", () => {
  let configEditor,
    sqlEditor,
    notify,
    printErrors,
    printViolations,
    setButtonsDisabled;
  let sqlOutputBox,
    sqlOutput,
    sqlOutputLabel,
    lintOutput,
    lintViolationsSummary;

  // Mocks
  Object.defineProperty(window, "location", {
    value: { pathname: "/abc123" },
    writable: true,
  });

  configEditor = {
    getValue: vi.fn(),
    setValue: vi.fn(),
  };

  sqlEditor = {
    getValue: vi.fn(),
    setValue: vi.fn(),
  };

  setButtonsDisabled = vi.fn();
  notify = vi.fn();
  printErrors = vi.fn(() => "errors");
  printViolations = vi.fn(() => "violations");

  sqlOutputBox = document.createElement("div");
  sqlOutputBox.id = "sqlOutputBox";
  sqlOutput = document.createElement("div");
  sqlOutput.id = "sqlOutput";
  sqlOutputLabel = document.createElement("div");
  sqlOutputLabel.id = "sqlOutputLabel";
  lintOutput = document.createElement("div");
  lintOutput.id = "lintOutput";
  lintViolationsSummary = document.createElement("div");
  lintViolationsSummary.id = "lintViolationsSummary";
  document.body.append(
    sqlOutputBox,
    sqlOutput,
    sqlOutputLabel,
    lintOutput,
    lintViolationsSummary,
  );

  // formatSql
  it("formatSql should notify error on config error", async () => {
    toml.parse.mockImplementation(() => {
      throw { line: 1, column: 1, message: "fail" };
    });
    await formatSql({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
      notify,
      printErrors,
    });
    expect(notify).toHaveBeenCalledWith("Error in config", "error");
  });

  it("formatSql should notify error on sql error", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ violations: [], errors: ["error"] }),
    });
    await formatSql({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
      notify,
      printErrors,
    });
    expect(notify).toHaveBeenCalledWith("Errors found in SQL!", "error");
  });

  it("formatSql should update DOM on success", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        formatted_source_code: "formatted sql",
        errors: [],
      }),
    });
    await formatSql({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
      notify,
      printErrors,
    });
    expect(sqlOutputBox.style.display).toBe("flex");
    expect(sqlOutputLabel.textContent).toBe("Formatted SQL");
    expect(sqlOutput.textContent).toBe("formatted sql");
  });

  it("formatSql should handle fetch failure", async () => {
    fetch.mockResolvedValue({
      ok: false,
    });
    await formatSql({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
      notify,
      printErrors,
    });
    expect(notify).toHaveBeenCalledWith("Operation failed!", "error");
  });

  it("formatSql should handle other fetch failure", async () => {
    fetch.mockRejectedValue(new Error("network error"));
    await formatSql({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
      notify,
      printErrors,
    });
    expect(notify).toHaveBeenCalledWith("Operation failed!", "error");
  });

  // lintSql
  it("lintSql should notify error on config error", async () => {
    toml.parse.mockImplementation(() => {
      throw { line: 1, column: 1, message: "fail" };
    });
    await lintSql({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
      notify,
      printViolations,
      printErrors,
    });
    expect(notify).toHaveBeenCalledWith("Error in config", "error");
  });

  it("lintSql should notify error on sql error", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ violations: [], errors: ["err"] }),
    });
    await lintSql({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
      notify,
      printViolations,
      printErrors,
    });
    expect(notify).toHaveBeenCalledWith("Errors found in SQL!", "error");
  });

  it("lintSql should notify success when no violations/errors", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ violations: [], errors: [] }),
    });
    await lintSql({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
      notify,
      printViolations,
      printErrors,
    });
    expect(notify).toHaveBeenCalledWith("No violations found!", "success");
  });

  it("lintSql should print success summary when no violations/errors", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ violations: [], errors: [] }),
    });
    await lintSql({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
      notify,
      printViolations,
      printErrors,
    });
    expect(lintViolationsSummary.innerHTML).toContain("All checks passed");
  });

  it("lintSql should notify warning when violations exist without errors", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ violations: [1], errors: [] }),
    });
    await lintSql({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
      notify,
      printViolations,
      printErrors,
    });
    expect(notify).toHaveBeenCalledWith("Violations found!", "warning");
  });

  it("lintSql should populate lint violations summary with violations", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        violations: ["v"],
        errors: [],
        fixed_source_code: "fixed sql",
      }),
    });
    await lintSql({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
      notify,
      printViolations,
      printErrors,
    });
    expect(
      lintViolationsSummary.classList.contains("has-violations"),
    ).toBeTruthy();
  });

  it("lintSql should handle fetch failure", async () => {
    fetch.mockResolvedValue({
      ok: false,
    });
    await lintSql({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
      notify,
      printViolations,
      printErrors,
    });
    expect(notify).toHaveBeenCalledWith("Operation failed!", "error");
  });

  it("lintSql should handle other fetch failure", async () => {
    fetch.mockRejectedValue(new Error("network error"));
    await lintSql({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
      notify,
      printViolations,
      printErrors,
    });
    expect(notify).toHaveBeenCalledWith("Operation failed!", "error");
  });

  // lintAndFixSql
  it("lintAndFixSql should notify error on config error", async () => {
    toml.parse.mockImplementation(() => {
      throw { line: 1, column: 1, message: "fail" };
    });
    await lintAndFixSql({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
      notify,
      printViolations,
      printErrors,
    });
    expect(notify).toHaveBeenCalledWith("Error in config", "error");
  });

  it("lintAndFixSql should notify error on sql error", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        violations: [],
        errors: ["err"],
        fixed_source_code: "fixed sql",
      }),
    });
    await lintAndFixSql({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
      notify,
      printViolations,
      printErrors,
    });
    expect(notify).toHaveBeenCalledWith("Errors found in SQL!", "error");
  });

  it("lintAndFixSql should notify warning when violations exist with no errors", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        violations: ["v"],
        errors: [],
        fixed_source_code: "fixed sql",
      }),
    });
    await lintAndFixSql({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
      notify,
      printViolations,
      printErrors,
    });
    expect(notify).toHaveBeenCalledWith("Violations found!", "warning");
  });

  it("lintAndFixSql should populate lint violations summary with violations", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        violations: ["v"],
        errors: [],
        fixed_source_code: "fixed sql",
      }),
    });
    await lintAndFixSql({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
      notify,
      printViolations,
      printErrors,
    });
    expect(
      lintViolationsSummary.classList.contains("has-violations"),
    ).toBeTruthy();
  });

  it("lintAndFixSql should print success summary when no violations/errors", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ violations: [], errors: [] }),
    });
    await lintAndFixSql({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
      notify,
      printViolations,
      printErrors,
    });
    expect(lintViolationsSummary.innerHTML).toContain("All checks passed");
  });

  it("lintAndFixSql should notify success when no violations/errors", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        violations: [],
        errors: [],
        fixed_source_code: "fixed sql",
      }),
    });
    await lintAndFixSql({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
      notify,
      printViolations,
      printErrors,
    });
    expect(notify).toHaveBeenCalledWith("No violations found!", "success");
  });

  it("lintAndFixSql should show fixed SQL", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        violations: [],
        errors: [],
        fixed_source_code: "fixed sql",
      }),
    });
    await lintAndFixSql({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
      notify,
      printViolations,
      printErrors,
    });
    expect(sqlOutputBox.style.display).toBe("flex");
    expect(sqlOutputLabel.textContent).toBe("Fixed SQL");
    expect(sqlOutput.textContent).toBe("fixed sql");
  });

  it("lintAndFixSql should handle fetch failure", async () => {
    fetch.mockResolvedValue({
      ok: false,
    });
    await lintAndFixSql({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
      notify,
      printViolations,
      printErrors,
    });
    expect(notify).toHaveBeenCalledWith("Operation failed!", "error");
  });

  it("lintAndFixSql should handle other fetch failure", async () => {
    fetch.mockRejectedValue(new Error("network error"));
    await lintAndFixSql({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
      notify,
      printViolations,
      printErrors,
    });
    expect(notify).toHaveBeenCalledWith("Operation failed!", "error");
  });

  // generateShareLink
  it("throws ConfigParseError if TOML parsing fails", async () => {
    toml.parse.mockImplementation(() => {
      throw { line: 1, column: 1, message: "fail" };
    });
    await expect(() =>
      generateShareLink({ API_BASE_URL: "/api", configEditor, sqlEditor }),
    ).rejects.toThrow(ConfigParseError);
  });

  it("generateShareLink should handle fetch failure", async () => {
    fetch.mockResolvedValue({
      ok: false,
    });
    await expect(() =>
      generateShareLink({ API_BASE_URL: "/api", configEditor, sqlEditor }),
    ).rejects.toThrow("Operation failed!");
  });

  it("generateShareLink should generate share link on success", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ request_id: "abc123" }),
    });

    const url = await generateShareLink({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
    });

    expect(url).toBe(window.location.origin + "/abc123");
  });

  // loadSharedlink
  it("loadSharedlink should notify error on invalid link", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({}),
    });
    await loadSharedlink({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
      notify,
      setButtonsDisabled,
    });
    expect(notify).toHaveBeenCalledWith("Invalid or expired link", "error");
  });

  it("loadSharedlink should load shared link", async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
    await loadSharedlink({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
      notify,
      setButtonsDisabled,
    });
    expect(notify).toHaveBeenCalledWith("Loaded from shared link", "success");
  });

  it("loadSharedlink should handle fetch failure", async () => {
    fetch.mockResolvedValue({ ok: false, json: () => Promise.resolve({}) });
    await loadSharedlink({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
      notify,
      setButtonsDisabled,
    });
    expect(notify).toHaveBeenCalledWith("Failed to load shared link", "error");
  });

  it("loadSharedlink should handle other fetch failure", async () => {
    fetch.mockRejectedValue(new Error("network error"));
    await loadSharedlink({
      API_BASE_URL: "/api",
      configEditor,
      sqlEditor,
      notify,
      setButtonsDisabled,
    });
    expect(notify).toHaveBeenCalledWith("Operation failed!", "error");
  });
});
