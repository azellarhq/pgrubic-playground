// Utils
import { setTheme } from "./editors.js";
/**
 * Creates a notification element with the specified message and type,
 * adds it to the document body, and removes it after the specified timeout.
 *
 * @param {string} message - The message to display in the notification.
 * @param {string} type - The type of notification (e.g., 'error', 'success', etc.).
 * @param {number} [timeout=1000] - The time in milliseconds after which the notification is removed.
 */
function notify(message, type, timeout = 3000) {
  const n = document.createElement("div");
  n.className = `notification ${type}`;
  n.textContent = message;
  document.body.appendChild(n);

  setTimeout(() => {
    n.remove();
  }, timeout);
}
function ThemeToggle() {
  if (typeof document === 'undefined') return;
  
  const toggleBtn = document.querySelector('.theme-toggle');
  const systemDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : {matches: false};
  let currentMode = (localStorage && localStorage.getItem('themeMode')) || 'system';

  function getNextMode(mode) {
    if (mode === 'light') return 'dark';
    if (mode === 'dark') return 'system';
    return 'light';
  }

  function applyTheme(mode, save = true) {
    const isDark = mode === 'system' ? systemDark.matches : mode === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    toggleBtn.title = `Switch to ${getNextMode(mode)} mode`;
    toggleBtn.className = `theme-toggle ${mode}`;
    if (typeof setTheme === 'function') setTheme(isDark);
    
    currentMode = mode;
    if (save && localStorage) localStorage.setItem('themeMode', mode);
  }

  if (systemDark.addEventListener) {
    systemDark.addEventListener('change', () => {
      if (currentMode === 'system') applyTheme('system', false);
    });
  }

  toggleBtn.addEventListener('click', () => {
    applyTheme(currentMode === 'light' ? 'dark' : currentMode === 'dark' ? 'system' : 'light');
  });
  
  applyTheme(currentMode, false);
}
/** 
function ThemeToggle() {
  if (typeof document === 'undefined') return;
  
  const toggleBtn = document.querySelector('.theme-toggle');
  const systemDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : {matches: false};
  let currentMode = (localStorage && localStorage.getItem('themeMode')) || 'system';

  function getNextMode(mode) {
    if (mode === 'light') return 'dark';
    if (mode === 'dark') return 'system';
    return 'light';
  }

  function applyTheme(mode, save = true) {
    const isDark = mode === 'system' ? systemDark.matches : mode === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    toggleBtn.title = `Switch to ${getNextMode(mode)} mode`;
    toggleBtn.className = `theme-toggle ${mode}`; // Update button class

    setTheme(isDark); // updates both editors

    currentMode = mode;
    if (save) {
      localStorage.setItem('themeMode', mode);
    }
  }
  systemDark.addEventListener('change', () => {
    if (currentMode === 'system') applyTheme('system', false);
  });

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      applyTheme(getNextMode(currentMode));
    });
  }
  applyTheme(currentMode, false);
}
*/

/**
 * Copies the content of the element with the given id to the user's clipboard.
 *
 * @param {string} id The id of the element to copy.
 */
async function copyToClipboard(id) {
  const element = document.getElementById(id);

  await navigator.clipboard.writeText(element.textContent);
}

/**
 * Converts the given violations array into an HTML string, with each violation
 * represented as a line with the description, rule code, line number, and column
 * offset. The output is suitable for use in a preformatted element.
 *
 * @param {Array.<Object>} violations - The violations to print, where each violation
 *   is an object with the properties 'description', 'rule_code', 'line_number',
 *   and 'column_offset'.
 * @returns {string} - The violations in HTML format.
 */
function printViolations(violations) {
  var html = "";

  violations.forEach((v) => {
    html += `<span><b>${v.description} </b>(${v.rule_code}) [Ln ${v.line_number}, Col ${v.column_offset}] <hr></span>`;
  });

  return html;
}

/**
 * Converts the given errors array into an HTML string, with each error
 * represented as a line with the message and hint. The output is suitable
 * for use in a preformatted element.
 *
 * @param {Array.<Object>} errors - The errors to print, where each error is an
 *   object with the properties 'message' and 'hint'.
 * @returns {string} - The errors in HTML format.
 */
function printErrors(errors) {
  var html = "";
  errors.forEach((e) => {
    html += `<span><b>${e.message} </b>(${e.hint}) <hr></span>`;
  });
  return html;
}

export { notify, ThemeToggle, copyToClipboard, printViolations, printErrors };
