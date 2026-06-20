import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

const mockSave = vi.fn().mockResolvedValue(undefined);
const mockGet = vi.fn();

vi.mock("../app/UserManager", () => ({
  default: { get: mockGet, save: mockSave },
}));

// Mock useLiveQuery to synchronously call the query function
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (fn) => fn(),
}));

// Mock Tabs to avoid Radix UI complexity in DOM tests
vi.mock("@/components/ui/Tabs", () => ({
  TabsRoot: ({ children, value, onValueChange }) => (
    <div data-tabs-root data-value={value}>{children}</div>
  ),
  TabsList: ({ children }) => <div role="tablist">{children}</div>,
  TabsTrigger: ({ children, value, ...props }) => (
    <button role="tab" data-value={value} {...props}>{children}</button>
  ),
  TabsContent: ({ children, value }) => <div data-tab-content={value}>{children}</div>,
}));

vi.mock("@/components/ui/Button", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

const { default: ServerAuthForm } = await import("./ServerAuthForm.jsx");

let container;
let root;

beforeEach(() => {
  mockSave.mockClear();
  mockGet.mockClear();
  mockGet.mockReturnValue(null);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function renderForm() {
  act(() => {
    root.render(<ServerAuthForm />);
  });
  return container;
}

describe("ServerAuthForm — token auth (default)", () => {
  it("renders without crashing", () => {
    renderForm();
    expect(container.querySelector("form")).toBeTruthy();
  });

  it("renders save button with i18n key", () => {
    renderForm();
    const btn = container.querySelector("button[type='submit']");
    expect(btn).toBeTruthy();
    expect(btn.textContent).toBe("server_auth_form_save_button");
  });

  it("calls userManager.save with token shape when submitted with token auth active", async () => {
    renderForm();

    const usernameInput = container.querySelector("input[autocomplete='username']");
    const tokenInput = container.querySelector("input[autocomplete='current-password']");

    act(() => {
      usernameInput.value = "jay";
      usernameInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    act(() => {
      // Simulate onChange via React synthetic event
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeInputValueSetter.call(usernameInput, "jay");
      usernameInput.dispatchEvent(new Event("input", { bubbles: true }));
      nativeInputValueSetter.call(tokenInput, "tk_abc");
      tokenInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    await act(async () => {
      container.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true }));
    });

    expect(mockSave).toHaveBeenCalled();
    const callArg = mockSave.mock.calls[0][0];
    expect(callArg).toHaveProperty("baseUrl");
    expect(callArg).not.toHaveProperty("password");
  });

  it("shows server_auth_form_save_error when userManager.save rejects", async () => {
    mockSave.mockRejectedValueOnce(new Error("fail"));
    renderForm();

    await act(async () => {
      container.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true }));
    });

    expect(container.textContent).toContain("server_auth_form_save_error");
  });
});

describe("ServerAuthForm — pre-fill from userManager.get()", () => {
  it("pre-fills username when existingUser is returned", () => {
    mockGet.mockReturnValue({ baseUrl: "http://localhost", username: "jay", token: "tk_existing" });
    renderForm();
    const inputs = container.querySelectorAll("input");
    const usernameInput = Array.from(inputs).find((i) => i.getAttribute("autocomplete") === "username");
    expect(usernameInput.value).toBe("jay");
  });

  it("pre-fills credential when existingUser has a token", () => {
    mockGet.mockReturnValue({ baseUrl: "http://localhost", username: "jay", token: "tk_existing" });
    renderForm();
    const inputs = container.querySelectorAll("input");
    const credInput = Array.from(inputs).find((i) => i.getAttribute("autocomplete") === "current-password");
    expect(credInput.value).toBe("tk_existing");
  });

  it("renders empty fields when no existing user", () => {
    mockGet.mockReturnValue(null);
    renderForm();
    const inputs = container.querySelectorAll("input");
    inputs.forEach((input) => expect(input.value).toBe(""));
  });
});

describe("ServerAuthForm — no hardcoded user-facing strings in JSX", () => {
  it("renders no Korean or English hardcoded copy directly", () => {
    renderForm();
    // All text is from i18n keys (which the mock returns as-is)
    expect(container.innerHTML).not.toContain("Server URL");
    expect(container.innerHTML).not.toContain("Access token");
    expect(container.innerHTML).not.toContain("Save settings");
  });
});
