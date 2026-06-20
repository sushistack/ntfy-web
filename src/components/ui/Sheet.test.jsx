import { describe, it, expect, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "./Sheet.jsx";

function renderInto(jsx) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(jsx));
  return {
    cleanup: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe("Sheet exports", () => {
  it("exports named functions/objects", () => {
    expect(typeof Sheet).toBe("function");
    expect(typeof SheetTrigger).toBe("object");
    expect(typeof SheetContent).toBe("function");
    expect(typeof SheetClose).toBe("object");
  });
});

describe("Sheet render", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders trigger without crashing", () => {
    const { cleanup } = renderInto(
      <Sheet>
        <SheetTrigger>Open Sheet</SheetTrigger>
        <SheetContent>Sheet body</SheetContent>
      </Sheet>
    );
    expect(document.body.textContent).toContain("Open Sheet");
    cleanup();
  });

  it("does not render content until open", () => {
    const { cleanup } = renderInto(
      <Sheet>
        <SheetTrigger>Open Sheet</SheetTrigger>
        <SheetContent>Hidden content</SheetContent>
      </Sheet>
    );
    expect(document.body.textContent).not.toContain("Hidden content");
    cleanup();
  });

  it("opens on trigger click", () => {
    const { cleanup } = renderInto(
      <Sheet>
        <SheetTrigger>Open Sheet</SheetTrigger>
        <SheetContent side="bottom">Sheet content here</SheetContent>
      </Sheet>
    );
    const trigger = document.body.querySelector("button");
    act(() => trigger.click());
    expect(document.body.textContent).toContain("Sheet content here");
    cleanup();
  });

  it("renders right-side variant", () => {
    const { cleanup } = renderInto(
      <Sheet defaultOpen>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent side="right">Right panel</SheetContent>
      </Sheet>
    );
    expect(document.body.textContent).toContain("Right panel");
    cleanup();
  });
});
