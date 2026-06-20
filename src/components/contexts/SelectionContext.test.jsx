import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const { SelectionProvider, useSelection } = await import("./SelectionContext.jsx");

// Helper consumer that exposes selection state to the DOM
const Consumer = () => {
  const { topic, msgId } = useSelection();
  return <div data-testid="out">{JSON.stringify({ topic, msgId })}</div>;
};

// Render SelectionProvider inside MemoryRouter at a given path; return container
const renderAt = (path, container, root) => {
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="*"
            element={
              <SelectionProvider>
                <Consumer />
              </SelectionProvider>
            }
          />
        </Routes>
      </MemoryRouter>
    );
  });
  return JSON.parse(container.querySelector("[data-testid=out]").textContent);
};

describe("SelectionContext", () => {
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

  it("returns topic + msgId when at /:topic/:msgId", () => {
    const out = renderAt("/my-topic/msg123", container, root);
    expect(out).toEqual({ topic: "my-topic", msgId: "msg123" });
  });

  it("returns topic + null msgId when at /:topic only", () => {
    const out = renderAt("/my-topic", container, root);
    expect(out).toEqual({ topic: "my-topic", msgId: null });
  });

  it("returns null msgId when at /settings", () => {
    const out = renderAt("/settings", container, root);
    expect(out.msgId).toBeNull();
  });

  it("throws when used outside provider", () => {
    const origError = console.error;
    console.error = vi.fn();

    const ThrowingComponent = () => {
      useSelection();
      return null;
    };

    expect(() => {
      act(() => {
        root.render(
          <MemoryRouter>
            <ThrowingComponent />
          </MemoryRouter>
        );
      });
    }).toThrow("useSelection() must be used inside <SelectionProvider>");

    console.error = origError;
  });
});
