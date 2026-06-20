import { describe, it, expect, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator } from "./Menu.jsx";

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

describe("Menu exports", () => {
  it("exports named functions/objects", () => {
    expect(typeof Menu).toBe("function");
    expect(typeof MenuTrigger).toBe("object");
    expect(typeof MenuContent).toBe("function");
    expect(typeof MenuItem).toBe("function");
    expect(typeof MenuSeparator).toBe("function");
  });
});

describe("Menu render", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders trigger without crashing", () => {
    const { cleanup } = renderInto(
      <Menu>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuContent>
          <MenuItem>Edit</MenuItem>
          <MenuSeparator />
          <MenuItem>Delete</MenuItem>
        </MenuContent>
      </Menu>
    );
    expect(document.body.textContent).toContain("Actions");
    cleanup();
  });

  it("does not render menu items until open", () => {
    const { cleanup } = renderInto(
      <Menu>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuContent>
          <MenuItem>Edit</MenuItem>
        </MenuContent>
      </Menu>
    );
    expect(document.body.textContent).not.toContain("Edit");
    cleanup();
  });

  it("opens via controlled open prop", () => {
    const { cleanup } = renderInto(
      <Menu open>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuContent>
          <MenuItem>Edit Item</MenuItem>
          <MenuItem>Delete Item</MenuItem>
        </MenuContent>
      </Menu>
    );
    expect(document.body.textContent).toContain("Edit Item");
    expect(document.body.textContent).toContain("Delete Item");
    cleanup();
  });
});
