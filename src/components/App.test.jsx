import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";

const { mockSessionExists } = vi.hoisted(() => ({
  mockSessionExists: vi.fn(),
}));

vi.mock("../app/Session", () => ({
  default: {
    exists: mockSessionExists,
    username: () => null,
    token: () => null,
  },
}));

vi.mock("./AppProviders", () => ({
  default: ({ children }) => children,
}));

vi.mock("./Login", () => ({
  default: () => <div>login-screen</div>,
}));

vi.mock("./hooks", () => ({
  useBackgroundProcesses: vi.fn(),
  useConnectionListeners: vi.fn(),
  useWebPushTopics: () => [],
}));

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: () => [],
}));

vi.mock("../app/UserManager", () => ({
  default: { all: vi.fn() },
}));

vi.mock("../app/SubscriptionManager", () => ({
  default: { all: vi.fn() },
}));

vi.mock("./Feed", () => ({ default: () => null }));
vi.mock("./Sidebar", () => ({
  default: () => null,
  SidebarContent: () => null,
}));
vi.mock("./AppBar", () => ({ default: () => null }));
vi.mock("./BottomNav", () => ({ default: () => null }));
vi.mock("./DetailPane", () => ({ default: () => null }));
vi.mock("./Messaging", () => ({ default: () => null }));
vi.mock("./SettingsPage", () => ({ default: () => null }));
vi.mock("./ErrorBoundary", () => ({ default: ({ children }) => children }));
vi.mock("./ui/Sheet", () => ({
  Sheet: ({ children }) => children,
  SheetContent: ({ children }) => children,
}));

window.matchMedia = vi.fn(() => ({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));

const { default: App } = await import("./App.jsx");

let container;
let root;

const renderApp = async (path) => {
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    );
  });
};

beforeEach(() => {
  globalThis.config.require_login = true;
  mockSessionExists.mockReturnValue(false);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  globalThis.config.require_login = false;
});

describe("App conditional login routing", () => {
  it("redirects an unauthenticated protected route to login", async () => {
    await renderApp("/");
    expect(container.textContent).toContain("login-screen");
  });

  it("renders the login route when login is required", async () => {
    await renderApp("/login");
    expect(container.textContent).toContain("login-screen");
  });
});
