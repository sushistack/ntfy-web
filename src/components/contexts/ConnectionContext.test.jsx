import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";

vi.mock("../../app/ConnectionManager", () => ({
  default: {
    registerStateListener: vi.fn(),
    resetStateListener: vi.fn(),
  },
}));

vi.mock("../../app/SubscriptionManager", () => ({
  default: {
    updateState: vi.fn(),
  },
}));

const { connectionReducer, CONN_STATES, ConnectionProvider, useConnection } = await import("./ConnectionContext.jsx");

// ─── Reducer ────────────────────────────────────────────────────────────────

describe("connectionReducer — deriveAggregateState", () => {
  const empty = { subStates: new Map(), connectionState: CONN_STATES.OFFLINE, hasData: false };

  it("returns offline when subStates is empty", () => {
    const next = connectionReducer(empty, { type: "UPDATE_SUB_STATE", subscriptionId: "a", state: "connected" });
    // After adding one connected sub, state is connected
    expect(next.connectionState).toBe(CONN_STATES.CONNECTED);
    // Remove it → offline
    const removed = connectionReducer(next, { type: "REMOVE_SUB", subscriptionId: "a" });
    expect(removed.connectionState).toBe(CONN_STATES.OFFLINE);
  });

  it("returns connected when any subscription is connected", () => {
    let s = connectionReducer(empty, { type: "UPDATE_SUB_STATE", subscriptionId: "a", state: "connected" });
    s = connectionReducer(s, { type: "UPDATE_SUB_STATE", subscriptionId: "b", state: "connecting" });
    expect(s.connectionState).toBe(CONN_STATES.CONNECTED);
  });

  it("returns connecting when a sub is connecting but was never connected", () => {
    const s = connectionReducer(empty, { type: "UPDATE_SUB_STATE", subscriptionId: "a", state: "connecting" });
    expect(s.connectionState).toBe(CONN_STATES.CONNECTING);
  });

  it("returns reconnecting when sub was once connected, now connecting", () => {
    let s = connectionReducer(empty, { type: "UPDATE_SUB_STATE", subscriptionId: "a", state: "connected" });
    s = connectionReducer(s, { type: "UPDATE_SUB_STATE", subscriptionId: "a", state: "connecting" });
    expect(s.connectionState).toBe(CONN_STATES.RECONNECTING);
  });

  it("returns offline when all connecting subs are removed", () => {
    let s = connectionReducer(empty, { type: "UPDATE_SUB_STATE", subscriptionId: "a", state: "connecting" });
    s = connectionReducer(s, { type: "REMOVE_SUB", subscriptionId: "a" });
    expect(s.connectionState).toBe(CONN_STATES.OFFLINE);
  });

  it("SET_HAS_DATA updates hasData flag", () => {
    const s = connectionReducer(empty, { type: "SET_HAS_DATA", hasData: true });
    expect(s.hasData).toBe(true);
  });
});

// ─── Guard hook ─────────────────────────────────────────────────────────────

describe("useConnection guard", () => {
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

  it("throws when rendered outside <ConnectionProvider>", () => {
    const origError = console.error;
    console.error = vi.fn(); // suppress React boundary noise

    const TestHook = () => {
      useConnection();
      return null;
    };

    expect(() => {
      act(() => root.render(<TestHook />));
    }).toThrow("useConnection() must be used inside <ConnectionProvider>");

    console.error = origError;
  });
});
