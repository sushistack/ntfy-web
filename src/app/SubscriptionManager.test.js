/**
 * Characterization tests for Dexie dedup and time ordering.
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

  // ntfy sends sequence_id: null for normal messages, so sequenceId falls back to the random message id.
  // `time` is server-assigned for both WebSocket and poll rows, so it is the reliable order.
  it("getNotifications: newest server time first, whatever the (random) ids and arrival order", async () => {
    const sub = { id: "sub1", baseUrl: "http://ntfy.sh", topic: "test", mutedUntil: 0, last: null };
    await db.subscriptions.put(sub);

    await sm.addNotification("sub1", makeMessage({ id: "zzzOlder", time: 1000, sequence_id: null }));
    await sm.addNotifications("sub1", [makeMessage({ id: "aaaNewer", time: 1001, sequence_id: null })]);

    const notifications = await sm.getNotifications("sub1");
    expect(notifications.map((n) => n.id)).toEqual(["aaaNewer", "zzzOlder"]);
  });

  it("getAllNotifications: newest server time first across all subscriptions", async () => {
    await db.subscriptions.put({ id: "sub1", baseUrl: "http://ntfy.sh", topic: "a", mutedUntil: 0, last: null });
    await db.subscriptions.put({ id: "sub2", baseUrl: "http://ntfy.sh", topic: "b", mutedUntil: 0, last: null });

    await sm.addNotification("sub1", makeMessage({ id: "zzz", time: 900, sequence_id: null }));
    await sm.addNotifications("sub2", [makeMessage({ id: "aaa", time: 999, sequence_id: null })]);

    const all = await sm.getAllNotifications();
    expect(all.map((n) => n.id)).toEqual(["aaa", "zzz"]);
  });
});
