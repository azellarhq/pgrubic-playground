// Theme selector

import { readStoredValue, writeStoredValue } from "./storage";

const THEME_STORAGE_KEY = "pgrubic.theme";
const THEMES = ["auto", "light", "dark"];

let removeThemeListeners;

/**
 * Resolves the effective theme based on the user's preference and system settings.
 *
 * @param {string} theme - The user's selected theme ("auto", "light", or "dark").
 * @param {boolean} systemPrefersDark - Whether the system prefers a dark color scheme.
 * @returns {string} - The resolved theme ("light" or "dark").
 */
function resolveTheme(theme, systemPrefersDark) {
  return theme === "auto" ? (systemPrefersDark ? "dark" : "light") : theme;
}

/*
 * Sets up the theme selector functionality, allowing users to switch between themes.
 * @param {Object} params - The parameters for the theme selector setup.
 * @param {Function} params.setEditorTheme - A function to set the theme of the editor.
 */
function setupThemeSelector({ setEditorTheme }) {
  removeThemeListeners?.();

  const selector = document.getElementById("themeSelector");
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const storedTheme = readStoredValue(THEME_STORAGE_KEY);
  const theme = THEMES.includes(storedTheme) ? storedTheme : "auto";

  const applyTheme = () => {
    const themeIndex = THEMES.indexOf(selector.dataset.theme);
    const nextTheme = THEMES[(themeIndex + 1) % THEMES.length];
    const resolvedTheme = resolveTheme(
      selector.dataset.theme,
      mediaQuery.matches,
    );
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
    selector.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
    selector.title = `Switch to ${nextTheme} mode`;
    setEditorTheme(resolvedTheme);
  };
  const handleSystemThemeChange = () => {
    if (selector.dataset.theme === "auto") {
      applyTheme();
    }
  };
  const handleThemeChange = () => {
    const themeIndex = THEMES.indexOf(selector.dataset.theme);
    selector.dataset.theme = THEMES[(themeIndex + 1) % THEMES.length];
    writeStoredValue(THEME_STORAGE_KEY, selector.dataset.theme);
    applyTheme();
  };

  selector.dataset.theme = theme;
  applyTheme();
  selector.addEventListener("click", handleThemeChange);
  mediaQuery.addEventListener("change", handleSystemThemeChange);
  removeThemeListeners = () => {
    selector.removeEventListener("click", handleThemeChange);
    mediaQuery.removeEventListener("change", handleSystemThemeChange);
  };
}

export { setupThemeSelector, resolveTheme };
