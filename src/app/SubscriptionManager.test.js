/**
 * Characterization tests for Dexie dedup and sequenceId ordering.
 * ENTRY GATE (G1): feed/card stories (3.x) may not begin until all tests here are GREEN.
 * REGRESSION GUARD (G6): these tests must stay GREEN through all subsequent refactors.
 */

import "fake-indexeddb/auto"; // must be first: polyfills globalThis.indexedDB
import Dexie from "dexie";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SubscriptionManager } from "./SubscriptionManager";

let db;
let sm;
let testDbName;

// Helper: replicate production schema (mirrors db.js:14-18 exactly)
function createTestDb(name) {
  const testDb = new Dexie(name);
  testDb.version(3).stores({
    subscriptions: "&id,baseUrl,[baseUrl+mutedUntil]",
    notifications: "&id,sequenceId,subscriptionId,time,new,[subscriptionId+new],[subscriptionId+sequenceId]",
    users: "&baseUrl,username",
    prefs: "&key",
  });
  return testDb;
}

// Helper: minimal valid message shape the production code can store
function makeMessage(overrides) {
  return {
    id: "msg-default",
    event: "message",
    time: 1000,
    sequence_id: 100, // server field — messageWithSequenceId() converts to .sequenceId
    message: "hello",
    ...overrides,
  };
}

beforeEach(() => {
  testDbName = `ntfy-test-${Math.random()}`; // unique per test → no state leakage
  db = createTestDb(testDbName);
  sm = new SubscriptionManager(db);
});

afterEach(async () => {
  await db.close();
  // fake-indexeddb resets between require() calls but unique names also guarantee isolation
});

describe("SubscriptionManager dedup and ordering", () => {
  it("addNotification: same id inserted twice keeps row count at 1", async () => {
    const sub = { id: "sub1", baseUrl: "http://ntfy.sh", topic: "test", mutedUntil: 0, last: null };
    await db.subscriptions.put(sub);

    const msg = makeMessage({ id: "dup-msg", sequence_id: 1 });

    const first = await sm.addNotification("sub1", msg);
    const second = await sm.addNotification("sub1", msg); // duplicate

    expect(first).toBe(true);
    expect(second).toBe(false); // rejected

    const count = await db.notifications.count();
    expect(count).toBe(1);
  });

  it("addNotifications: bulkPut same id twice keeps row count at 1", async () => {
    const sub = { id: "sub1", baseUrl: "http://ntfy.sh", topic: "test", mutedUntil: 0, last: null };
    await db.subscriptions.put(sub);

    const msg = makeMessage({ id: "bulk-dup", sequence_id: 1 });

    await sm.addNotifications("sub1", [msg]);
    await sm.addNotifications("sub1", [msg]); // idempotent upsert

    const count = await db.notifications.count();
    expect(count).toBe(1);
  });

  it("getNotifications: higher sequenceId appears first regardless of arrival time", async () => {
    const sub = { id: "sub1", baseUrl: "http://ntfy.sh", topic: "test", mutedUntil: 0, last: null };
    await db.subscriptions.put(sub);

    // WS message — arrived first, higher sequenceId, lower time (by coincidence or clock skew)
    const wsMsg = makeMessage({ id: "ws-msg", time: 1000, sequence_id: 100 });
    await sm.addNotification("sub1", wsMsg);

    // Poll row — arrived later, lower sequenceId, HIGHER time (the clock-skew edge case)
    const pollMsg = makeMessage({ id: "poll-msg", time: 1001, sequence_id: 50 });
    await sm.addNotifications("sub1", [pollMsg]);

    const notifications = await sm.getNotifications("sub1");
    expect(notifications).toHaveLength(2);
    expect(notifications[0].id).toBe("ws-msg"); // sequenceId=100 first
    expect(notifications[1].id).toBe("poll-msg"); // sequenceId=50 second
  });

  it("getAllNotifications: higher sequenceId appears first across all subscriptions", async () => {
    const sub = { id: "sub1", baseUrl: "http://ntfy.sh", topic: "test", mutedUntil: 0, last: null };
    await db.subscriptions.put(sub);

    await sm.addNotification("sub1", makeMessage({ id: "a", time: 900, sequence_id: 200 }));
    await sm.addNotifications("sub1", [makeMessage({ id: "b", time: 999, sequence_id: 10 })]);

    const all = await sm.getAllNotifications();
    expect(all[0].id).toBe("a"); // sequenceId=200 first
    expect(all[1].id).toBe("b"); // sequenceId=10 second
  });
});
