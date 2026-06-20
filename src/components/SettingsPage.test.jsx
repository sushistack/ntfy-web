import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { NotificationPermissionRow } from "./SettingsPage.jsx";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k) => k }),
}));

// useNotificationPermissionListener just calls the query synchronously in tests
vi.mock("./hooks", () => ({
  useNotificationPermissionListener: (query) => query(),
}));

const notifierMock = vi.hoisted(() => ({
  browserSupported: vi.fn(),
  contextSupported: vi.fn(),
  supported: vi.fn(),
  notRequested: vi.fn(),
  granted: vi.fn(),
  denied: vi.fn(),
  iosSupportedButInstallRequired: vi.fn(),
  maybeRequestPermission: vi.fn().mockResolvedValue(true),
}));

vi.mock("../app/Notifier", () => ({ default: notifierMock }));

function allFalse() {
  notifierMock.iosSupportedButInstallRequired.mockReturnValue(false);
  notifierMock.browserSupported.mockReturnValue(true);
  notifierMock.contextSupported.mockReturnValue(true);
  notifierMock.notRequested.mockReturnValue(false);
  notifierMock.granted.mockReturnValue(false);
  notifierMock.denied.mockReturnValue(false);
}

let container;
let root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  vi.clearAllMocks();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function renderRow() {
  act(() => {
    root.render(<NotificationPermissionRow t={(k) => k} />);
  });
  return container;
}

describe("NotificationPermissionRow", () => {
  it("shows Grant permission button and description when permission not yet requested", () => {
    allFalse();
    notifierMock.notRequested.mockReturnValue(true);
    const el = renderRow();
    const btn = el.querySelector("button");
    expect(btn).toBeTruthy();
    expect(btn.textContent).toBe("prefs_notifications_permission_grant_button");
    expect(el.textContent).toContain("prefs_notifications_permission_not_requested_description");
  });

  it("calls maybeRequestPermission exactly once when Grant button is clicked", () => {
    allFalse();
    notifierMock.notRequested.mockReturnValue(true);
    renderRow();
    act(() => {
      container.querySelector("button").click();
    });
    expect(notifierMock.maybeRequestPermission).toHaveBeenCalledTimes(1);
  });

  it("shows Active indicator when permission is granted", () => {
    allFalse();
    notifierMock.granted.mockReturnValue(true);
    const el = renderRow();
    expect(el.textContent).toContain("prefs_notifications_permission_granted");
    expect(el.querySelector("button")).toBeNull();
  });

  it("shows blocked/re-enable message when permission is denied", () => {
    allFalse();
    notifierMock.denied.mockReturnValue(true);
    const el = renderRow();
    expect(el.textContent).toContain("prefs_notifications_permission_denied");
    expect(el.querySelector("button")).toBeNull();
  });

  it("shows not-supported message when browser does not support Notification API", () => {
    allFalse();
    notifierMock.browserSupported.mockReturnValue(false);
    const el = renderRow();
    expect(el.textContent).toContain("prefs_notifications_permission_not_supported");
    expect(el.querySelector("button")).toBeNull();
  });

  it("shows HTTPS warning when context is not secure", () => {
    allFalse();
    notifierMock.contextSupported.mockReturnValue(false);
    const el = renderRow();
    expect(el.textContent).toContain("prefs_notifications_permission_context_not_supported");
    expect(el.querySelector("button")).toBeNull();
  });

  it("shows iOS install message when iOS install is required", () => {
    allFalse();
    notifierMock.iosSupportedButInstallRequired.mockReturnValue(true);
    const el = renderRow();
    expect(el.textContent).toContain("prefs_notifications_permission_ios_install_required");
    expect(el.querySelector("button")).toBeNull();
  });
});
