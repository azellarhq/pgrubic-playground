// Test utils

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  notify,
  copyToClipboard,
  printViolations,
  printErrors,
} from "../src/utils";

describe("Utils", () => {
  beforeEach(() => {
    navigator.clipboard = {
      writeText: vi.fn(),
    };
  });

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("notify", () => {
    it("creates notification with message and type", () => {
      notify("Hello World", "error");
      const notification = document.querySelector(".notification.error");
      expect(notification).not.toBeNull();
      expect(notification.textContent).toBe("Hello World");
    });

    it("removes the notification after timeout", async () => {
      vi.useFakeTimers();
      notify("Temp message");
      expect(document.querySelector(".notification")).not.toBeNull();
      vi.runAllTimers();
      expect(document.querySelector(".notification")).toBeNull();
      vi.useRealTimers();
    });
  });

  describe("copyToClipboard", () => {
    it("copies text content of element to clipboard", async () => {
      const clipboardWriteText = vi
        .spyOn(navigator.clipboard, "writeText")
        .mockResolvedValue();
      const element = document.createElement("div");
      element.id = "test-id";
      element.textContent = "Copy me";
      document.body.appendChild(element);

      copyToClipboard("test-id");

      expect(clipboardWriteText).toHaveBeenCalledWith("Copy me");
    });
  });

  describe("printViolations", () => {
    it("renders HTML for violations", () => {
      const violations = [
        {
          description: "Test violation",
          rule_code: "R001",
          line_number: 1,
          column_offset: 2,
        },
      ];
      const html = printViolations(violations);
      expect(html).toContain("Test violation");
      expect(html).toContain("R001");
      expect(html).toContain("Ln 1, Col 2");
    });
  });

  describe("printErrors", () => {
    it("renders HTML for errors", () => {
      const errors = [{ message: "Syntax error", hint: "Check your syntax" }];
      const html = printErrors(errors);
      expect(html).toContain("Syntax error");
      expect(html).toContain("Check your syntax");
    });
  });
});
