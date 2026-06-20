import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

import { NotConnectedPanel, ConnectingPanel, NoSubscriptionsPanel } from "./EmptyStates";

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

function render(ui) {
  act(() => {
    root.render(ui);
  });
  return container;
}

describe("NotConnectedPanel", () => {
  it("renders title key", () => {
    render(<NotConnectedPanel onSettings={() => {}} />);
    expect(container.textContent).toContain("empty_state_not_connected_title");
  });

  it("renders desc key", () => {
    render(<NotConnectedPanel onSettings={() => {}} />);
    expect(container.textContent).toContain("empty_state_not_connected_desc");
  });

  it("renders action button with action key", () => {
    render(<NotConnectedPanel onSettings={() => {}} />);
    const btn = container.querySelector("button");
    expect(btn).toBeTruthy();
    expect(btn.textContent).toBe("empty_state_not_connected_action");
  });

  it("calls onSettings when action button is clicked", () => {
    const onSettings = vi.fn();
    render(<NotConnectedPanel onSettings={onSettings} />);
    act(() => {
      container.querySelector("button").click();
    });
    expect(onSettings).toHaveBeenCalledOnce();
  });

  it("uses coral colorway", () => {
    render(<NotConnectedPanel onSettings={() => {}} />);
    const tile = container.firstChild.firstChild;
    expect(tile.className).toContain("bg-priority-max");
  });
});

describe("ConnectingPanel", () => {
  it("renders desc key", () => {
    render(<ConnectingPanel />);
    expect(container.textContent).toContain("empty_state_connecting_desc");
  });

  it("renders title key", () => {
    render(<ConnectingPanel />);
    expect(container.textContent).toContain("empty_state_connecting_title");
  });

  it("renders no action button", () => {
    render(<ConnectingPanel />);
    expect(container.querySelector("button")).toBeNull();
  });

  it("uses amber colorway with animate-pulse", () => {
    render(<ConnectingPanel />);
    const tile = container.firstChild.firstChild;
    expect(tile.className).toContain("bg-priority-high");
    expect(tile.className).toContain("animate-pulse");
  });
});

describe("NoSubscriptionsPanel", () => {
  it("renders title key", () => {
    render(<NoSubscriptionsPanel onSubscribe={() => {}} />);
    expect(container.textContent).toContain("empty_state_no_subscriptions_title");
  });

  it("renders desc key", () => {
    render(<NoSubscriptionsPanel onSubscribe={() => {}} />);
    expect(container.textContent).toContain("empty_state_no_subscriptions_desc");
  });

  it("renders green action button with action key", () => {
    render(<NoSubscriptionsPanel onSubscribe={() => {}} />);
    const btn = container.querySelector("button");
    expect(btn).toBeTruthy();
    expect(btn.textContent).toBe("empty_state_no_subscriptions_action");
  });

  it("green button uses accent-ui token class", () => {
    render(<NoSubscriptionsPanel onSubscribe={() => {}} />);
    const btn = container.querySelector("button");
    expect(btn.className).toContain("bg-accent-ui");
    expect(btn.className).toContain("text-accent-on-surface");
  });

  it("calls onSubscribe when green button is clicked", () => {
    const onSubscribe = vi.fn();
    render(<NoSubscriptionsPanel onSubscribe={onSubscribe} />);
    act(() => {
      container.querySelector("button").click();
    });
    expect(onSubscribe).toHaveBeenCalledOnce();
  });

  it("uses green colorway", () => {
    render(<NoSubscriptionsPanel onSubscribe={() => {}} />);
    const tile = container.firstChild.firstChild;
    expect(tile.className).toContain("bg-accent-text");
  });
});

describe("EmptyStates — architecture boundaries", () => {
  it("NotConnectedPanel has no hardcoded Korean strings", () => {
    render(<NotConnectedPanel onSettings={() => {}} />);
    const text = container.innerHTML;
    // all Korean copy goes through t() — with the identity mock, output is key names only
    expect(text).not.toMatch(/서버|연결|인증|설정/);
  });

  it("ConnectingPanel has no hardcoded Korean strings", () => {
    render(<ConnectingPanel />);
    expect(container.innerHTML).not.toMatch(/서버|연결|잠시/);
  });

  it("NoSubscriptionsPanel has no hardcoded Korean strings", () => {
    render(<NoSubscriptionsPanel onSubscribe={() => {}} />);
    expect(container.innerHTML).not.toMatch(/구독|토픽|알림/);
  });
});
