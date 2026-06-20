import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";

import CardOverflowMenu from "./CardOverflowMenu";

// vi.hoisted ensures these refs are available inside the hoisted vi.mock factories
const mockMarkRead = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn());
const mockCopy = vi.hoisted(() => vi.fn());

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k) => k }),
}));

// Mock Menu — always renders content so items are accessible without clicking the trigger
vi.mock("@/components/ui/Menu", () => ({
  Menu: ({ children }) => <div>{children}</div>,
  MenuTrigger: ({ children, asChild }) => (asChild ? children : <div>{children}</div>),
  MenuContent: ({ children }) => <div data-testid="menu-content">{children}</div>,
  MenuItem: ({ children, onSelect, className }) => (
    <button
      role="menuitem"
      className={className}
      onClick={(e) => onSelect?.(e)}
    >
      {children}
    </button>
  ),
  MenuSeparator: () => null,
}));

// Mock Dialog — renders children only when open
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

// Mock Button
vi.mock("@/components/ui/Button", () => ({
  default: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
}));

vi.mock("@/app/SubscriptionManager", () => ({
  default: { markNotificationRead: mockMarkRead, deleteNotification: mockDelete },
}));

vi.mock("@/app/utils", () => ({ copyToClipboard: mockCopy }));
vi.mock("@/app/notificationUtils", () => ({ formatMessage: (n) => n.message }));

const unreadNotification = { id: "abc123", new: 1, message: "Hello" };
const readNotification = { id: "abc123", new: 0, message: "Hello" };

let container;
let root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  mockMarkRead.mockClear();
  mockDelete.mockClear();
  mockCopy.mockClear();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(ui) {
  act(() => root.render(ui));
  return container;
}

describe("CardOverflowMenu — trigger button", () => {
  it("renders trigger button with correct aria-label key", () => {
    render(<CardOverflowMenu notification={unreadNotification} />);
    const trigger = container.querySelector('[aria-label="card_overflow_trigger_label"]');
    expect(trigger).toBeTruthy();
    expect(trigger.tagName).toBe("BUTTON");
  });
});

describe("CardOverflowMenu — 읽음 표시 item", () => {
  it("shows mark-read item when notification.new === 1", () => {
    render(<CardOverflowMenu notification={unreadNotification} />);
    const items = Array.from(container.querySelectorAll('[role="menuitem"]'));
    const markRead = items.find((el) => el.textContent === "card_overflow_mark_read");
    expect(markRead).toBeTruthy();
  });

  it("does NOT show mark-read item when notification.new === 0", () => {
    render(<CardOverflowMenu notification={readNotification} />);
    const items = Array.from(container.querySelectorAll('[role="menuitem"]'));
    const markRead = items.find((el) => el.textContent === "card_overflow_mark_read");
    expect(markRead).toBeUndefined();
  });

  it("calls markNotificationRead with notification.id when clicked", () => {
    render(<CardOverflowMenu notification={unreadNotification} />);
    const items = Array.from(container.querySelectorAll('[role="menuitem"]'));
    const markRead = items.find((el) => el.textContent === "card_overflow_mark_read");
    act(() => markRead.click());
    expect(mockMarkRead).toHaveBeenCalledOnce();
    expect(mockMarkRead).toHaveBeenCalledWith("abc123");
  });
});

describe("CardOverflowMenu — 복사 item", () => {
  it("shows copy item regardless of read state", () => {
    render(<CardOverflowMenu notification={readNotification} />);
    const items = Array.from(container.querySelectorAll('[role="menuitem"]'));
    const copy = items.find((el) => el.textContent === "card_overflow_copy");
    expect(copy).toBeTruthy();
  });

  it("calls copyToClipboard with formatMessage result when clicked", () => {
    render(<CardOverflowMenu notification={unreadNotification} />);
    const items = Array.from(container.querySelectorAll('[role="menuitem"]'));
    const copy = items.find((el) => el.textContent === "card_overflow_copy");
    act(() => copy.click());
    expect(mockCopy).toHaveBeenCalledOnce();
    expect(mockCopy).toHaveBeenCalledWith("Hello");
  });
});

describe("CardOverflowMenu — 삭제 item", () => {
  it("shows delete item regardless of read state", () => {
    render(<CardOverflowMenu notification={readNotification} />);
    const items = Array.from(container.querySelectorAll('[role="menuitem"]'));
    const del = items.find((el) => el.textContent === "card_overflow_delete");
    expect(del).toBeTruthy();
  });

  it("opens confirm dialog when 삭제 is selected — does NOT immediately call deleteNotification", () => {
    render(<CardOverflowMenu notification={unreadNotification} />);
    const items = Array.from(container.querySelectorAll('[role="menuitem"]'));
    const del = items.find((el) => el.textContent === "card_overflow_delete");
    act(() => del.click());
    expect(document.body.querySelector('[role="dialog"]')).toBeTruthy();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("confirm dialog shows the confirm body key", () => {
    render(<CardOverflowMenu notification={unreadNotification} />);
    const items = Array.from(container.querySelectorAll('[role="menuitem"]'));
    const del = items.find((el) => el.textContent === "card_overflow_delete");
    act(() => del.click());
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog.textContent).toContain("card_overflow_delete_confirm_body");
  });

  it("calls deleteNotification when confirm button is clicked", () => {
    render(<CardOverflowMenu notification={unreadNotification} />);
    // Open dialog
    const items = Array.from(container.querySelectorAll('[role="menuitem"]'));
    const del = items.find((el) => el.textContent === "card_overflow_delete");
    act(() => del.click());
    // Click confirm
    const dialog = document.body.querySelector('[role="dialog"]');
    const confirmBtn = Array.from(dialog.querySelectorAll("button")).find(
      (b) => b.textContent === "card_overflow_delete_confirm_action"
    );
    act(() => confirmBtn.click());
    expect(mockDelete).toHaveBeenCalledOnce();
    expect(mockDelete).toHaveBeenCalledWith("abc123");
  });

  it("does NOT call deleteNotification when cancel is clicked", () => {
    render(<CardOverflowMenu notification={unreadNotification} />);
    // Open dialog
    const items = Array.from(container.querySelectorAll('[role="menuitem"]'));
    const del = items.find((el) => el.textContent === "card_overflow_delete");
    act(() => del.click());
    // Click cancel
    const dialog = document.body.querySelector('[role="dialog"]');
    const cancelBtn = Array.from(dialog.querySelectorAll("button")).find(
      (b) => b.textContent === "card_overflow_delete_confirm_cancel"
    );
    act(() => cancelBtn.click());
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("closes dialog after cancel without calling delete", () => {
    render(<CardOverflowMenu notification={unreadNotification} />);
    const items = Array.from(container.querySelectorAll('[role="menuitem"]'));
    const del = items.find((el) => el.textContent === "card_overflow_delete");
    act(() => del.click());
    expect(document.body.querySelector('[role="dialog"]')).toBeTruthy();
    const dialog = document.body.querySelector('[role="dialog"]');
    const cancelBtn = Array.from(dialog.querySelectorAll("button")).find(
      (b) => b.textContent === "card_overflow_delete_confirm_cancel"
    );
    act(() => cancelBtn.click());
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  });

  it("closes dialog after confirm", () => {
    render(<CardOverflowMenu notification={unreadNotification} />);
    const items = Array.from(container.querySelectorAll('[role="menuitem"]'));
    const del = items.find((el) => el.textContent === "card_overflow_delete");
    act(() => del.click());
    const dialog = document.body.querySelector('[role="dialog"]');
    const confirmBtn = Array.from(dialog.querySelectorAll("button")).find(
      (b) => b.textContent === "card_overflow_delete_confirm_action"
    );
    act(() => confirmBtn.click());
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  });
});

describe("CardOverflowMenu — no hardcoded Korean", () => {
  it("renders no hardcoded Korean strings (all copy through t())", () => {
    render(<CardOverflowMenu notification={unreadNotification} />);
    // With identity mock t(k)=k, Korean would only appear if hardcoded
    expect(container.innerHTML).not.toMatch(/읽음|복사|삭제|취소/);
  });
});
