import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { Button } from "./Button.jsx";

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

function renderButton(props, children = "Click") {
  act(() => {
    root.render(<Button {...props}>{children}</Button>);
  });
  return container.querySelector("button");
}

describe("Button", () => {
  it("renders a <button> element", () => {
    const el = renderButton({});
    expect(el).toBeTruthy();
    expect(el.tagName).toBe("BUTTON");
  });

  it("applies primary variant classes by default", () => {
    const el = renderButton({});
    expect(el.className).toContain("bg-button-fill");
    expect(el.className).toContain("text-button-fill-text");
  });

  it("applies ghost variant classes", () => {
    const el = renderButton({ variant: "ghost" });
    expect(el.className).toContain("border-control-border");
    expect(el.className).toContain("text-muted");
    expect(el.className).toContain("bg-transparent");
  });

  it("applies sm size classes", () => {
    const el = renderButton({ size: "sm" });
    expect(el.className).toContain("h-8");
  });

  it("applies md size classes (default)", () => {
    const el = renderButton({});
    expect(el.className).toContain("h-10");
  });

  it("applies lg size classes", () => {
    const el = renderButton({ size: "lg" });
    expect(el.className).toContain("h-12");
  });

  it("merges custom className", () => {
    const el = renderButton({ className: "custom-class" });
    expect(el.className).toContain("custom-class");
  });

  it("spreads extra props — disabled", () => {
    const el = renderButton({ disabled: true });
    expect(el.disabled).toBe(true);
  });

  it("preserves a reset button type", () => {
    const el = renderButton({ type: "reset" });
    expect(el.type).toBe("reset");
  });

  it("includes focus-visible ring classes", () => {
    const el = renderButton({});
    expect(el.className).toContain("focus-visible:ring-2");
  });

  it("primary hover uses accent fill feedback", () => {
    const el = renderButton({});
    expect(el.className).toContain("hover:bg-accent-ui");
    expect(el.className).toContain("hover:text-accent-on-surface");
  });

  it("includes press motion classes", () => {
    const el = renderButton({});
    expect(el.className).toContain("hover:-translate-y-0.5");
    expect(el.className).toContain("active:scale-95");
  });
});
