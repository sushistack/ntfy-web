import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";

/* ── Hoisted mock refs ── */
const mockSetDisplayName = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockDeleteNotifications = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockRemove = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockFirst = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockAll = vi.hoisted(() => vi.fn());
const mockSetMutedUntil = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockNavigate = vi.hoisted(() => vi.fn());
const mockUseActiveTopic = vi.hoisted(() => vi.fn().mockReturnValue(null));

vi.mock("@/app/SubscriptionManager", () => ({
  default: {
    all: mockAll,
    setDisplayName: mockSetDisplayName,
    deleteNotifications: mockDeleteNotifications,
    remove: mockRemove,
    first: mockFirst,
    setMutedUntil: mockSetMutedUntil,
  },
}));

vi.mock("@/components/hooks", () => ({
  useActiveTopic: mockUseActiveTopic,
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
}));

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: vi.fn((fn) => fn()),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k) => k }),
}));

vi.mock("@/components/ThemeToggle", () => ({
  ThemeToggle: () => null,
}));

vi.mock("@/components/routes", () => ({
  default: {
    forSubscription: (sub) => `/${sub.topic}`,
    app: "/",
  },
}));

// Menu — always renders content so items are visible without trigger click
vi.mock("@/components/ui/Menu", () => ({
  Menu: ({ children }) => <div>{children}</div>,
  MenuTrigger: ({ children, asChild }) => (asChild ? children : <div>{children}</div>),
  MenuContent: ({ children }) => <div data-testid="menu-content">{children}</div>,
  MenuItem: ({ children, onSelect }) => (
    <button role="menuitem" onClick={(e) => onSelect?.(e)}>
      {children}
    </button>
  ),
  MenuSeparator: () => null,
}));

// Dialog — renders children only when open
vi.mock("@/components/ui/Dialog", () => ({
  Dialog: ({ children, open }) => (open ? <div role="dialog">{children}</div> : null),
  DialogContent: ({ children, title }) => (
    <div>
      <span data-testid="dialog-title">{title}</span>
      {children}
    </div>
  ),
  DialogClose: ({ children, asChild }) => (asChild ? children : <button>{children}</button>),
}));

vi.mock("@/components/ui/Button", () => ({
  Button: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
}));

import { SidebarContent } from "./Sidebar";

const subA = { id: 1, topic: "alerts", displayName: "My Alerts", new: 0, mutedUntil: 0, internal: false };
const subB = { id: 2, topic: "backups", displayName: null, new: 3, mutedUntil: 0, internal: false };

let container;
let root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  mockSetDisplayName.mockClear();
  mockDeleteNotifications.mockClear();
  mockRemove.mockClear();
  mockFirst.mockClear();
  mockNavigate.mockClear();
  mockUseActiveTopic.mockReturnValue(null);
  mockAll.mockReturnValue([subA]);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(ui) {
  act(() => root.render(ui));
  return container;
}

function menuItems() {
  return Array.from(container.querySelectorAll('[role="menuitem"]'));
}

function findMenuItem(text) {
  return menuItems().find((el) => el.textContent === text);
}

/* ── ⋯ trigger button ── */
describe("SidebarContent — ⋯ trigger button", () => {
  it("renders a ⋯ trigger button with the correct aria-label key", () => {
    render(<SidebarContent />);
    const trigger = container.querySelector('[aria-label="sub_menu_trigger_label"]');
    expect(trigger).toBeTruthy();
    expect(trigger.tagName).toBe("BUTTON");
  });

  it("menu content is accessible with the three action items", () => {
    render(<SidebarContent />);
    expect(findMenuItem("sub_menu_rename")).toBeTruthy();
    expect(findMenuItem("sub_menu_clear")).toBeTruthy();
    expect(findMenuItem("sub_menu_unsubscribe")).toBeTruthy();
  });
});

/* ── Rename ── */
describe("SidebarContent — 이름 바꾸기 (rename)", () => {
  it("opens rename dialog with displayName pre-filled when rename is selected", () => {
    render(<SidebarContent />);
    act(() => findMenuItem("sub_menu_rename").click());
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    const input = dialog.querySelector("input");
    expect(input).toBeTruthy();
    expect(input.value).toBe("My Alerts");
  });

  it("uses topic as pre-fill when displayName is null", () => {
    mockAll.mockReturnValue([subB]);
    render(<SidebarContent />);
    act(() => findMenuItem("sub_menu_rename").click());
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog.querySelector("input").value).toBe("backups");
  });

  it("calls setDisplayName with trimmed value and closes dialog on save", async () => {
    render(<SidebarContent />);
    act(() => findMenuItem("sub_menu_rename").click());
    const dialog = document.body.querySelector('[role="dialog"]');
    const input = dialog.querySelector("input");
    act(() => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeInputValueSetter.call(input, "  Renamed  ");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const saveBtn = Array.from(dialog.querySelectorAll("button")).find(
      (b) => b.textContent === "common_save"
    );
    await act(async () => saveBtn.click());
    expect(mockSetDisplayName).toHaveBeenCalledOnce();
    expect(mockSetDisplayName).toHaveBeenCalledWith(1, "Renamed");
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  });

  it("does not call setDisplayName when save is clicked with empty trimmed value", async () => {
    render(<SidebarContent />);
    act(() => findMenuItem("sub_menu_rename").click());
    const dialog = document.body.querySelector('[role="dialog"]');
    const input = dialog.querySelector("input");
    act(() => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeInputValueSetter.call(input, "   ");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const saveBtn = Array.from(dialog.querySelectorAll("button")).find(
      (b) => b.textContent === "common_save"
    );
    await act(async () => saveBtn.click());
    expect(mockSetDisplayName).not.toHaveBeenCalled();
  });
});

/* ── Clear notifications ── */
describe("SidebarContent — 알림 모두 삭제 (clear)", () => {
  it("opens clear confirm dialog when clear is selected", () => {
    render(<SidebarContent />);
    act(() => findMenuItem("sub_menu_clear").click());
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog.textContent).toContain("sub_clear_confirm_body");
  });

  it("calls deleteNotifications on confirm and closes dialog", async () => {
    render(<SidebarContent />);
    act(() => findMenuItem("sub_menu_clear").click());
    const dialog = document.body.querySelector('[role="dialog"]');
    const confirmBtn = Array.from(dialog.querySelectorAll("button")).find(
      (b) => b.textContent === "sub_clear_confirm_action"
    );
    await act(async () => confirmBtn.click());
    expect(mockDeleteNotifications).toHaveBeenCalledOnce();
    expect(mockDeleteNotifications).toHaveBeenCalledWith(1);
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  });

  it("does not call deleteNotifications when cancel is clicked", async () => {
    render(<SidebarContent />);
    act(() => findMenuItem("sub_menu_clear").click());
    const dialog = document.body.querySelector('[role="dialog"]');
    const cancelBtn = Array.from(dialog.querySelectorAll("button")).find(
      (b) => b.textContent === "common_cancel"
    );
    await act(async () => cancelBtn.click());
    expect(mockDeleteNotifications).not.toHaveBeenCalled();
  });
});

/* ── Unsubscribe ── */
describe("SidebarContent — 구독 해제 (unsubscribe)", () => {
  it("calls remove(subscription) when unsubscribe is selected", async () => {
    render(<SidebarContent />);
    await act(async () => findMenuItem("sub_menu_unsubscribe").click());
    expect(mockRemove).toHaveBeenCalledOnce();
    expect(mockRemove).toHaveBeenCalledWith(subA);
  });

  it("navigates to routes.app when unsubscribing the active topic and no next sub", async () => {
    mockUseActiveTopic.mockReturnValue("alerts");
    mockFirst.mockResolvedValue(null);
    render(<SidebarContent />);
    await act(async () => findMenuItem("sub_menu_unsubscribe").click());
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("navigates to next sub when unsubscribing active topic and a non-internal next sub exists", async () => {
    mockUseActiveTopic.mockReturnValue("alerts");
    mockAll.mockReturnValue([subA, { id: 99, topic: "news", internal: false }]);
    render(<SidebarContent />);
    await act(async () => findMenuItem("sub_menu_unsubscribe").click());
    expect(mockNavigate).toHaveBeenCalledWith("/news");
  });

  it("does NOT navigate when unsubscribing a non-active topic", async () => {
    mockUseActiveTopic.mockReturnValue("other-topic");
    render(<SidebarContent />);
    await act(async () => findMenuItem("sub_menu_unsubscribe").click());
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

/* ── Display name ── */
describe("SidebarContent — displayName display", () => {
  it("shows displayName instead of topic when set", () => {
    render(<SidebarContent />);
    const spans = Array.from(container.querySelectorAll("span"));
    const nameSpan = spans.find((s) => s.textContent === "My Alerts");
    expect(nameSpan).toBeTruthy();
    const topicSpan = spans.find((s) => s.textContent === "alerts");
    expect(topicSpan).toBeUndefined();
  });

  it("shows topic when displayName is null", () => {
    mockAll.mockReturnValue([subB]);
    render(<SidebarContent />);
    const spans = Array.from(container.querySelectorAll("span"));
    const topicSpan = spans.find((s) => s.textContent === "backups");
    expect(topicSpan).toBeTruthy();
  });
});

/* ── Active row ── */
describe("SidebarContent — active row highlight", () => {
  it("active topic row has bg-surface-2 class", () => {
    mockUseActiveTopic.mockReturnValue("alerts");
    render(<SidebarContent />);
    const rows = Array.from(container.querySelectorAll("div[class*='group']"));
    const activeRow = rows.find((el) => el.className.includes("bg-surface-2"));
    expect(activeRow).toBeTruthy();
  });

  it("non-active rows do not have bg-surface-2", () => {
    mockUseActiveTopic.mockReturnValue(null);
    render(<SidebarContent />);
    const rows = Array.from(container.querySelectorAll("div[class*='group']"));
    const anyActive = rows.some((el) => el.className.includes("bg-surface-2"));
    expect(anyActive).toBe(false);
  });
});

/* ── No hardcoded Korean ── */
describe("SidebarContent — no hardcoded strings", () => {
  it("renders no hardcoded Korean strings (all copy through t())", () => {
    render(<SidebarContent />);
    expect(container.innerHTML).not.toMatch(/이름 바꾸기|알림 모두 삭제|구독 해제|취소|저장/);
  });
});
