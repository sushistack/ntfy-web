import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

const mockLogin = vi.fn();
const mockStore = vi.fn();
const mockUnauthorizedError = class UnauthorizedError extends Error {
  constructor(msg) { super(msg); this.name = "UnauthorizedError"; }
};

vi.mock("../app/AccountApi", () => ({
  default: { login: mockLogin },
}));

vi.mock("../app/Session", () => ({
  default: { store: mockStore },
}));

vi.mock("./routes", () => ({
  default: { app: "/", login: "/login", settings: "/settings" },
}));

vi.mock("../app/errors", () => ({
  UnauthorizedError: mockUnauthorizedError,
}));

const { default: Login } = await import("./Login.jsx");

let container;
let root;

beforeEach(() => {
  mockLogin.mockClear();
  mockStore.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function renderLogin() {
  act(() => {
    root.render(<Login />);
  });
  return container;
}

describe("Login — require_login guard", () => {
  it("renders null when config.require_login is false", () => {
    globalThis.config.require_login = false;
    renderLogin();
    expect(container.firstChild).toBeNull();
  });

  it("renders the form when config.require_login is true", () => {
    globalThis.config.require_login = true;
    renderLogin();
    expect(container.querySelector("form")).toBeTruthy();
    globalThis.config.require_login = false;
  });
});

describe("Login — form structure", () => {
  beforeEach(() => { globalThis.config.require_login = true; });
  afterEach(() => { globalThis.config.require_login = false; });

  it("renders username and password inputs", () => {
    renderLogin();
    expect(container.querySelector("input[autocomplete='username']")).toBeTruthy();
    expect(container.querySelector("input[autocomplete='current-password']")).toBeTruthy();
  });

  it("renders password toggle button with aria-label", () => {
    renderLogin();
    const toggle = Array.from(container.querySelectorAll("button")).find(
      (b) => b.getAttribute("aria-label") === "signup_form_toggle_password_visibility"
    );
    expect(toggle).toBeTruthy();
  });

  it("renders submit button", () => {
    renderLogin();
    const btn = container.querySelector("button[type='submit']");
    expect(btn).toBeTruthy();
    expect(btn.textContent).toBe("login_form_button_submit");
  });

  it("submit button is disabled when username or password is empty", () => {
    renderLogin();
    const btn = container.querySelector("button[type='submit']");
    expect(btn.disabled).toBe(true);
  });
});

describe("Login — submit handler", () => {
  beforeEach(() => { globalThis.config.require_login = true; });
  afterEach(() => { globalThis.config.require_login = false; });

  it("calls accountApi.login and session.store on successful submit", async () => {
    mockLogin.mockResolvedValueOnce("token_xyz");
    mockStore.mockResolvedValueOnce(undefined);

    renderLogin();

    const usernameInput = container.querySelector("input[autocomplete='username']");
    const passwordInput = container.querySelector("input[autocomplete='current-password']");

    act(() => {
      const nativeSet = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeSet.call(usernameInput, "jay");
      usernameInput.dispatchEvent(new Event("input", { bubbles: true }));
      nativeSet.call(passwordInput, "secret");
      passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    await act(async () => {
      container.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true }));
    });

    expect(mockLogin).toHaveBeenCalledWith({ username: "jay", password: "secret" });
    expect(mockStore).toHaveBeenCalledWith("jay", "token_xyz");
  });

  it("shows login_error_invalid_credentials on UnauthorizedError", async () => {
    mockLogin.mockRejectedValueOnce(new mockUnauthorizedError("bad creds"));

    renderLogin();

    await act(async () => {
      container.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true }));
    });

    expect(container.textContent).toContain("login_error_invalid_credentials");
  });
});

describe("Login — no MUI imports", () => {
  it("uses no MUI class names in rendered output", () => {
    globalThis.config.require_login = true;
    renderLogin();
    // MUI injects classes like MuiButton-root; none should appear
    expect(container.innerHTML).not.toContain("Mui");
    globalThis.config.require_login = false;
  });
});
