import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k) => k }),
}));

// Mock react-remark with a synchronous implementation so the component map
// (including the URL sanitization logic) runs predictably in tests.
vi.mock("react-remark", async () => {
  const React = await import("react");

  return {
    useRemark: (options = {}) => {
      const components = options?.remarkToReactComponents ?? {};
      const [content, setContent] = React.useState(null);

      const setMarkdownSource = React.useCallback(
        (source) => {
          if (!source) {
            setContent(null);
            return;
          }

          // img before link (img syntax includes !)
          const imgMatch = source.match(/^!\[([^\]]*)\]\(([^)]*)\)$/);
          if (imgMatch) {
            const [, alt, src] = imgMatch;
            const Img = components.img;
            setContent(
              Img
                ? React.createElement(Img, { src, alt })
                : React.createElement("img", { src, alt })
            );
            return;
          }

          // [text](url)
          const linkMatch = source.match(/\[([^\]]*)\]\(([^)]+)\)/);
          if (linkMatch) {
            const [, text, href] = linkMatch;
            const A = components.a;
            setContent(
              A
                ? React.createElement(A, { href }, text)
                : React.createElement("a", { href }, text)
            );
            return;
          }

          // plain text → p
          const P = components.p;
          setContent(
            P ? React.createElement(P, null, source) : React.createElement("p", null, source)
          );
        },
        [] // components captured at hook init; stable since componentMap is module-level
      );

      return [content, setMarkdownSource];
    },
  };
});

import MarkdownContent from "./MarkdownContent";
import CardBody from "./CardBody";

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

function render(ui) {
  act(() => {
    root.render(ui);
  });
  return container;
}

// ─── MarkdownContent — link sanitization (AC #4, security C4) ────────────────

describe("MarkdownContent — link sanitization (security)", () => {
  it("strips javascript: href — no clickable executable link", () => {
    render(<MarkdownContent content="[click me](javascript:alert(1))" />);
    const link = container.querySelector("a[href]");
    if (link) {
      expect(link.getAttribute("href")).not.toMatch(/^javascript:/i);
      expect(link.getAttribute("href")).not.toMatch(/^data:/i);
    }
    // visible text still renders
    expect(container.textContent).toContain("click me");
  });

  it("strips data: href", () => {
    render(
      <MarkdownContent content="[bad](data:text/html,<script>alert(1)</script>)" />
    );
    const link = container.querySelector("a[href]");
    if (link) {
      expect(link.getAttribute("href")).not.toMatch(/^data:/i);
    }
  });

  it("passes through https: href unchanged", () => {
    render(<MarkdownContent content="[safe](https://example.com)" />);
    const link = container.querySelector("a");
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("https://example.com");
  });

  it("passes through http: href unchanged", () => {
    render(<MarkdownContent content="[http link](http://example.com)" />);
    const link = container.querySelector("a");
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("http://example.com");
  });

  it("passes through mailto: href unchanged", () => {
    render(<MarkdownContent content="[mail](mailto:test@example.com)" />);
    const link = container.querySelector("a");
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("mailto:test@example.com");
  });
});

// ─── MarkdownContent — image sanitization (AC #5) ────────────────────────────

describe("MarkdownContent — image sanitization (security)", () => {
  it("strips javascript: image src — no img rendered", () => {
    render(<MarkdownContent content="![alt](javascript:alert(1))" />);
    const img = container.querySelector("img");
    expect(img).toBeNull();
  });

  it("strips data: image src — no img rendered", () => {
    render(<MarkdownContent content="![alt](data:image/png;base64,abc)" />);
    const img = container.querySelector("img");
    expect(img).toBeNull();
  });

  it("passes through https: image src", () => {
    render(<MarkdownContent content="![photo](https://example.com/img.png)" />);
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img.getAttribute("src")).toBe("https://example.com/img.png");
  });
});

// ─── CardBody — shape detection (AC #1) ──────────────────────────────────────

describe("CardBody — shape detection", () => {
  const notif = (message) => ({ message });

  it("renders a dl structure for key-value message", () => {
    render(<CardBody notification={notif("Status: OK\nVersion: 1.2.3")} />);
    expect(container.querySelector("dl")).toBeTruthy();
  });

  it("renders Meter for a percentage value (rich-kv)", () => {
    render(<CardBody notification={notif("CPU: 78%\nMemory: 45%")} />);
    expect(container.querySelector('[role="meter"]')).toBeTruthy();
  });

  it("renders paragraph form for single-line message", () => {
    render(<CardBody notification={notif("Hello world")} />);
    // paragraph mode renders MarkdownContent wrapped in a div
    expect(container.querySelector("dl")).toBeNull();
    expect(container.querySelector('[role="meter"]')).toBeNull();
  });

  it("renders paragraph form for multi-line non-kv message", () => {
    render(<CardBody notification={notif("Line one\nLine two no colon")} />);
    expect(container.querySelector("dl")).toBeNull();
  });

  it("renders kv (no meter) when values are non-numeric", () => {
    render(<CardBody notification={notif("Status: OK\nHost: server1")} />);
    expect(container.querySelector("dl")).toBeTruthy();
    expect(container.querySelector('[role="meter"]')).toBeNull();
  });
});

// ─── CardBody — graceful degradation (AC #2) ─────────────────────────────────

describe("CardBody — graceful degradation", () => {
  it("falls back to raw text on null message without throwing", () => {
    expect(() => render(<CardBody notification={{ message: null }} />)).not.toThrow();
  });

  it("falls back to raw text on undefined message without throwing", () => {
    expect(() => render(<CardBody notification={{ message: undefined }} />)).not.toThrow();
  });

  it("falls back to raw text on empty message without throwing", () => {
    expect(() => render(<CardBody notification={{ message: "" }} />)).not.toThrow();
  });

  it("does not crash when notification itself is minimal", () => {
    expect(() => render(<CardBody notification={{}} />)).not.toThrow();
  });
});

// ─── CardBody — error value styling (AC #1 kv) ───────────────────────────────

describe("CardBody — kv error value coloring", () => {
  it("applies text-priority-max to error key rows", () => {
    // Non-numeric error value → kv (not rich-kv), so KvBody renders with error coloring
    render(<CardBody notification={{ message: "error_message: Failed\nStatus: OK" }} />);
    const dd = container.querySelector("dd.text-priority-max");
    expect(dd).toBeTruthy();
  });

  it("applies text-accent-text to ok value rows", () => {
    render(<CardBody notification={{ message: "Status: OK\nHost: server1" }} />);
    const dd = container.querySelector("dd.text-accent-text");
    expect(dd).toBeTruthy();
  });
});
