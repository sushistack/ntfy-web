import { describe, it, expect, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "./Tooltip.jsx";

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

describe("Tooltip exports", () => {
  it("exports named functions/objects", () => {
    expect(typeof TooltipProvider).toBe("function");
    expect(typeof Tooltip).toBe("function");
    expect(typeof TooltipTrigger).toBe("object");
    expect(typeof TooltipContent).toBe("function");
  });
});

describe("Tooltip render", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders trigger wrapped in provider without crashing", () => {
    const { cleanup } = renderInto(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(document.body.textContent).toContain("Hover me");
    cleanup();
  });

  it("does not render tooltip content until open", () => {
    const { cleanup } = renderInto(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Hidden tip</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(document.body.textContent).not.toContain("Hidden tip");
    cleanup();
  });

  it("shows content when open controlled", () => {
    const { cleanup } = renderInto(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Visible tip</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(document.body.textContent).toContain("Visible tip");
    cleanup();
  });
});
