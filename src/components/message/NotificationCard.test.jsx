import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: "ko" },
  }),
}));

vi.mock("@/app/utils", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    formatShortDateTime: () => "2024-01-01",
  };
});

import { NotificationCard } from "./NotificationCard";

const baseNotification = {
  id: "1",
  new: 0,
  priority: 3,
  time: 1700000000,
  message: "hello",
  title: "Test title",
};

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

function makeCard(props = {}) {
  return (
    <NotificationCard
      notification={baseNotification}
      subscriptionName="test-topic"
      onTap={() => {}}
      isSelected={false}
      body={null}
      pending={null}
      error={null}
      {...props}
    />
  );
}

// G4 GREEN render test — AC #5
describe("G4 slot contract", () => {
  it("renders with all slots null — no crash (G4)", () => {
    render(makeCard({ body: null, pending: null, error: null }));
    // passes if it doesn't throw
  });

  it("renders with all slots undefined — no crash (G4)", () => {
    render(makeCard({ body: undefined, pending: undefined, error: undefined }));
  });

  it("renders body slot when provided", () => {
    render(makeCard({ body: <p id="body-slot">body content</p> }));
    expect(container.querySelector("#body-slot")).toBeTruthy();
  });

  it("renders pending slot when provided", () => {
    render(makeCard({ pending: <div id="pending-slot">pending</div> }));
    expect(container.querySelector("#pending-slot")).toBeTruthy();
  });

  it("renders error slot when provided", () => {
    render(makeCard({ error: <div id="error-slot">error</div> }));
    expect(container.querySelector("#error-slot")).toBeTruthy();
  });
});

// Priority badge — AC #3
describe("PriorityBadge rendering", () => {
  it("renders urgent badge for P5 notification", () => {
    render(makeCard({ notification: { ...baseNotification, priority: 5 } }));
    expect(container.textContent).toContain("notification_card_badge_max");
  });

  it("renders high badge for P4 notification", () => {
    render(makeCard({ notification: { ...baseNotification, priority: 4 } }));
    expect(container.textContent).toContain("notification_card_badge_high");
  });

  it("renders no badge for P3 notification", () => {
    render(makeCard({ notification: { ...baseNotification, priority: 3 } }));
    expect(container.textContent).not.toContain("notification_card_badge_max");
    expect(container.textContent).not.toContain("notification_card_badge_high");
  });

  it("renders no badge when priority absent (defaults to P3)", () => {
    const { priority: _, ...notifNoPriority } = baseNotification;
    render(makeCard({ notification: notifNoPriority }));
    expect(container.textContent).not.toContain("notification_card_badge_max");
    expect(container.textContent).not.toContain("notification_card_badge_high");
  });

  it("P5 badge has bg-priority-max class", () => {
    render(makeCard({ notification: { ...baseNotification, priority: 5 } }));
    const badge = container.querySelector('[class*="bg-priority-max"]');
    expect(badge).toBeTruthy();
  });

  it("P4 badge has bg-priority-high class", () => {
    render(makeCard({ notification: { ...baseNotification, priority: 4 } }));
    const badge = container.querySelector('[class*="bg-priority-high"]');
    expect(badge).toBeTruthy();
  });
});

// Unread dot — AC #4
describe("Unread dot", () => {
  it("renders unread dot when notification.new === 1", () => {
    render(makeCard({ notification: { ...baseNotification, new: 1 } }));
    const dot = container.querySelector('[aria-label="notification_card_unread_label"]');
    expect(dot).toBeTruthy();
  });

  it("does not render unread dot when notification.new === 0", () => {
    render(makeCard({ notification: { ...baseNotification, new: 0 } }));
    const dot = container.querySelector('[aria-label="notification_card_unread_label"]');
    expect(dot).toBeNull();
  });
});

// isSelected background — AC #7
describe("Selection state", () => {
  it("applies bg-surface-active class when isSelected is true", () => {
    render(makeCard({ isSelected: true }));
    const card = container.firstChild;
    expect(card.className).toContain("bg-surface-active");
  });

  it("does not apply bg-surface-active when isSelected is false", () => {
    render(makeCard({ isSelected: false }));
    const card = container.firstChild;
    expect(card.className).not.toContain("bg-surface-active");
  });
});

// Click handling — AC #6
describe("Card click handling", () => {
  it("calls onTap with notification when card is clicked", () => {
    const onTap = vi.fn();
    render(makeCard({ onTap }));
    act(() => {
      container.firstChild.click();
    });
    expect(onTap).toHaveBeenCalledOnce();
    expect(onTap).toHaveBeenCalledWith(baseNotification);
  });

  it("clicking bell button does NOT call onTap", () => {
    const onTap = vi.fn();
    render(makeCard({ onTap }));
    const bellBtn = container.querySelector('[aria-label="notification_card_mute_toggle_label"]');
    act(() => {
      bellBtn.click();
    });
    expect(onTap).not.toHaveBeenCalled();
  });

  it("clicking overflow button does NOT call onTap", () => {
    const onTap = vi.fn();
    render(makeCard({ onTap }));
    const overflowBtn = container.querySelector('[aria-label="notification_card_overflow_label"]');
    act(() => {
      overflowBtn.click();
    });
    expect(onTap).not.toHaveBeenCalled();
  });
});

// Accessibility — AC #8
describe("Accessibility", () => {
  it("card has role=button", () => {
    render(makeCard());
    expect(container.firstChild.getAttribute("role")).toBe("button");
  });

  it("card has tabIndex=0", () => {
    render(makeCard());
    expect(container.firstChild.tabIndex).toBe(0);
  });

  it("bell button has aria-label", () => {
    render(makeCard());
    const bellBtn = container.querySelector('[aria-label="notification_card_mute_toggle_label"]');
    expect(bellBtn).toBeTruthy();
  });

  it("overflow button has aria-label", () => {
    render(makeCard());
    const overflowBtn = container.querySelector('[aria-label="notification_card_overflow_label"]');
    expect(overflowBtn).toBeTruthy();
  });

  it("no hardcoded Korean strings in rendered output", () => {
    render(makeCard({ notification: { ...baseNotification, priority: 5, new: 1 } }));
    // With identity mock t(key)=key, Korean copy should only come through t()
    // Any hardcoded Korean would show up as literal Korean characters not matching key names
    expect(container.innerHTML).not.toMatch(/(?<![a-zA-Z0-9_])긴급(?![a-zA-Z0-9_"])/);
    expect(container.innerHTML).not.toMatch(/(?<![a-zA-Z0-9_])높음(?![a-zA-Z0-9_"])/);
  });
});

// Accent bar — AC #2
describe("Accent bar", () => {
  it("renders accent bar for P5", () => {
    render(makeCard({ notification: { ...baseNotification, priority: 5 } }));
    const bar = container.querySelector('[class*="bg-priority-max"][class*="absolute"]');
    expect(bar).toBeTruthy();
  });

  it("renders accent bar for P4", () => {
    render(makeCard({ notification: { ...baseNotification, priority: 4 } }));
    const bar = container.querySelector('[class*="bg-priority-high"][class*="absolute"]');
    expect(bar).toBeTruthy();
  });

  it("does not render accent bar for P3", () => {
    render(makeCard({ notification: { ...baseNotification, priority: 3 } }));
    const barMax = container.querySelector('[class*="bg-priority-max"][class*="absolute"]');
    const barHigh = container.querySelector('[class*="bg-priority-high"][class*="absolute"]');
    expect(barMax).toBeNull();
    expect(barHigh).toBeNull();
  });
});
