import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import LiveRegion from "./LiveRegion.jsx";

let container;
let root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  vi.useFakeTimers();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

function renderLR(props) {
  act(() => {
    root.render(<LiveRegion {...props} />);
  });
  return container.firstChild;
}

describe("LiveRegion — ARIA attributes", () => {
  it('renders a div with role="status"', () => {
    const el = renderLR({ message: "Hello" });
    expect(el.getAttribute("role")).toBe("status");
  });

  it('has aria-live="polite" by default', () => {
    const el = renderLR({ message: "Hello" });
    expect(el.getAttribute("aria-live")).toBe("polite");
  });

  it('accepts politeness="assertive"', () => {
    const el = renderLR({ message: "Hello", politeness: "assertive" });
    expect(el.getAttribute("aria-live")).toBe("assertive");
  });

  it('has aria-atomic="true"', () => {
    const el = renderLR({ message: "Hello" });
    expect(el.getAttribute("aria-atomic")).toBe("true");
  });

  it("has sr-only class (visually hidden, in accessibility tree)", () => {
    const el = renderLR({ message: "Hello" });
    expect(el.className).toContain("sr-only");
  });
});

describe("LiveRegion — clear-then-set announcement pattern", () => {
  it("initial render shows message after 100ms timeout", () => {
    const el = renderLR({ message: "Announcement" });
    // Before timer fires: content should be empty (cleared by useEffect)
    expect(el.textContent).toBe("");

    // After 100ms: message appears
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(el.textContent).toBe("Announcement");
  });

  it("queues a new message until the current announcement has had time to be read", () => {
    renderLR({ message: "First" });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(container.firstChild.textContent).toBe("First");

    // Update to different message — should clear first, then set
    act(() => {
      root.render(<LiveRegion message="Second" />);
    });
    expect(container.firstChild.textContent).toBe("First");

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(container.firstChild.textContent).toBe("");

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(container.firstChild.textContent).toBe("Second");
  });

  it("re-announces a new message after clear", () => {
    renderLR({ message: "Old message" });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      root.render(<LiveRegion message="New message" />);
    });

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(container.firstChild.textContent).toBe("New message");
  });

  it("does not show content before 100ms have elapsed", () => {
    renderLR({ message: "Late announcement" });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(container.firstChild.textContent).toBe("");
  });

  it("re-announces identical text when announcementKey changes", () => {
    renderLR({ message: "Connecting", announcementKey: 1 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(container.firstChild.textContent).toBe("Connecting");

    act(() => {
      root.render(<LiveRegion message="Connecting" announcementKey={2} />);
    });
    act(() => {
      vi.advanceTimersByTime(151);
      vi.advanceTimersByTime(100);
    });
    expect(container.firstChild.textContent).toBe("Connecting");
  });

  it("preserves rapid announcements in order", () => {
    renderLR({ message: "Disconnected", announcementKey: 1 });
    act(() => {
      root.render(<LiveRegion message="Connecting" announcementKey={2} />);
    });
    act(() => {
      root.render(<LiveRegion message="Connected" announcementKey={3} />);
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(container.firstChild.textContent).toBe("Disconnected");

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(container.firstChild.textContent).toBe("Connecting");

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(container.firstChild.textContent).toBe("Connected");
  });
});
