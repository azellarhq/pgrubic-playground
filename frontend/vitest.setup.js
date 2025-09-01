import { vi, beforeEach } from "vitest";

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

beforeEach(() => {
  fetch.mockReset();
  vi.restoreAllMocks();
});
describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
    }));
    
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'system'),
      setItem: vi.fn(),
    });
  });
});
