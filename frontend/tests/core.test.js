// Test core operations

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { formatSql, lintSql, lintAndFixSql, generateShareLink, loadSharedlink } from "../src/core"
import toml from "toml"

describe("Core Functions", () => {
  let configEditor, sqlEditor, notify, printErrors, printViolations, setButtonsDisabled
  let sqlOutputBox, sqlOutput, sqlOutputLabel, lintOutput, lintViolationsSummary

  beforeEach(() => {
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    });

    // Mock window
    Object.defineProperty(window, "location", {
      value: { pathname: "/abc123" },
      writable: true,
    });

    configEditor = {
      getValue: vi.fn(),
      setValue: vi.fn(),
    }
    sqlEditor = {
      getValue: vi.fn(),
      setValue: vi.fn(),
    }
    setButtonsDisabled = vi.fn()
    notify = vi.fn()
    printErrors = vi.fn(() => "errors")
    printViolations = vi.fn(() => "violations")

    sqlOutputBox = document.createElement("div")
    sqlOutputBox.id = "sqlOutputBox"
    sqlOutput = document.createElement("div")
    sqlOutput.id = "sqlOutput"
    sqlOutputLabel = document.createElement("div")
    sqlOutputLabel.id = "sqlOutputLabel"
    lintOutput = document.createElement("div")
    lintOutput.id = "lintOutput"
    lintViolationsSummary = document.createElement("div")
    lintViolationsSummary.id = "lintViolationsSummary"

    document.body.append(
      sqlOutputBox,
      sqlOutput,
      sqlOutputLabel,
      lintOutput,
      lintViolationsSummary
    )

    toml.parse.mockReset()
  })

  afterEach(() => {
    document.body.innerHTML = ""
  })

  // formatSql
  it("formatSql should notify error on config error", async () => {
    toml.parse.mockImplementation(() => { throw { line: 1, column: 1, message: "fail" } })
    await formatSql({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, printErrors })
    expect(notify).toHaveBeenCalledWith("Error in config", "error")
  })

  it("formatSql should print error on config error", async () => {
    toml.parse.mockImplementation(() => { throw { line: 1, column: 1, message: "fail" } })
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { })
    await formatSql({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, printViolations, printErrors })
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error in config. Parsing error on line 1, column 1: fail"
    )
    consoleErrorSpy.mockRestore()
  })

  it("formatSql should not call fetch on config error", async () => {
    toml.parse.mockImplementation(() => { throw { line: 1, column: 1, message: "fail" } })
    await formatSql({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, printViolations, printErrors })
    expect(fetch).not.toHaveBeenCalled()
  })

  it("formatSql should notify error on sql error", async () => {
    toml.parse.mockReturnValue({})
    sqlEditor.getValue.mockReturnValue("bad sql")
    fetch.mockResolvedValue({ json: async () => ({ violations: [], errors: ["error"] }) })
    await formatSql({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, printErrors })
    expect(notify).toHaveBeenCalledWith("Errors found in SQL!", "error")
  })

  it("formatSql should update DOM on success", async () => {
    toml.parse.mockReturnValue({ indent: 2 })
    sqlEditor.getValue.mockReturnValue("select 1;")
    fetch.mockResolvedValue({ json: async () => ({ formatted_source_code: "formatted sql", errors: [] }) })
    await formatSql({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, printErrors })
    expect(sqlOutputBox.style.display).toBe("flex")
    expect(sqlOutputLabel.textContent).toBe("Formatted SQL")
    expect(sqlOutput.textContent).toBe("formatted sql")
  })

  it("formatSql should handle fetch failure", async () => {
    toml.parse.mockReturnValue({})
    fetch.mockRejectedValue(new Error("network error"))
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { })

    await formatSql({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, printErrors })

    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  // lintSql
  it("lintSql should notify error on config error", async () => {
    toml.parse.mockImplementation(() => { throw { line: 1, column: 1, message: "fail" } })
    await lintSql({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, printViolations, printErrors })
    expect(notify).toHaveBeenCalledWith("Error in config", "error")
    expect(fetch).not.toHaveBeenCalled()
  })

  it("lintSql should print error on config error", async () => {
    toml.parse.mockImplementation(() => { throw { line: 1, column: 1, message: "fail" } })
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { })
    await lintSql({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, printViolations, printErrors })
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error in config. Parsing error on line 1, column 1: fail"
    )
    consoleErrorSpy.mockRestore()
  })

  it("lintSql should not call fetch on config error", async () => {
    toml.parse.mockImplementation(() => { throw { line: 1, column: 1, message: "fail" } })
    await lintSql({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, printViolations, printErrors })
    expect(fetch).not.toHaveBeenCalled()
  })

  it("lintSql should notify error on sql error", async () => {
    toml.parse.mockReturnValue({})
    sqlEditor.getValue.mockReturnValue("bad sql")
    fetch.mockResolvedValue({ json: async () => ({ violations: [], errors: ["err"] }) })
    await lintSql({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, printViolations, printErrors })
    expect(notify).toHaveBeenCalledWith("Errors found in SQL!", "error")
  })

  it("lintSql should notify success when no violations/errors", async () => {
    toml.parse.mockReturnValue({})
    sqlEditor.getValue.mockReturnValue("SELECT * FROM dual;")
    fetch.mockResolvedValue({ json: async () => ({ violations: [], errors: [] }) })
    await lintSql({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, printViolations, printErrors })
    expect(notify).toHaveBeenCalledWith("No violations found!", "success")
  })

  it("lintSql should print success summary when no violations/errors", async () => {
    toml.parse.mockReturnValue({})
    sqlEditor.getValue.mockReturnValue("SELECT * FROM dual;")
    fetch.mockResolvedValue({ json: async () => ({ violations: [], errors: [] }) })
    await lintSql({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, printViolations, printErrors })
    expect(lintViolationsSummary.innerHTML).toContain("All checks passed")
  })

  it("lintSql should notify warning when violations exist without errors", async () => {
    toml.parse.mockReturnValue({})
    sqlEditor.getValue.mockReturnValue("SELECT * FROM test;")
    fetch.mockResolvedValue({ json: async () => ({ violations: [1], errors: [] }) })
    await lintSql({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, printViolations, printErrors })
    expect(notify).toHaveBeenCalledWith("Violations found!", "warning")
  })

  it("lintSql should populate lint violations summary with violations", async () => {
    toml.parse.mockReturnValue({})
    sqlEditor.getValue.mockReturnValue("bad sql")
    fetch.mockResolvedValue({ json: async () => ({ violations: ["v"], errors: [], fixed_source_code: "fixed sql" }) })
    await lintSql({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, printViolations, printErrors })
    expect(lintViolationsSummary.classList.contains("has-violations")).toBeTruthy()
  })

  it("lintSql should handle fetch failure", async () => {
    toml.parse.mockReturnValue({})
    fetch.mockRejectedValue(new Error("network error"))
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { })

    await lintSql({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, printViolations, printErrors })

    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  // lintAndFixSql
  it("lintAndFixSql should notify error on config error", async () => {
    toml.parse.mockImplementation(() => { throw { line: 1, column: 1, message: "fail" } })
    await lintAndFixSql({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, printViolations, printErrors })
    expect(notify).toHaveBeenCalledWith("Error in config", "error")
  })

  it("lintAndFixSql should print error on config error", async () => {
    toml.parse.mockImplementation(() => { throw { line: 1, column: 1, message: "fail" } })
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { })
    await lintAndFixSql({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, printViolations, printErrors })
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error in config. Parsing error on line 1, column 1: fail"
    )
    consoleErrorSpy.mockRestore()
  })

  it("lintAndFixSql should not call fetch on config error", async () => {
    toml.parse.mockImplementation(() => { throw { line: 1, column: 1, message: "fail" } })
    await lintAndFixSql({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, printViolations, printErrors })
    expect(fetch).not.toHaveBeenCalled()
  })

  it("lintAndFixSql should notify error on sql error", async () => {
    toml.parse.mockReturnValue({})
    sqlEditor.getValue.mockReturnValue("bad sql")
    fetch.mockResolvedValue({ json: async () => ({ violations: [], errors: ["err"], fixed_source_code: "fixed sql" }) })
    await lintAndFixSql({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, printViolations, printErrors })
    expect(notify).toHaveBeenCalledWith("Errors found in SQL!", "error")
  })

  it("lintAndFixSql should notify warning when violations exist with no errors", async () => {
    toml.parse.mockReturnValue({})
    sqlEditor.getValue.mockReturnValue("bad sql")
    fetch.mockResolvedValue({ json: async () => ({ violations: ["v"], errors: [], fixed_source_code: "fixed sql" }) })
    await lintAndFixSql({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, printViolations, printErrors })
    expect(notify).toHaveBeenCalledWith("Violations found!", "warning")
  })

  it("lintAndFixSql should populate lint violations summary with violations", async () => {
    toml.parse.mockReturnValue({})
    sqlEditor.getValue.mockReturnValue("bad sql")
    fetch.mockResolvedValue({ json: async () => ({ violations: ["v"], errors: [], fixed_source_code: "fixed sql" }) })
    await lintAndFixSql({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, printViolations, printErrors })
    expect(lintViolationsSummary.classList.contains("has-violations")).toBeTruthy()
  })

  it("lintAndFixSql should print success summary when no violations/errors", async () => {
    toml.parse.mockReturnValue({})
    sqlEditor.getValue.mockReturnValue("SELECT * FROM dual;")
    fetch.mockResolvedValue({ json: async () => ({ violations: [], errors: [] }) })
    await lintAndFixSql({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, printViolations, printErrors })
    expect(lintViolationsSummary.innerHTML).toContain("All checks passed")
  })

  it("lintAndFixSql should notify success when no violations/errors", async () => {
    toml.parse.mockReturnValue({})
    sqlEditor.getValue.mockReturnValue("select * from table;")
    fetch.mockResolvedValue({ json: async () => ({ violations: [], errors: [], fixed_source_code: "fixed sql" }) })
    await lintAndFixSql({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, printViolations, printErrors })
    expect(notify).toHaveBeenCalledWith("No violations found!", "success")
  })

  it("lintAndFixSql should show fixed SQL", async () => {
    toml.parse.mockReturnValue({})
    sqlEditor.getValue.mockReturnValue("select * from table;")
    fetch.mockResolvedValue({ json: async () => ({ violations: [], errors: [], fixed_source_code: "fixed sql" }) })
    await lintAndFixSql({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, printViolations, printErrors })
    expect(sqlOutputBox.style.display).toBe("flex")
    expect(sqlOutputLabel.textContent).toBe("Fixed SQL")
    expect(sqlOutput.textContent).toBe("fixed sql")
  })

  it("lintAndFixSql should handle fetch failure", async () => {
    toml.parse.mockReturnValue({})
    fetch.mockRejectedValue(new Error("network error"))
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { })

    await lintAndFixSql({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, printViolations, printErrors })

    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  // generateShareLink
  it("generateShareLink should notify error on config error", async () => {
    toml.parse.mockImplementation(() => { throw { line: 1, column: 1, message: "fail" } })
    await generateShareLink({ API_BASE_URL: "/api", configEditor, sqlEditor, notify })
    expect(notify).toHaveBeenCalledWith("Error in config", "error")
  })

  it("generateShareLink should print error on config error", async () => {
    toml.parse.mockImplementation(() => { throw { line: 1, column: 1, message: "fail" } })
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { })
    await generateShareLink({ API_BASE_URL: "/api", configEditor, sqlEditor, notify })
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error in config. Parsing error on line 1, column 1: fail"
    )
    consoleErrorSpy.mockRestore()
  })

  it("generateShareLink should not call fetch on config error", async () => {
    toml.parse.mockImplementation(() => { throw { line: 1, column: 1, message: "fail" } })
    await generateShareLink({ API_BASE_URL: "/api", configEditor, sqlEditor, notify })
    expect(fetch).not.toHaveBeenCalled()
  })

  it("generateShareLink should handle fetch failure", async () => {
    toml.parse.mockReturnValue({})
    fetch.mockRejectedValue(new Error("network error"))
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { })

    await generateShareLink({ API_BASE_URL: "/api", configEditor, sqlEditor, notify })

    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it("generateShareLink should print success message", async () => {
    toml.parse.mockReturnValue({})
    sqlEditor.getValue.mockReturnValue("select 1;")
    fetch.mockResolvedValue({ json: async () => ({ request_id: "abc123" }) })
    await generateShareLink({ API_BASE_URL: "/api", configEditor, sqlEditor, notify })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      window.location.origin + "/abc123"
    );
    expect(notify).toHaveBeenCalledWith("Copied to clipboard!", "success");
  })

  // loadSharedlink
  it("loadSharedlink should notify error on invalid link", async () => {
    fetch.mockResolvedValue({ status: 404, json: () => Promise.resolve({}) })
    await loadSharedlink({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, setButtonsDisabled })
    expect(notify).toHaveBeenCalledWith("Invalid or expired link", "error")
  })

  it("loadSharedlink should load shared link", async () => {
    fetch.mockResolvedValue({ status: 200, json: () => Promise.resolve({}) })
    await loadSharedlink({ API_BASE_URL: "/api", configEditor, sqlEditor, notify, setButtonsDisabled })
    expect(notify).toHaveBeenCalledWith("Loaded from shared link", "success")
  })

  it("loadSharedlink should handle fetch failure", async () => {
    toml.parse.mockReturnValue({})
    fetch.mockRejectedValue(new Error("network error"))
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { })

    await loadSharedlink({ API_BASE_URL: "/api", configEditor, sqlEditor, notify })

    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

})
