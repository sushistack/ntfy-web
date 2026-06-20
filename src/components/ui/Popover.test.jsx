import { describe, it, expect, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "./Popover.jsx";

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

describe("Popover exports", () => {
  it("exports named functions/objects", () => {
    expect(typeof Popover).toBe("function");
    expect(typeof PopoverTrigger).toBe("object");
    expect(typeof PopoverContent).toBe("function");
  });
});

describe("Popover render", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders trigger without crashing", () => {
    const { cleanup } = renderInto(
      <Popover>
        <PopoverTrigger>Info</PopoverTrigger>
        <PopoverContent>Popover text</PopoverContent>
      </Popover>
    );
    expect(document.body.textContent).toContain("Info");
    cleanup();
  });

  it("does not render content until open", () => {
    const { cleanup } = renderInto(
      <Popover>
        <PopoverTrigger>Info</PopoverTrigger>
        <PopoverContent>Hidden popover</PopoverContent>
      </Popover>
    );
    expect(document.body.textContent).not.toContain("Hidden popover");
    cleanup();
  });

  it("shows content when open controlled", () => {
    const { cleanup } = renderInto(
      <Popover open>
        <PopoverTrigger>Info</PopoverTrigger>
        <PopoverContent>Popover is open</PopoverContent>
      </Popover>
    );
    expect(document.body.textContent).toContain("Popover is open");
    cleanup();
  });
});
