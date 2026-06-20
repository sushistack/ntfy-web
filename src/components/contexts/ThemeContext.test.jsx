import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";

// ── Mock prefs before ThemeContext import ──────────────────────────────────
let mockThemeValue = "system";
vi.mock("../../app/Prefs", () => ({
  default: {
    theme: vi.fn(() => Promise.resolve(mockThemeValue)),
    setTheme: vi.fn(() => Promise.resolve()),
  },
  THEME: { DARK: "dark", LIGHT: "light", SYSTEM: "system" },
}));

// ── Mock window.matchMedia ─────────────────────────────────────────────────
let mockMatchesDark = false;
let mediaChangeHandler = null;

beforeEach(() => {
  mockMatchesDark = false;
  mediaChangeHandler = null;
  mockThemeValue = "system";

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn((query) => ({
      matches: query === "(prefers-color-scheme: dark)" ? mockMatchesDark : false,
      addEventListener: vi.fn((_, handler) => { mediaChangeHandler = handler; }),
      removeEventListener: vi.fn(),
    })),
  });

  // Clean .dark class between tests
  document.documentElement.classList.remove("dark");
  localStorage.clear();
});

// Import after mocks are set up
const { ThemeProvider, useTheme } = await import("./ThemeContext.jsx");

let container;
let root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

// ── Helper to read context values from DOM ────────────────────────────────
function renderProvider(ui) {
  act(() => root.render(<ThemeProvider>{ui}</ThemeProvider>));
}

// ── Reducer tests (pure unit) ─────────────────────────────────────────────
describe("reducer", () => {
  it("handles load action", async () => {
    const { reducer } = await import("./ThemeContext.jsx");
    const next = reducer({ choice: "system", systemPrefersDark: false }, { type: "load", choice: "dark" });
    expect(next.choice).toBe("dark");
    expect(next.systemPrefersDark).toBe(false);
  });

  it("handles set action", async () => {
    const { reducer } = await import("./ThemeContext.jsx");
    const next = reducer({ choice: "system", systemPrefersDark: false }, { type: "set", choice: "light" });
    expect(next.choice).toBe("light");
  });

  it("handles system_change action", async () => {
    const { reducer } = await import("./ThemeContext.jsx");
    const next = reducer({ choice: "system", systemPrefersDark: false }, { type: "system_change", prefersDark: true });
    expect(next.systemPrefersDark).toBe(true);
    expect(next.choice).toBe("system");
  });
});

// ── ThemeProvider tests ───────────────────────────────────────────────────
describe("ThemeProvider", () => {
  it("renders children", () => {
    renderProvider(<span data-testid="child">hello</span>);
    expect(container.querySelector("[data-testid='child']")).toBeTruthy();
  });

  it("provides choice via context (default: system)", async () => {
    let capturedChoice;
    function Consumer() {
      const { choice } = useTheme();
      capturedChoice = choice;
      return null;
    }
    renderProvider(<Consumer />);
    // Wait for async prefs.theme() load effect
    await act(async () => await Promise.resolve());
    expect(capturedChoice).toBe("system");
  });

  it("applies no .dark class when choice=system and OS is light", async () => {
    mockMatchesDark = false;
    renderProvider(<span />);
    await act(async () => await Promise.resolve());
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("applies .dark class when choice=system and OS prefers dark", async () => {
    mockMatchesDark = true;
    renderProvider(<span />);
    await act(async () => await Promise.resolve());
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("mirrors choice to localStorage on mount", async () => {
    renderProvider(<span />);
    await act(async () => await Promise.resolve());
    expect(localStorage.getItem("theme")).toBe("system");
  });

  it("updates .dark class when system preference changes live", async () => {
    mockMatchesDark = false;
    renderProvider(<span />);
    await act(async () => await Promise.resolve());
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    // Simulate OS changing to dark
    await act(async () => {
      mediaChangeHandler?.({ matches: true });
      await Promise.resolve();
    });
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});

// ── useTheme() outside provider must throw ────────────────────────────────
describe("useTheme", () => {
  it("throws when called outside ThemeProvider", () => {
    function Broken() {
      useTheme();
      return null;
    }
    expect(() => {
      act(() => root.render(<Broken />));
    }).toThrow("useTheme() must be used inside <ThemeProvider>");
  });
});
