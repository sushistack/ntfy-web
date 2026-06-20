import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k, opts) => (opts?.name ? `${k}:${opts.name}` : k),
  }),
}));

// Use real notificationUtils and utils (not mocked)
import AttachmentBox from "./AttachmentBox";

const imageAttachment = { url: "https://example.com/photo.jpg", name: "photo.jpg", size: 12345, type: "image/jpeg" };
const fileAttachment = { url: "https://example.com/report.pdf", name: "report.pdf", size: 98765 };
const dangerUrl = { url: "javascript:alert(1)", name: "x.jpg", size: 0, type: "image/jpeg" };
const dataUrl = { url: "data:text/html,<h1>x</h1>", name: "x.html", size: 0 };

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
  act(() => root.render(ui));
  return container;
}

describe("AttachmentBox — null guard", () => {
  it("renders nothing when attachment is null", () => {
    render(<AttachmentBox attachment={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when attachment is undefined", () => {
    render(<AttachmentBox attachment={undefined} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("AttachmentBox — URL safety", () => {
  it("renders nothing for javascript: URL", () => {
    render(<AttachmentBox attachment={dangerUrl} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for data: URL", () => {
    render(<AttachmentBox attachment={dataUrl} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("AttachmentBox — image", () => {
  it("renders img with correct src", () => {
    render(<AttachmentBox attachment={imageAttachment} />);
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img.getAttribute("src")).toBe(imageAttachment.url);
  });

  it("wraps image in a new-tab link", () => {
    render(<AttachmentBox attachment={imageAttachment} />);
    const link = container.querySelector("a");
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe(imageAttachment.url);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("falls back to file chip on image load error", () => {
    render(<AttachmentBox attachment={imageAttachment} />);
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    act(() => {
      img.dispatchEvent(new Event("error", { bubbles: true }));
    });
    expect(container.querySelector("img")).toBeNull();
    const link = container.querySelector("a");
    expect(link).toBeTruthy();
    expect(link.getAttribute("download")).toBe(imageAttachment.name);
  });
});

describe("AttachmentBox — file chip", () => {
  it("renders filename", () => {
    render(<AttachmentBox attachment={fileAttachment} />);
    const nameSpan = container.querySelector("span");
    expect(nameSpan).toBeTruthy();
    expect(nameSpan.textContent).toBe(fileAttachment.name);
  });

  it("renders formatted size when size > 0", () => {
    render(<AttachmentBox attachment={fileAttachment} />);
    const spans = container.querySelectorAll("span");
    const sizeSpan = Array.from(spans).find((s) => /KB|MB|Bytes/i.test(s.textContent));
    expect(sizeSpan).toBeTruthy();
  });

  it("link has download attribute with filename", () => {
    render(<AttachmentBox attachment={fileAttachment} />);
    const link = container.querySelector("a");
    expect(link).toBeTruthy();
    expect(link.getAttribute("download")).toBe(fileAttachment.name);
  });

  it("does not render size span when size is 0", () => {
    const noSizeAttachment = { ...fileAttachment, size: 0 };
    render(<AttachmentBox attachment={noSizeAttachment} />);
    const spans = container.querySelectorAll("span");
    const sizeSpan = Array.from(spans).find((s) => /KB|MB|Bytes/i.test(s.textContent));
    expect(sizeSpan).toBeUndefined();
  });
});
