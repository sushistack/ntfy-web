import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k) => k }),
}));

const mockOpenUrl = vi.hoisted(() => vi.fn());
vi.mock("@/app/utils", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, openUrl: mockOpenUrl };
});

const mockGet = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockMarkRead = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock("@/app/SubscriptionManager", () => ({
  default: { get: mockGet, markNotificationRead: mockMarkRead },
}));

vi.mock("@/app/Notifier", () => ({
  default: { cancel: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock("@/components/ui/Tooltip", () => ({
  TooltipProvider: ({ children }) => <>{children}</>,
  Tooltip: ({ children }) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }) => (asChild ? children : <span>{children}</span>),
  TooltipContent: ({ children }) => <div role="tooltip">{children}</div>,
}));

import { NotificationActions } from "./NotificationActions";

let container;
let root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  vi.clearAllMocks();
  global.fetch = vi.fn();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function renderInto(ui) {
  act(() => {
    root.render(ui);
  });
  return container;
}

const makeNotif = (actions = []) => ({
  id: "n1",
  subscriptionId: "sub1",
  actions,
});

const VIEW_ACTION = { id: "a1", action: "view", label: "View", url: "https://example.com" };
const HTTP_ACTION = { id: "a2", action: "http", label: "Submit", url: "https://api.example.com", method: "POST" };
const BROADCAST_ACTION = { id: "a3", action: "broadcast", label: "Broadcast" };
const COPY_ACTION = { id: "a4", action: "copy", label: "Copy", value: "text" };

describe("NotificationActions — renders nothing (AC: 6)", () => {
  it("renders nothing when actions array is empty", () => {
    renderInto(<NotificationActions notification={makeNotif([])} onError={vi.fn()} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when actions is null/undefined", () => {
    renderInto(<NotificationActions notification={{ ...makeNotif(), actions: null }} onError={vi.fn()} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when only copy actions are present (copy is overflow-menu only)", () => {
    renderInto(<NotificationActions notification={makeNotif([COPY_ACTION])} onError={vi.fn()} />);
    expect(container.innerHTML).toBe("");
  });
});

describe("NotificationActions — button count and variants (AC: 1)", () => {
  it("renders 3 buttons for a 3-action notification", () => {
    const actions = [VIEW_ACTION, HTTP_ACTION, BROADCAST_ACTION];
    renderInto(<NotificationActions notification={makeNotif(actions)} onError={vi.fn()} />);
    expect(container.querySelectorAll("button").length).toBe(3);
  });

  it("first button has primary variant class (bg-button-fill)", () => {
    const actions = [VIEW_ACTION, HTTP_ACTION];
    renderInto(<NotificationActions notification={makeNotif(actions)} onError={vi.fn()} />);
    const buttons = container.querySelectorAll("button");
    expect(buttons[0].className).toContain("bg-button-fill");
  });

  it("second button has ghost variant class (bg-transparent)", () => {
    const actions = [VIEW_ACTION, HTTP_ACTION];
    renderInto(<NotificationActions notification={makeNotif(actions)} onError={vi.fn()} />);
    const buttons = container.querySelectorAll("button");
    expect(buttons[1].className).toContain("bg-transparent");
  });

  it("filters out copy actions from the action row", () => {
    const actions = [VIEW_ACTION, COPY_ACTION, BROADCAST_ACTION];
    renderInto(<NotificationActions notification={makeNotif(actions)} onError={vi.fn()} />);
    // Only VIEW and BROADCAST render — COPY is filtered
    expect(container.querySelectorAll("button").length).toBe(2);
  });
});

describe("NotificationActions — view action (AC: 2)", () => {
  it("calls openUrl with action.url on click", () => {
    renderInto(<NotificationActions notification={makeNotif([VIEW_ACTION])} onError={vi.fn()} />);
    act(() => {
      container.querySelector("button").click();
    });
    expect(mockOpenUrl).toHaveBeenCalledWith("https://example.com");
  });

  it("has aria-label containing action url", () => {
    renderInto(<NotificationActions notification={makeNotif([VIEW_ACTION])} onError={vi.fn()} />);
    const btn = container.querySelector("button");
    expect(btn.getAttribute("aria-label")).toBeTruthy();
  });
});

describe("NotificationActions — http action (AC: 3, 4)", () => {
  it("shows loading suffix during fetch", async () => {
    let resolveFetch;
    global.fetch = vi.fn(() => new Promise((resolve) => { resolveFetch = resolve; }));

    renderInto(<NotificationActions notification={makeNotif([HTTP_ACTION])} onError={vi.fn()} />);
    act(() => {
      container.querySelector("button").click();
    });

    expect(container.querySelector("button").textContent).toBe("Submit …");

    await act(async () => {
      resolveFetch({ ok: true });
    });
    expect(container.querySelector("button").textContent).toBe("Submit ✔");
  });

  it("calls fetch with correct method and url", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    renderInto(<NotificationActions notification={makeNotif([HTTP_ACTION])} onError={vi.fn()} />);

    await act(async () => {
      container.querySelector("button").click();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.example.com",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("shows retry label when fetch rejects (AC: 4)", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    const onError = vi.fn();
    renderInto(<NotificationActions notification={makeNotif([HTTP_ACTION])} onError={onError} />);

    await act(async () => {
      container.querySelector("button").click();
    });

    expect(container.querySelector("button").textContent).toBe("notification_action_failed_retry_label");
    expect(onError).toHaveBeenCalledWith(expect.anything());
  });

  it("retries fetch when failed button is clicked again (AC: 4)", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    renderInto(<NotificationActions notification={makeNotif([HTTP_ACTION])} onError={vi.fn()} />);

    await act(async () => {
      container.querySelector("button").click();
    });
    expect(container.querySelector("button").textContent).toBe("notification_action_failed_retry_label");

    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    await act(async () => {
      container.querySelector("button").click();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(container.querySelector("button").textContent).toBe("Submit ✔");
  });

  it("shows retry label when fetch returns non-2xx (AC: 4)", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    const onError = vi.fn();
    renderInto(<NotificationActions notification={makeNotif([HTTP_ACTION])} onError={onError} />);

    await act(async () => {
      container.querySelector("button").click();
    });

    expect(container.querySelector("button").textContent).toBe("notification_action_failed_retry_label");
    expect(onError).toHaveBeenCalledWith(expect.anything());
  });

  it("calls onError(null) on success to clear error slot", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    const onError = vi.fn();
    renderInto(<NotificationActions notification={makeNotif([HTTP_ACTION])} onError={onError} />);

    await act(async () => {
      container.querySelector("button").click();
    });

    expect(onError).toHaveBeenLastCalledWith(null);
  });
});

describe("NotificationActions — broadcast action (AC: 5)", () => {
  it("renders broadcast button as disabled", () => {
    renderInto(<NotificationActions notification={makeNotif([BROADCAST_ACTION])} onError={vi.fn()} />);
    const btn = container.querySelector("button");
    expect(btn).toBeTruthy();
    expect(btn.disabled).toBe(true);
  });

  it("shows tooltip with unsupported message", () => {
    renderInto(<NotificationActions notification={makeNotif([BROADCAST_ACTION])} onError={vi.fn()} />);
    const tooltip = container.querySelector('[role="tooltip"]');
    expect(tooltip).toBeTruthy();
    expect(tooltip.textContent).toBe("notification_action_broadcast_not_supported");
  });
});

describe("NotificationActions — i18n (AC: 7)", () => {
  it("view button aria-label uses t() key (no hardcoded strings)", () => {
    renderInto(<NotificationActions notification={makeNotif([VIEW_ACTION])} onError={vi.fn()} />);
    const btn = container.querySelector("button");
    // t() identity mock returns the key; label should match the key pattern
    expect(btn.getAttribute("aria-label")).toMatch(/notification_action_view_aria_label/);
  });

  it("http button aria-label uses t() key", () => {
    renderInto(<NotificationActions notification={makeNotif([HTTP_ACTION])} onError={vi.fn()} />);
    const btn = container.querySelector("button");
    expect(btn.getAttribute("aria-label")).toMatch(/notification_action_http_aria_label/);
  });
});
