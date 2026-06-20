import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import StructuredCard, { parseCardSpec, CARD_TAG } from "./StructuredCard";

// Minimal react-remark stub — the markdown block just needs to render its text synchronously.
vi.mock("react-remark", async () => {
  const React = await import("react");
  return {
    useRemark: () => {
      const [content, setContent] = React.useState(null);
      return [content, (src) => setContent(src ? React.createElement("p", null, src) : null)];
    },
  };
});

const tagged = (message) => ({ tags: [CARD_TAG], message });

describe("parseCardSpec", () => {
  it("returns null when the card tag is absent", () => {
    expect(parseCardSpec({ tags: ["foo"], message: '{"type":"kv","rows":[]}' })).toBeNull();
  });

  it("returns null for a tagged-but-non-JSON body", () => {
    expect(parseCardSpec(tagged("just text"))).toBeNull();
  });

  it("returns null for JSON without a known type", () => {
    expect(parseCardSpec(tagged('{"foo":1}'))).toBeNull();
    expect(parseCardSpec(tagged('{"type":"mystery"}'))).toBeNull();
  });

  it("returns null for non-array tags", () => {
    expect(parseCardSpec({ tags: "card", message: '{"type":"kv","rows":[]}' })).toBeNull();
  });

  it("parses a valid kv spec", () => {
    expect(parseCardSpec(tagged('{"type":"kv","rows":[{"key":"CPU","value":"78%"}]}'))).toEqual({
      type: "kv",
      rows: [{ key: "CPU", value: "78%" }],
    });
  });
});

describe("StructuredCard render", () => {
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

  const render = (spec) => act(() => root.render(<StructuredCard spec={spec} />));

  it("renders kv rows with an inline meter whenever a meter value is present", () => {
    render({ type: "kv", rows: [{ key: "CPU", value: "78", meter: 78 }] });
    expect(container.textContent).toContain("CPU");
    expect(container.querySelector('[role="meter"]')).not.toBeNull();
  });

  it("renders every list item (no truncation)", () => {
    render({ type: "list", items: ["a", "b", "c", "d", "e"] });
    expect(container.querySelectorAll("li")).toHaveLength(5);
  });

  it("renders a chart svg without throwing on bad values", () => {
    render({ type: "chart", kind: "bar", data: [{ value: 1 }, { value: "nope" }, { value: 3 }] });
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("renders all section blocks (markdown + kv + chart) in order", () => {
    render({
      type: "sections",
      blocks: [
        { type: "markdown", text: "# 배포 완료" },
        { type: "kv", rows: [{ key: "CPU", value: "10%", meter: 10 }] },
        { type: "chart", kind: "line", data: [{ value: 1 }, { value: 2 }] },
      ],
    });
    expect(container.querySelector("dl")).not.toBeNull(); // kv
    expect(container.querySelector('[role="meter"]')).not.toBeNull(); // kv meter
    expect(container.querySelector("svg")).not.toBeNull(); // chart
  });
});
