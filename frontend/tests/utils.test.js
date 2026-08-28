// Test utils

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  notify,
  copyToClipboard,
  printViolations,
  printErrors,
  printOutputLines,
} from "../src/utils";

describe("Utils", () => {
  beforeEach(() => {
    navigator.clipboard = {
      writeText: vi.fn(),
    };
    document.body.innerHTML = "";
  });

  describe("notify", () => {
    it("creates notification with message and type", () => {
      notify("Hello World", "error");
      const notification = document.querySelector(".notification.error");
      expect(notification).not.toBeNull();
      expect(notification.querySelector("span").textContent).toBe(
        "Hello World",
      );
      expect(notification.getAttribute("role")).toBe("alert");
    });

    it("uses an existing notification container", () => {
      const container = document.createElement("div");
      container.id = "notifications";
      document.body.appendChild(container);

      notify("Hello", "info");

      expect(container.querySelectorAll(".notification")).toHaveLength(1);
    });

    it("can be dismissed", () => {
      notify("Dismiss me", "info");
      document.querySelector(".notification-dismiss").click();
      expect(document.querySelector(".notification")).toBeNull();
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
      copyToClipboard("Copy me");

      expect(clipboardWriteText).toHaveBeenCalledWith("Copy me");
    });
  });

  describe("printViolations", () => {
    it("renders plain text for violations", () => {
      const violations = [
        {
          description: "Test violation",
          rule_code: "R001",
          line_number: 1,
          column_offset: 2,
        },
      ];
      const container = document.createElement("div");
      container.appendChild(printViolations(violations));

      expect(container.querySelector("strong").textContent).toBe(
        "Test violation",
      );
      expect(container.textContent).toContain("R001");
      expect(container.textContent).toContain("Ln 1, Col 2");
    });

    it("does not interpret violation messages as HTML", () => {
      const container = document.createElement("div");
      container.appendChild(
        printViolations([
          {
            description: "<img src=x onerror=alert(1)>",
            rule_code: "R001",
            line_number: 1,
            column_offset: 2,
          },
        ]),
      );

      expect(container.querySelector("img")).toBeNull();
      expect(container.textContent).toContain("<img");
    });
  });

  describe("printErrors", () => {
    it("renders plain text for errors", () => {
      const errors = [{ message: "Syntax error", hint: "Check your syntax" }];
      const container = document.createElement("div");
      container.appendChild(printErrors(errors));

      expect(container.querySelector("strong").textContent).toBe(
        "Syntax error",
      );
      expect(container.querySelector(".lint-error-hint").textContent).toBe(
        "Hint: Check your syntax",
      );
      expect(container.querySelector(".lint-message-error")).not.toBeNull();
      expect(container.textContent).toBe(
        "Syntax error\nHint: Check your syntax",
      );
    });

    it("omits empty error hints", () => {
      const container = document.createElement("div");
      container.appendChild(
        printErrors([{ message: "Syntax error", hint: "" }]),
      );

      expect(container.textContent).toBe("Syntax error");
      expect(container.querySelector(".lint-error-hint")).toBeNull();
    });
  });

  describe("printOutputLines", () => {
    it("renders empty and detail-free shared output safely", () => {
      const empty = document.createElement("div");
      empty.appendChild(printOutputLines(null));
      expect(empty.textContent).toBe("");

      const output = document.createElement("div");
      output.appendChild(printOutputLines("A plain message"));
      expect(output.querySelector("strong").textContent).toBe(
        "A plain message",
      );
      expect(output.querySelector(".lint-message-metadata")).toBeNull();

      const detailed = document.createElement("div");
      detailed.appendChild(printOutputLines("A message (details)"));
      expect(detailed.querySelector("strong").textContent).toBe("A message");
      expect(detailed.querySelector(".lint-message-metadata").textContent).toBe(
        " (details)",
      );
    });
  });
});
