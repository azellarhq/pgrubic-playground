// Utils

/**
 * Creates a notification element with the specified message and type,
 * adds it to the document body, and removes it after the specified timeout.
 *
 * @param {string} message - The message to display in the notification.
 * @param {string} type - The type of notification (e.g., 'error', 'success', etc.).
 * @param {number} [timeout] - The time in milliseconds before removal. Errors remain longer by default.
 */
function notify(message, type, timeout = type === "error" ? 6000 : 3000) {
  let container = document.getElementById("notifications");

  if (!container) {
    container = document.createElement("div");
    container.id = "notifications";
    container.className = "notifications";
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }

  const n = document.createElement("div");
  n.className = `notification ${type}`;
  n.setAttribute("role", type === "error" ? "alert" : "status");

  const text = document.createElement("span");
  text.textContent = message;

  const dismiss = document.createElement("button");
  dismiss.type = "button";
  dismiss.className = "notification-dismiss";
  dismiss.setAttribute("aria-label", "Dismiss notification");
  dismiss.textContent = "×";
  dismiss.addEventListener("click", () => n.remove());

  n.append(text, dismiss);
  container.appendChild(n);

  setTimeout(() => {
    n.remove();
  }, timeout);
}

/**
 * Copies text to the user's clipboard.
 *
 * @param {string} value The text to copy.
 */
async function copyToClipboard(value) {
  await navigator.clipboard.writeText(value);
}

/**
 * Render violations as safely constructed, readable output rows.
 *
 * @param {Array.<Object>} violations - The violations to print, where each violation
 *   is an object with the properties 'description', 'rule_code', 'line_number',
 *   and 'column_offset'.
 * @returns {DocumentFragment} - The rendered violations.
 */
function printViolations(violations) {
  const output = document.createDocumentFragment();

  violations.forEach((violation) => {
    output.appendChild(
      createOutputRow(
        violation.description,
        `(${violation.rule_code}) [Ln ${violation.line_number}, Col ${violation.column_offset}]`,
      ),
    );
  });

  return output;
}

/**
 * Render errors as safely constructed, readable output rows.
 *
 * @param {Array.<Object>} errors - The errors to print, where each error is an
 *   object with the properties 'message' and 'hint'.
 * @returns {DocumentFragment} - The rendered errors.
 */
function printErrors(errors) {
  const output = document.createDocumentFragment();

  errors.forEach((error) => {
    output.appendChild(createOutputRow(error.message, `(${error.hint})`));
  });

  return output;
}

function createOutputRow(message, details = "") {
  const row = document.createElement("div");
  row.className = "lint-message";

  const description = document.createElement("strong");
  description.textContent = message;
  row.appendChild(description);

  if (details) {
    const metadata = document.createElement("span");
    metadata.className = "lint-message-metadata";
    metadata.textContent = ` ${details}`;
    row.appendChild(metadata);
  }

  return row;
}

function printOutputLines(value) {
  const output = document.createDocumentFragment();

  for (const line of (value ?? "").split("\n").filter(Boolean)) {
    const detailsStart = line.lastIndexOf(" (");
    const message = detailsStart === -1 ? line : line.slice(0, detailsStart);
    const details = detailsStart === -1 ? "" : line.slice(detailsStart + 1);
    output.appendChild(createOutputRow(message, details));
  }

  return output;
}

export {
  notify,
  copyToClipboard,
  printViolations,
  printErrors,
  printOutputLines,
};
