import { vi, beforeEach, afterEach } from "vitest";

// Mock monaco editor
vi.mock("monaco-editor/esm/vs/editor/editor.api", () => ({
  editor: {
    create: vi.fn(() => ({
      getValue: vi.fn(() => "mocked sql"),
      setValue: vi.fn(),
      dispose: vi.fn(),
    })),
    setTheme: vi.fn(),
  },
}));

window.matchMedia = vi.fn();

vi.mock(
  "monaco-editor/esm/vs/basic-languages/sql/sql.contribution",
  () => ({}),
);

// Mock toml parser
vi.mock("toml", () => ({
  default: { parse: vi.fn() },
}));

// Global fetch
globalThis.fetch = vi.fn();

// Single source of truth for window.config in tests, mirroring
// public/config.js so tests exercise the same values production actually
// serves. Keep this in sync with public/config.js by hand - it is not
// imported from there because that file assigns directly to `window` as a
// plain script, not a module. Tests needing a different value for one case
// should override just that key rather than replacing window.config
// wholesale, so the rest of the shared fixture stays intact.
const DEFAULT_CONFIG = Object.freeze({
  API_BASE_URL: "/api/v1",
  PGRUBIC_REPOSITORY_URL: "https://github.com/bolajiwahab/pgrubic",
  PGRUBIC_DOCUMENTATION_URL: "https://pgrubic.azellar.com",
});

// Assigned once up front too (not just in beforeEach) so that
// describe()-level code, which runs at collection time before any
// beforeEach, can still read window.config.
window.config = { ...DEFAULT_CONFIG };

beforeEach(() => {
  window.config = { ...DEFAULT_CONFIG };
  fetch.mockReset();
  vi.resetAllMocks();
  window.matchMedia.mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
