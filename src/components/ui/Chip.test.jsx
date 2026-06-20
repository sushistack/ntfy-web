import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { Chip } from "./Chip.jsx";

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

function renderChip(props, children = "Label") {
  act(() => {
    root.render(<Chip {...props}>{children}</Chip>);
  });
  return container.firstElementChild;
}

describe("Chip — default (tag variant)", () => {
  it("renders a <span> by default", () => {
    const el = renderChip({});
    expect(el.tagName).toBe("SPAN");
  });

  it("applies tag variant classes by default", () => {
    const el = renderChip({});
    expect(el.className).toContain("rounded-full");
    expect(el.className).toContain("bg-transparent");
    expect(el.className).toContain("border-control-border");
    expect(el.className).toContain("text-muted");
  });
});

describe("Chip — priority variant", () => {
  it("applies rounded-badge (not rounded-full)", () => {
    const el = renderChip({ variant: "priority" });
    expect(el.className).toContain("rounded-badge");
    expect(el.className).not.toContain("rounded-full");
  });

  it("applies uppercase and font-extrabold", () => {
    const el = renderChip({ variant: "priority" });
    expect(el.className).toContain("uppercase");
    expect(el.className).toContain("font-extrabold");
  });

  it("does NOT apply a hardcoded bg color (caller supplies it)", () => {
    const el = renderChip({ variant: "priority" });
    // Priority chip should be color-neutral — caller passes bg via className
    expect(el.className).not.toContain("bg-priority");
    expect(el.className).not.toContain("bg-surface");
  });

  it("accepts caller-supplied bg via className", () => {
    const el = renderChip({ variant: "priority", className: "bg-priority-max text-white" });
    expect(el.className).toContain("bg-priority-max");
    expect(el.className).toContain("text-white");
  });
});

describe("Chip — topic variant", () => {
  it("applies rounded-full pill shape", () => {
    const el = renderChip({ variant: "topic" });
    expect(el.className).toContain("rounded-full");
  });

  it("applies topic chip token classes", () => {
    const el = renderChip({ variant: "topic" });
    expect(el.className).toContain("bg-topic-chip-bg");
    expect(el.className).toContain("text-topic-chip-text");
  });

  it('renders as <button> when as="button"', () => {
    const el = renderChip({ variant: "topic", as: "button" });
    expect(el.tagName).toBe("BUTTON");
  });
});

describe("Chip — tag variant", () => {
  it("applies outlined pill classes", () => {
    const el = renderChip({ variant: "tag" });
    expect(el.className).toContain("rounded-full");
    expect(el.className).toContain("bg-transparent");
    expect(el.className).toContain("border");
    expect(el.className).toContain("border-control-border");
  });
});

describe("Chip — shared", () => {
  it("includes focus-visible ring classes", () => {
    const el = renderChip({});
    expect(el.className).toContain("focus-visible:ring-2");
  });

  it("merges custom className", () => {
    const el = renderChip({ className: "custom-chip" });
    expect(el.className).toContain("custom-chip");
  });

  it("spreads extra props", () => {
    const el = renderChip({ "data-testid": "chip1" });
    expect(el.getAttribute("data-testid")).toBe("chip1");
  });

  it("priority and topic rounded classes do NOT unify (color-blind safety)", () => {
    // Capture className before re-rendering into the same root
    const priorityCls = renderChip({ variant: "priority" }).className;
    const topicCls = renderChip({ variant: "topic" }).className;
    expect(priorityCls).toContain("rounded-badge");
    expect(topicCls).toContain("rounded-full");
  });
});
