import { describe, it, expect, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogClose } from "./Dialog.jsx";

function renderInto(jsx) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(jsx));
  return {
    container,
    cleanup: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe("Dialog exports", () => {
  it("exports named functions", () => {
    expect(typeof Dialog).toBe("function");
    expect(typeof DialogTrigger).toBe("object"); // Radix forwardRef
    expect(typeof DialogContent).toBe("function");
    expect(typeof DialogClose).toBe("object");
  });
});

describe("Dialog render", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders trigger without crashing", () => {
    const { cleanup } = renderInto(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent title="Test">body</DialogContent>
      </Dialog>
    );
    expect(document.body.textContent).toContain("Open");
    cleanup();
  });

  it("does not render content until open", () => {
    const { cleanup } = renderInto(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent title="Test">Secret body</DialogContent>
      </Dialog>
    );
    expect(document.body.textContent).not.toContain("Secret body");
    cleanup();
  });

  it("opens dialog on trigger click", () => {
    const { cleanup } = renderInto(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent title="My Title">Dialog body text</DialogContent>
      </Dialog>
    );
    const trigger = document.body.querySelector("button");
    act(() => trigger.click());
    expect(document.body.textContent).toContain("Dialog body text");
    expect(document.body.textContent).toContain("My Title");
    cleanup();
  });
});
