import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

const mockSetChoice = vi.fn();
let mockChoice = "system";

vi.mock("@/components/contexts/ThemeContext", () => ({
  useTheme: () => ({ choice: mockChoice, setChoice: mockSetChoice }),
  THEME: { DARK: "dark", LIGHT: "light", SYSTEM: "system" },
}));

vi.mock("@/app/Prefs", () => ({
  THEME: { DARK: "dark", LIGHT: "light", SYSTEM: "system" },
}));

const { ThemeToggle } = await import("./ThemeToggle.jsx");

let container;
let root;

beforeEach(() => {
  mockChoice = "system";
  mockSetChoice.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render() {
  act(() => root.render(<ThemeToggle />));
  return container;
}

describe("ThemeToggle", () => {
  it("renders a group with 3 buttons", () => {
    const el = render();
    const buttons = el.querySelectorAll("button");
    expect(buttons).toHaveLength(3);
  });

  it("marks system button as pressed when choice=system", () => {
    render();
    const buttons = container.querySelectorAll("button");
    const systemBtn = Array.from(buttons).find((b) => b.getAttribute("aria-checked") === "true");
    expect(systemBtn).toBeTruthy();
    expect(systemBtn.textContent).toBe("theme_system");
  });

  it("clicking dark calls setChoice('dark')", () => {
    render();
    const buttons = container.querySelectorAll("button");
    const darkBtn = Array.from(buttons).find((b) => b.textContent === "theme_dark");
    act(() => darkBtn.click());
    expect(mockSetChoice).toHaveBeenCalledWith("dark");
  });

  it("clicking light calls setChoice('light')", () => {
    render();
    const buttons = container.querySelectorAll("button");
    const lightBtn = Array.from(buttons).find((b) => b.textContent === "theme_light");
    act(() => lightBtn.click());
    expect(mockSetChoice).toHaveBeenCalledWith("light");
  });

  it("clicking system calls setChoice('system')", () => {
    render();
    const buttons = container.querySelectorAll("button");
    const sysBtn = Array.from(buttons).find((b) => b.textContent === "theme_system");
    act(() => sysBtn.click());
    expect(mockSetChoice).toHaveBeenCalledWith("system");
  });

  it("has role=group on the container element", () => {
    render();
    const group = container.querySelector("[role='radiogroup']");
    expect(group).toBeTruthy();
    expect(group.getAttribute("aria-label")).toBe("theme_toggle_label");
  });
});
