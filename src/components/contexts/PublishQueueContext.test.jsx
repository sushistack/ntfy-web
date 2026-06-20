import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";

vi.mock("@/app/Api", () => ({
  default: { publish: vi.fn() },
}));

vi.mock("./ConnectionContext", () => ({
  useConnection: () => ({ connectionState: "connected" }),
  CONN_STATES: { CONNECTED: "connected", OFFLINE: "offline" },
}));

const { publishQueueReducer, PublishQueueProvider, usePublishQueue } = await import("./PublishQueueContext.jsx");

// ─── Reducer ────────────────────────────────────────────────────────────────

describe("publishQueueReducer", () => {
  const empty = { entries: [] };
  const entry = { id: "abc", topic: "t", baseUrl: "http://x", body: "hi", title: "", priority: 3, tags: "", state: "sending" };

  it("ADD_ENTRY — entry appears with correct state", () => {
    const next = publishQueueReducer(empty, { type: "ADD_ENTRY", entry });
    expect(next.entries).toHaveLength(1);
    expect(next.entries[0]).toEqual(entry);
  });

  it("CLEAR_ENTRY — entry removed from state", () => {
    const withEntry = { entries: [entry] };
    const next = publishQueueReducer(withEntry, { type: "CLEAR_ENTRY", id: "abc" });
    expect(next.entries).toHaveLength(0);
  });

  it("MARK_FAILED — entry state is 'failed'", () => {
    const withEntry = { entries: [entry] };
    const next = publishQueueReducer(withEntry, { type: "MARK_FAILED", id: "abc" });
    expect(next.entries[0].state).toBe("failed");
  });

  it("SET_QUEUED — entry state is 'queued'", () => {
    const withEntry = { entries: [entry] };
    const next = publishQueueReducer(withEntry, { type: "SET_QUEUED", id: "abc" });
    expect(next.entries[0].state).toBe("queued");
  });

  it("SET_SENDING — entry state is 'sending'", () => {
    const failedEntry = { ...entry, state: "failed" };
    const withEntry = { entries: [failedEntry] };
    const next = publishQueueReducer(withEntry, { type: "SET_SENDING", id: "abc" });
    expect(next.entries[0].state).toBe("sending");
  });

  it("unknown action returns unchanged state", () => {
    const next = publishQueueReducer(empty, { type: "UNKNOWN" });
    expect(next).toBe(empty);
  });
});

// ─── Provider behaviour ─────────────────────────────────────────────────────

describe("PublishQueueProvider", () => {
  let container;
  let root;
  let capturedCtx = null;

  const Probe = () => {
    capturedCtx = usePublishQueue();
    return null;
  };

  beforeEach(() => {
    capturedCtx = null;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  it("enqueue() calls api.publish() with correct args", async () => {
    const { default: api } = await import("@/app/Api");
    api.publish.mockResolvedValue(undefined);

    await act(async () => {
      root.render(
        <PublishQueueProvider>
          <Probe />
        </PublishQueueProvider>
      );
    });

    await act(async () => {
      capturedCtx.enqueue({ baseUrl: "http://x", topic: "mytopic", title: "T", body: "B", priority: 3, tags: "" });
    });

    expect(api.publish).toHaveBeenCalledWith(
      "http://x",
      "mytopic",
      "B",
      { title: "T", priority: undefined, tags: undefined }
    );
  });

  it("on api.publish() resolve → entry is removed (CLEAR_ENTRY)", async () => {
    const { default: api } = await import("@/app/Api");
    api.publish.mockResolvedValue(undefined);

    await act(async () => {
      root.render(
        <PublishQueueProvider>
          <Probe />
        </PublishQueueProvider>
      );
    });

    await act(async () => {
      capturedCtx.enqueue({ baseUrl: "http://x", topic: "t", title: "", body: "B", priority: 3, tags: "" });
    });

    // Allow the async publish to complete
    await act(async () => {});

    expect(capturedCtx.queue).toHaveLength(0);
  });

  it("on api.publish() reject → entry state becomes 'failed'", async () => {
    const { default: api } = await import("@/app/Api");
    api.publish.mockRejectedValue(new Error("network error"));

    await act(async () => {
      root.render(
        <PublishQueueProvider>
          <Probe />
        </PublishQueueProvider>
      );
    });

    await act(async () => {
      capturedCtx.enqueue({ baseUrl: "http://x", topic: "t", title: "", body: "B", priority: 3, tags: "" });
    });

    await act(async () => {});

    expect(capturedCtx.queue[0].state).toBe("failed");
  });

  it("retry() re-calls api.publish() with same id and dispatches SET_SENDING", async () => {
    const { default: api } = await import("@/app/Api");
    api.publish.mockRejectedValueOnce(new Error("fail")).mockResolvedValue(undefined);

    await act(async () => {
      root.render(
        <PublishQueueProvider>
          <Probe />
        </PublishQueueProvider>
      );
    });

    await act(async () => {
      capturedCtx.enqueue({ baseUrl: "http://x", topic: "t", title: "", body: "B", priority: 3, tags: "" });
    });

    await act(async () => {});
    expect(capturedCtx.queue[0].state).toBe("failed");

    const failedId = capturedCtx.queue[0].id;

    await act(async () => {
      capturedCtx.retry(failedId);
    });

    await act(async () => {});

    // After successful retry the entry is cleared
    expect(capturedCtx.queue).toHaveLength(0);
    expect(api.publish).toHaveBeenCalledTimes(2);
  });

  it("dismiss() dispatches CLEAR_ENTRY without API call", async () => {
    const { default: api } = await import("@/app/Api");
    api.publish.mockRejectedValue(new Error("fail"));

    await act(async () => {
      root.render(
        <PublishQueueProvider>
          <Probe />
        </PublishQueueProvider>
      );
    });

    await act(async () => {
      capturedCtx.enqueue({ baseUrl: "http://x", topic: "t", title: "", body: "B", priority: 3, tags: "" });
    });

    await act(async () => {});
    expect(capturedCtx.queue[0].state).toBe("failed");

    const failedId = capturedCtx.queue[0].id;
    const publishCallCount = api.publish.mock.calls.length;

    await act(async () => {
      capturedCtx.dismiss(failedId);
    });

    expect(capturedCtx.queue).toHaveLength(0);
    expect(api.publish).toHaveBeenCalledTimes(publishCallCount); // no additional call
  });
});

// ─── Guard hook ─────────────────────────────────────────────────────────────

describe("usePublishQueue guard", () => {
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

  it("throws when rendered outside <PublishQueueProvider>", () => {
    const origError = console.error;
    console.error = vi.fn();

    const TestHook = () => {
      usePublishQueue();
      return null;
    };

    expect(() => {
      act(() => root.render(<TestHook />));
    }).toThrow("usePublishQueue() must be used inside <PublishQueueProvider>");

    console.error = origError;
  });
});
