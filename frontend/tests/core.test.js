// Test core operations

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  formatSql,
  lintSql,
  lintAndFixSql,
  generateShareLink,
  loadDefaultConfig,
  loadSharedlink,
  loadPgrubicVersion,
} from "../src/core";

import toml from "toml";

describe("Core Functions", () => {
  const API_BASE_URL = window.config.API_BASE_URL;

  let configEditor,
    sqlEditor,
    outputEditor,
    notify,
    printErrors,
    printViolations,
    setButtonsDisabled;

  let sqlOutputBox,
    sqlOutputLabel,
    lintOutput,
    lintViolationsSummary,
    pgrubicVersion;

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

  outputEditor = {
    getValue: vi.fn(() => "output sql"),
    setValue: vi.fn(),
  };

  setButtonsDisabled = vi.fn();
  notify = vi.fn();
  printErrors = vi.fn(() => "errors");
  printViolations = vi.fn(() => "violations");

  beforeEach(() => {
    document.body.replaceChildren();
    sqlOutputBox = document.createElement("div");
    sqlOutputBox.id = "sqlOutputBox";
    sqlOutputLabel = document.createElement("div");
    sqlOutputLabel.id = "sqlOutputLabel";
    lintOutput = document.createElement("div");
    lintOutput.id = "lintOutput";
    lintViolationsSummary = document.createElement("div");
    lintViolationsSummary.id = "lintViolationsSummary";
    pgrubicVersion = document.createElement("span");
    pgrubicVersion.id = "pgrubicVersion";
    document.body.append(
      sqlOutputBox,
      sqlOutputLabel,
      lintOutput,
      lintViolationsSummary,
      pgrubicVersion,
    );
  });

  // loadDefaultConfig
  it("loadDefaultConfig should return TOML defaults", async () => {
    const defaults = "[lint]\nselect = []";
    fetch.mockResolvedValue({ ok: true, text: async () => defaults });

    await expect(loadDefaultConfig({ API_BASE_URL })).resolves.toBe(defaults);
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/config/defaults`,
      expect.objectContaining({ signal: expect.anything() }),
    );
  });

  it("loadDefaultConfig should reject an unsuccessful response", async () => {
    fetch.mockResolvedValue({ ok: false });

    await expect(loadDefaultConfig({ API_BASE_URL })).rejects.toThrow(
      "Failed to load default configuration",
    );
  });

  it("loadDefaultConfig works without AbortSignal.timeout", async () => {
    vi.useFakeTimers();
    const originalAbortSignal = globalThis.AbortSignal;
    globalThis.AbortSignal = {};
    fetch.mockResolvedValue({ ok: true, text: async () => "[lint]" });

    try {
      await expect(loadDefaultConfig({ API_BASE_URL })).resolves.toBe("[lint]");
      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/config/defaults`,
        expect.objectContaining({ signal: expect.anything() }),
      );
      vi.runAllTimers();
    } finally {
      vi.useRealTimers();
      globalThis.AbortSignal = originalAbortSignal;
    }
  });

  // formatSql
  it("formatSql should notify error on config error", async () => {
    toml.parse.mockImplementation(() => {
      throw { line: 1, column: 1, message: "fail" };
    });
    await formatSql({
      API_BASE_URL,
      configEditor,
      sqlEditor,
      outputEditor,
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
      API_BASE_URL,
      configEditor,
      sqlEditor,
      outputEditor,
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
      API_BASE_URL,
      configEditor,
      sqlEditor,
      outputEditor,
      notify,
      printErrors,
    });
    expect(sqlOutputBox.style.display).toBe("flex");
    expect(sqlOutputLabel.textContent).toBe("Formatted SQL");
    expect(outputEditor.setValue).toHaveBeenCalledWith("formatted sql");
  });

  it("formatSql should handle fetch failure", async () => {
    fetch.mockResolvedValue({
      ok: false,
    });
    await formatSql({
      API_BASE_URL,
      configEditor,
      sqlEditor,
      notify,
      printErrors,
    });
    expect(notify).toHaveBeenCalledWith("Operation failed!", "error");
  });

  it("formatSql should report backend configuration errors", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        detail: [
          {
            loc: ["body", "config", "format", "type-casting-style"],
            msg: "Input should be 'standard', 'native' or 'literal'",
          },
        ],
      }),
    });

    await formatSql({
      API_BASE_URL,
      configEditor,
      sqlEditor,
      outputEditor,
      notify,
      printErrors,
    });

    expect(notify).toHaveBeenCalledWith(
      "Configuration error: format.type-casting-style: Input should be 'standard', 'native' or 'literal'",
      "error",
    );
  });

  it.each([
    { detail: "invalid" },
    { detail: [{ loc: ["body", "source_code"], msg: "Field required" }] },
  ])("formatSql should report non-config validation errors", async (body) => {
    fetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => body,
    });

    await formatSql({
      API_BASE_URL,
      configEditor,
      sqlEditor,
      outputEditor,
      notify,
      printErrors,
    });

    expect(notify).toHaveBeenCalledWith("Invalid request", "error");
  });

  it("formatSql should handle an unreadable validation response", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => {
        throw new Error("invalid JSON");
      },
    });

    await formatSql({
      API_BASE_URL,
      configEditor,
      sqlEditor,
      outputEditor,
      notify,
      printErrors,
    });

    expect(notify).toHaveBeenCalledWith("Invalid request", "error");
  });

  it("formatSql should handle other fetch failure", async () => {
    fetch.mockRejectedValue(new Error("network error"));
    await formatSql({
      API_BASE_URL,
      configEditor,
      sqlEditor,
      notify,
      printErrors,
    });
    expect(notify).toHaveBeenCalledWith("Operation failed!", "error");
    expect(lintOutput.textContent).toBe("");
  });

  it("formatSql should report request timeout", async () => {
    fetch.mockRejectedValue(new DOMException("Timed out", "TimeoutError"));
    await formatSql({
      API_BASE_URL,
      configEditor,
      sqlEditor,
      notify,
      printErrors,
    });
    expect(notify).toHaveBeenCalledWith(
      "Request timed out after 10 seconds",
      "error",
    );
  });

  // lintSql
  it.each([
    [lintSql, "Linting...", {}],
    [lintAndFixSql, "Linting with fix...", { outputEditor }],
  ])(
    "%s clears previous lint results before the request completes",
    async (operation, progressMessage, extraParams) => {
      let resolveRequest;
      fetch.mockReturnValue(
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
      );
      lintOutput.textContent = "Previous violation";
      lintViolationsSummary.textContent =
        "Found 1 violation(s) and 0 error(s).";
      lintViolationsSummary.classList.add("has-violations");

      const request = operation({
        API_BASE_URL,
        configEditor,
        sqlEditor,
        notify,
        printViolations,
        printErrors,
        ...extraParams,
      });

      expect(lintOutput.textContent).toBe(progressMessage);
      expect(lintViolationsSummary.textContent).toBe("");
      expect(lintViolationsSummary.className).toBe("");

      resolveRequest({
        ok: true,
        json: async () => ({ violations: [], errors: [] }),
      });
      await request;
    },
  );

  it("lintSql should notify error on config error", async () => {
    toml.parse.mockImplementation(() => {
      throw { line: 1, column: 1, message: "fail" };
    });
    await lintSql({
      API_BASE_URL,
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
      API_BASE_URL,
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
      API_BASE_URL,
      configEditor,
      sqlEditor,
      notify,
      printViolations,
      printErrors,
    });
    expect(notify).toHaveBeenCalledWith("No violations found!", "success");
    expect(lintViolationsSummary.innerHTML).toContain("All checks passed");
  });

  it("lintSql should notify warning when violations exist without errors", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ violations: [1], errors: [] }),
    });
    await lintSql({
      API_BASE_URL,
      configEditor,
      sqlEditor,
      notify,
      printViolations,
      printErrors,
    });
    expect(notify).toHaveBeenCalledWith("Violations found!", "warning");
    expect(
      lintViolationsSummary.classList.contains("has-violations"),
    ).toBeTruthy();
  });

  it("lintSql should handle fetch failure", async () => {
    fetch.mockResolvedValue({
      ok: false,
    });
    await lintSql({
      API_BASE_URL,
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
      API_BASE_URL,
      configEditor,
      sqlEditor,
      notify,
      printViolations,
      printErrors,
    });
    expect(notify).toHaveBeenCalledWith("Operation failed!", "error");
    expect(lintOutput.textContent).toBe("");
  });

  // lintAndFixSql
  it("lintAndFixSql should notify error on config error", async () => {
    toml.parse.mockImplementation(() => {
      throw { line: 1, column: 1, message: "fail" };
    });
    await lintAndFixSql({
      API_BASE_URL,
      configEditor,
      sqlEditor,
      outputEditor,
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
      API_BASE_URL,
      configEditor,
      sqlEditor,
      outputEditor,
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
      API_BASE_URL,
      configEditor,
      sqlEditor,
      outputEditor,
      notify,
      printViolations,
      printErrors,
    });
    expect(notify).toHaveBeenCalledWith("Violations found!", "warning");
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
      API_BASE_URL,
      configEditor,
      sqlEditor,
      outputEditor,
      notify,
      printViolations,
      printErrors,
    });
    expect(notify).toHaveBeenCalledWith("No violations found!", "success");
    expect(lintViolationsSummary.innerHTML).toContain("All checks passed");
    expect(outputEditor.setValue).toHaveBeenCalledWith("");
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
      API_BASE_URL,
      configEditor,
      sqlEditor,
      outputEditor,
      notify,
      printViolations,
      printErrors,
    });
    expect(sqlOutputBox.style.display).toBe("flex");
    expect(sqlOutputLabel.textContent).toBe("Fixed SQL");
    expect(outputEditor.setValue).toHaveBeenCalledWith("fixed sql");
  });

  it("lintAndFixSql should handle fetch failure", async () => {
    fetch.mockResolvedValue({
      ok: false,
    });
    await lintAndFixSql({
      API_BASE_URL,
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
      API_BASE_URL,
      configEditor,
      sqlEditor,
      notify,
      printViolations,
      printErrors,
    });
    expect(notify).toHaveBeenCalledWith("Operation failed!", "error");
    expect(lintOutput.textContent).toBe("");
  });

  // generateShareLink
  it("generateShareLink should notify error on config error", async () => {
    toml.parse.mockImplementation(() => {
      throw { line: 1, column: 1, message: "fail" };
    });
    await generateShareLink({
      API_BASE_URL,
      configEditor,
      sqlEditor,
      notify,
    });
    expect(notify).toHaveBeenCalledWith("Error in config", "error");
  });

  it("generateShareLink should handle fetch failure", async () => {
    fetch.mockResolvedValue({
      ok: false,
    });
    await generateShareLink({
      API_BASE_URL,
      configEditor,
      sqlEditor,
      outputEditor,
      notify,
    });
    expect(notify).toHaveBeenCalledWith("Operation failed!", "error");
  });

  it("generateShareLink should handle other fetch failure", async () => {
    fetch.mockRejectedValue(new Error("network error"));
    await generateShareLink({
      API_BASE_URL,
      configEditor,
      sqlEditor,
      outputEditor,
      notify,
    });
    expect(notify).toHaveBeenCalledWith("Operation failed!", "error");
  });

  it("generateShareLink should generate share link on success", async () => {
    lintViolationsSummary.className = "";
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ request_id: "abc123" }),
    });

    const url = await generateShareLink({
      API_BASE_URL,
      configEditor,
      sqlEditor,
      outputEditor,
      notify,
    });

    expect(url).toBe(window.location.origin + "/abc123");
  });

  it.each(["no-violations", "has-violations"])(
    "generateShareLink should preserve the %s summary state",
    async (summaryClass) => {
      lintViolationsSummary.className = summaryClass;
      lintOutput.replaceChildren(document.createElement("div"));
      lintOutput.firstChild.className = "lint-message";
      lintOutput.firstChild.textContent = "A result";
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ request_id: "abc123" }),
      });

      await generateShareLink({
        API_BASE_URL,
        configEditor,
        sqlEditor,
        outputEditor,
        notify,
      });

      const payload = JSON.parse(fetch.mock.calls[0][1].body);
      expect(payload.lint_violations_summary_class).toBe(summaryClass);
      expect(payload.lint_output).toBe("A result");
    },
  );

  // loadSharedlink
  it("loadSharedlink should notify error on invalid link", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({}),
    });
    await loadSharedlink({
      API_BASE_URL,
      configEditor,
      sqlEditor,
      outputEditor,
      notify,
      setButtonsDisabled,
      initialConfig: "[lint]",
      initialSql: "SELECT 1;",
    });
    expect(notify).toHaveBeenCalledWith("Invalid or expired link", "error");
    expect(configEditor.setValue).toHaveBeenCalledWith("[lint]");
    expect(sqlEditor.setValue).toHaveBeenCalledWith("SELECT 1;");
    expect(setButtonsDisabled).toHaveBeenCalledWith(false);
  });

  it("loadSharedlink should load shared link", async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          toml_config: "[lint]",
          source_code: "SELECT 1;",
          sql_output_box_style: "block",
          sql_output_label: "Result",
          sql_output: "SELECT 1;",
          lint_violations_summary: "<img src=x onerror=alert(1)>",
          lint_violations_summary_class: "attacker-class",
          lint_output: "<script>alert(1)</script>",
        }),
    });
    await loadSharedlink({
      API_BASE_URL,
      configEditor,
      sqlEditor,
      outputEditor,
      notify,
      setButtonsDisabled,
    });
    expect(notify).toHaveBeenCalledWith("Loaded from shared link", "success");
    expect(lintOutput.textContent).toBe("<script>alert(1)</script>");
    expect(lintOutput.querySelector("script")).toBeNull();
    expect(lintViolationsSummary.classList.contains("attacker-class")).toBe(
      false,
    );
    expect(sqlOutputBox.style.display).toBe("none");
    expect(outputEditor.setValue).toHaveBeenCalledWith("SELECT 1;");
  });

  it("loadSharedlink should restore optional output state", async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        toml_config: "[lint]",
        source_code: "SELECT 1;",
        sql_output_box_style: "flex",
        sql_output_label: "Fixed SQL",
        sql_output: null,
        lint_violations_summary: "All checks passed.",
        lint_violations_summary_class: "no-violations",
        lint_output: null,
      }),
    });

    await expect(
      loadSharedlink({
        API_BASE_URL,
        configEditor,
        sqlEditor,
        outputEditor,
        notify,
        setButtonsDisabled,
      }),
    ).resolves.toBe(true);

    expect(sqlOutputBox.style.display).toBe("flex");
    expect(outputEditor.setValue).toHaveBeenCalledWith("");
    expect(lintViolationsSummary.classList.contains("no-violations")).toBe(
      true,
    );
  });

  it("loadSharedlink should handle fetch failure", async () => {
    fetch.mockResolvedValue({ ok: false, json: () => Promise.resolve({}) });
    await loadSharedlink({
      API_BASE_URL,
      configEditor,
      sqlEditor,
      notify,
      setButtonsDisabled,
      initialConfig: "[lint]",
      initialSql: "SELECT 1;",
    });
    expect(notify).toHaveBeenCalledWith("Failed to load shared link", "error");
    expect(configEditor.setValue).toHaveBeenCalledWith("[lint]");
    expect(sqlEditor.setValue).toHaveBeenCalledWith("SELECT 1;");
    expect(setButtonsDisabled).toHaveBeenCalledWith(false);
  });

  it("loadSharedlink should handle other fetch failure", async () => {
    fetch.mockRejectedValue(new Error("network error"));
    await loadSharedlink({
      API_BASE_URL,
      configEditor,
      sqlEditor,
      notify,
      setButtonsDisabled,
      initialConfig: "[lint]",
      initialSql: "SELECT 1;",
    });
    expect(notify).toHaveBeenCalledWith("Operation failed!", "error");
    expect(configEditor.setValue).toHaveBeenCalledWith("[lint]");
    expect(sqlEditor.setValue).toHaveBeenCalledWith("SELECT 1;");
    expect(setButtonsDisabled).toHaveBeenCalledWith(false);
  });

  // loadPgrubicVersion
  it("loadPgrubicVersion should display version on success", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ version: "1.0.0" }),
    });
    await loadPgrubicVersion({ API_BASE_URL });
    expect(pgrubicVersion.textContent).toBe("1.0.0");
  });

  it("loadPgrubicVersion should display 'Unavailable' on fetch failure", async () => {
    fetch.mockResolvedValue({ ok: false });
    await loadPgrubicVersion({ API_BASE_URL });
    expect(pgrubicVersion.textContent).toBe("Unavailable");
  });

  it("loadPgrubicVersion should display 'Unavailable' on other fetch failure", async () => {
    fetch.mockRejectedValue(new Error("network error"));
    await loadPgrubicVersion({ API_BASE_URL });
    expect(pgrubicVersion.textContent).toBe("Unavailable");
  });
});
