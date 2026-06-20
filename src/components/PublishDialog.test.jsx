import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";

const mockEnqueue = vi.hoisted(() => vi.fn());
const mockIsMobile = vi.hoisted(() => ({ value: false }));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k) => k }),
}));

vi.mock("@/components/hooks", () => ({
  useIsMobile: () => mockIsMobile.value,
  useActiveTopic: () => null,
}));

vi.mock("@/components/contexts/PublishQueueContext", () => ({
  usePublishQueue: () => ({ enqueue: mockEnqueue }),
}));

// Prevent Radix Dialog.Title from throwing when Sheet is mocked (no dialog context)
vi.mock("radix-ui", () => ({
  Dialog: {
    Title: ({ children, className }) => <h2 className={className}>{children}</h2>,
  },
}));

// Include disallowed_topics so validTopic() in utils.js doesn't crash
vi.mock("@/app/config", () => ({
  default: { base_url: "https://ntfy.example.com", disallowed_topics: [] },
}));

// Minimal Dialog mock — renders content when open
vi.mock("@/components/ui/Dialog", () => ({
  Dialog: ({ children, open }) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children, title }) => (
    <div role="dialog" aria-label={title}>
      {children}
    </div>
  ),
  DialogClose: ({ children, asChild }) => (asChild ? children : <button>{children}</button>),
}));

// Minimal Sheet mock — renders content when open
vi.mock("@/components/ui/Sheet", () => ({
  Sheet: ({ children, open }) => (open ? <div>{children}</div> : null),
  SheetContent: ({ children }) => <div role="dialog">{children}</div>,
  SheetClose: ({ children, asChild }) => (asChild ? children : <button>{children}</button>),
}));

import PublishDialog from "./PublishDialog";

const onOpenChange = vi.fn();
const defaultProps = {
  open: true,
  onOpenChange,
  initialTopic: "notes",
  baseUrl: "https://ntfy.example.com",
};

let container;
let root;

const textareaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
const inputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;

function setInputValue(el, value) {
  const setter = el.tagName === "TEXTAREA" ? textareaSetter : inputSetter;
  setter.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  mockEnqueue.mockClear();
  onOpenChange.mockClear();
  mockIsMobile.value = false;
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(ui) {
  act(() => root.render(ui));
  return container;
}

describe("PublishDialog — form rendering", () => {
  it("renders topic pre-filled with initialTopic", () => {
    render(<PublishDialog {...defaultProps} />);
    const topicInput = container.querySelector('[aria-label="publish_dialog_topic_label"]');
    expect(topicInput).toBeTruthy();
    expect(topicInput.value).toBe("notes");
  });

  it("renders 4 priority chips", () => {
    render(<PublishDialog {...defaultProps} />);
    const chips = Array.from(container.querySelectorAll('[aria-pressed]'));
    expect(chips).toHaveLength(4);
  });

  it("P3 chip is selected by default (aria-pressed=true)", () => {
    render(<PublishDialog {...defaultProps} />);
    const pressedChips = Array.from(container.querySelectorAll('[aria-pressed="true"]'));
    expect(pressedChips).toHaveLength(1);
    expect(pressedChips[0].textContent).toBe("publish_priority_default");
  });

  it("disables Send when body is empty", () => {
    render(<PublishDialog {...defaultProps} />);
    const send = container.querySelector('[aria-label="publish_dialog_send"]');
    expect(send.disabled).toBe(true);
  });

  it("enables Send when body has content", () => {
    render(<PublishDialog {...defaultProps} />);
    const body = container.querySelector('[aria-label="publish_dialog_body_label"]');
    act(() => setInputValue(body, "hello"));
    const send = container.querySelector('[aria-label="publish_dialog_send"]');
    expect(send.disabled).toBe(false);
  });
});

describe("PublishDialog — submit (optimistic)", () => {
  it("calls enqueue() with topic and body, then closes immediately", () => {
    render(<PublishDialog {...defaultProps} />);

    const body = container.querySelector('[aria-label="publish_dialog_body_label"]');
    act(() => setInputValue(body, "hello"));

    const send = container.querySelector('[aria-label="publish_dialog_send"]');
    act(() => send.click());

    expect(mockEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({ baseUrl: "https://ntfy.example.com", topic: "notes", body: "hello" })
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("includes priority in payload when P5 (urgent) is selected", () => {
    render(<PublishDialog {...defaultProps} />);

    act(() => {
      const body = container.querySelector('[aria-label="publish_dialog_body_label"]');
      setInputValue(body, "hi");
      const urgentChip = Array.from(container.querySelectorAll('[aria-pressed]')).find(
        (el) => el.textContent === "publish_priority_urgent"
      );
      urgentChip.click();
    });

    const send = container.querySelector('[aria-label="publish_dialog_send"]');
    act(() => send.click());

    expect(mockEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 5 })
    );
  });

  it("closes dialog immediately (optimistic — no await)", () => {
    render(<PublishDialog {...defaultProps} />);
    const body = container.querySelector('[aria-label="publish_dialog_body_label"]');
    act(() => setInputValue(body, "instant"));
    const send = container.querySelector('[aria-label="publish_dialog_send"]');
    act(() => send.click());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("PublishDialog — mobile Sheet branch", () => {
  it("renders dialog role when on mobile (Sheet)", () => {
    mockIsMobile.value = true;
    render(<PublishDialog {...defaultProps} />);
    expect(container.querySelector('[role="dialog"]')).toBeTruthy();
  });
});

describe("PublishDialog — no hardcoded Korean strings", () => {
  it("renders no hardcoded Korean (all strings go through t())", () => {
    render(<PublishDialog {...defaultProps} />);
    expect(container.innerHTML).not.toMatch(/알림|보내기|닫기|내용|우선순위/);
  });
});
