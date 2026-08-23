import { vi, beforeEach, afterEach } from "vitest";

// Mock monaco editor
vi.mock("monaco-editor/esm/vs/editor/editor.api", () => ({
  editor: {
    create: vi.fn(() => ({
      getValue: vi.fn(() => "mocked sql"),
      dispose: vi.fn(),
    })),
  },
}));

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
window.config = {
  API_BASE_URL: "/api/v1",
  PGRUBIC_REPOSITORY_URL: "https://github.com/bolajiwahab/pgrubic",
  PGRUBIC_DOCUMENTATION_URL: "https://pgrubic.azellar.com",
};

beforeEach(() => {
  fetch.mockReset();
  vi.resetAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
