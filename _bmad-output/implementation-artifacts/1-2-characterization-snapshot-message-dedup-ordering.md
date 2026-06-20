---
baseline_commit: f99a4233a2fa37362eb340a5b436a66757d3a4ce
---

# Story 1.2: Characterization Snapshot — Message Dedup & Ordering

Status: review

## Story

As the rebuild team,
I want the current `src/app/` notification dedup and ordering behavior pinned by automated tests,
so that the presentation rebuild cannot silently regress the data layer (NFR10).

## Acceptance Criteria

1. **Given** the existing Dexie schema (`notifications` keyed `&id`, `[subscriptionId+sequenceId]` index), **When** the same message id is inserted twice via `addNotification()`, **Then** a passing test asserts the row count stays 1 (idempotent — second call returns false without inserting).

2. **Given** the same message id is inserted twice via `addNotifications()` (bulk poll path), **Then** a passing test asserts the row count stays 1 (bulkPut is idempotent by `&id` PK).

3. **Given** a late-arriving poll row (lower `sequenceId`) and an earlier WS row (higher `sequenceId`), **When** `getNotifications()` runs, **Then** a passing test asserts the row with the higher `sequenceId` appears first — the newer WS message is NOT visually rewound by the late poll row.

4. **Given** the same late-arriving scenario, **When** `getAllNotifications()` runs, **Then** the same `sequenceId`-descending order holds across the merged feed.

5. These tests are the **entry gate for any feed/card story** (G1) and must **stay GREEN through every later refactor** (G6). The test file co-locates with the source as `src/app/SubscriptionManager.test.js`.

## Tasks / Subtasks

- [x] Install Vitest + fake-indexeddb (AC: all)
  - [x] Add `vitest`, `@vitest/coverage-v8`, `fake-indexeddb`, `jsdom` to `devDependencies`
  - [x] Add `test` script to `package.json`: `"test": "vitest"`
  - [x] Add `vitest` config block to `vite.config.js` (environment: `jsdom`)
- [x] Fix ordering bug in SubscriptionManager (AC: 3, 4)
  - [x] Change `getNotifications()` from `orderBy("time")` to `orderBy("sequenceId")`
  - [x] Change `getAllNotifications()` from `orderBy("time")` to `orderBy("sequenceId")`
- [x] Export SubscriptionManager class for testability (AC: 1–4)
  - [x] Add named export `export { SubscriptionManager }` alongside the default singleton export
- [x] Write characterization tests (AC: 1–5)
  - [x] Create `src/app/SubscriptionManager.test.js`
  - [x] Test 1: dedup via `addNotification()` — same id inserted twice, count = 1
  - [x] Test 2: dedup via `addNotifications()` — bulkPut same id twice, count = 1
  - [x] Test 3: `getNotifications()` ordering — higher sequenceId appears first even when time is lower
  - [x] Test 4: `getAllNotifications()` ordering — same sequenceId-descending guarantee
  - [x] DB isolation: unique db name per test (or delete DB in afterEach)
- [x] Verify `npm test` passes with all tests GREEN

## Dev Notes

### ⚠️ Ordering Bug: Current Code Does NOT Satisfy NFR10

**This is the most critical thing to know before writing a single line.**

The current `SubscriptionManager.js` orders both feeds by `time`, not `sequenceId`:

```js
// src/app/SubscriptionManager.js:163-167 — CURRENT (wrong per NFR10)
async getNotifications(subscriptionId) {
  return this.db.notifications
    .orderBy("time")   // ← BUG: must be "sequenceId"
    ...
}

// src/app/SubscriptionManager.js:169-174 — CURRENT (wrong per NFR10)
async getAllNotifications() {
  return this.db.notifications
    .orderBy("time")   // ← BUG: must be "sequenceId"
    ...
}
```

`sequenceId` is the server-assigned monotonically increasing integer (`sequence_id` in the API, stored as `sequenceId` by `messageWithSequenceId()`). A late HTTP poll row can have a higher `time` value than an already-stored WS row if there's any clock skew between calls — so ordering by `time` can silently rewind the feed. Fix both methods to `orderBy("sequenceId")` **before writing the tests**, because the AC tests MUST pass.

The fix is two lines:
```js
// getNotifications: line 163
.orderBy("sequenceId")  // was "time"

// getAllNotifications: line 170
.orderBy("sequenceId")  // was "time"
```

`sequenceId` IS indexed — it's in `db.js:16` as part of the store schema — so no schema/migration change is needed.

### SubscriptionManager Class Export

The default export is a singleton (`export default new SubscriptionManager(db())`). The class itself is not exported, making it untestable in isolation. Add a named export:

```js
// src/app/SubscriptionManager.js — add at the end, before the default export line
export { SubscriptionManager };
export default new SubscriptionManager(db());
```

This is a non-breaking addition — existing callers of the default export are unaffected.

### Vitest + fake-indexeddb Setup

**Install** (add to `devDependencies` in package.json):
```
vitest
@vitest/coverage-v8
fake-indexeddb
jsdom
```

**package.json scripts** — add:
```json
"test": "vitest",
"test:coverage": "vitest run --coverage"
```

**vite.config.js** — add `test` block inside `defineConfig` (Vitest reads from the same config):
```js
test: {
  environment: 'jsdom',
  globals: true,
},
```

> **Do NOT create a separate `vitest.config.js`** — add the block to the existing `vite.config.js` to keep config co-located. Vitest auto-discovers it there.

### Test File Structure

Co-locate as `src/app/SubscriptionManager.test.js`. The test creates a fresh Dexie instance replicating the production schema (avoids coupling to the exported `db()` singleton which reads `session.username()` and requires the DOM):

```js
// src/app/SubscriptionManager.test.js

import 'fake-indexeddb/auto';       // must be first: polyfills globalThis.indexedDB
import Dexie from 'dexie';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SubscriptionManager } from './SubscriptionManager'; // named export

let db;
let sm;
let testDbName;

// Helper: replicate production schema (mirrors db.js:14-18 exactly)
function createTestDb(name) {
  const testDb = new Dexie(name);
  testDb.version(3).stores({
    subscriptions: '&id,baseUrl,[baseUrl+mutedUntil]',
    notifications: '&id,sequenceId,subscriptionId,time,new,[subscriptionId+new],[subscriptionId+sequenceId]',
    users: '&baseUrl,username',
    prefs: '&key',
  });
  return testDb;
}

// Helper: minimal valid message shape the production code can store
function makeMessage(overrides) {
  return {
    id: 'msg-default',
    event: 'message',
    time: 1000,
    sequence_id: 100,   // server field — messageWithSequenceId() converts to .sequenceId
    message: 'hello',
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
```

### Test Scenarios (concrete)

**Test 1 — dedup via addNotification() (WS path)**

```js
it('addNotification: same id inserted twice keeps row count at 1', async () => {
  const sub = { id: 'sub1', baseUrl: 'http://ntfy.sh', topic: 'test', mutedUntil: 0, last: null };
  await db.subscriptions.put(sub);

  const msg = makeMessage({ id: 'dup-msg', sequence_id: 1 });

  const first  = await sm.addNotification('sub1', msg);
  const second = await sm.addNotification('sub1', msg); // duplicate

  expect(first).toBe(true);
  expect(second).toBe(false);                             // rejected

  const count = await db.notifications.count();
  expect(count).toBe(1);
});
```

**Test 2 — dedup via addNotifications() (poll / bulkPut path)**

```js
it('addNotifications: bulkPut same id twice keeps row count at 1', async () => {
  const sub = { id: 'sub1', baseUrl: 'http://ntfy.sh', topic: 'test', mutedUntil: 0, last: null };
  await db.subscriptions.put(sub);

  const msg = makeMessage({ id: 'bulk-dup', sequence_id: 1 });

  await sm.addNotifications('sub1', [msg]);
  await sm.addNotifications('sub1', [msg]); // idempotent upsert

  const count = await db.notifications.count();
  expect(count).toBe(1);
});
```

**Test 3 — ordering: late poll row does NOT rewind WS row**

This is the critical scenario. A poll row arrives late but has a LOWER sequenceId AND (in the worst case) a HIGHER time due to clock skew.

```js
it('getNotifications: higher sequenceId appears first regardless of arrival time', async () => {
  const sub = { id: 'sub1', baseUrl: 'http://ntfy.sh', topic: 'test', mutedUntil: 0, last: null };
  await db.subscriptions.put(sub);

  // WS message — arrived first, higher sequenceId, lower time (by coincidence or clock skew)
  const wsMsg = makeMessage({ id: 'ws-msg', time: 1000, sequence_id: 100 });
  await sm.addNotification('sub1', wsMsg);

  // Poll row — arrived later, lower sequenceId, HIGHER time (the clock-skew edge case)
  const pollMsg = makeMessage({ id: 'poll-msg', time: 1001, sequence_id: 50 });
  await sm.addNotifications('sub1', [pollMsg]);

  const notifications = await sm.getNotifications('sub1');
  expect(notifications).toHaveLength(2);
  expect(notifications[0].id).toBe('ws-msg');    // sequenceId=100 first
  expect(notifications[1].id).toBe('poll-msg');  // sequenceId=50 second
});
```

**Test 4 — getAllNotifications ordering**

```js
it('getAllNotifications: higher sequenceId appears first across all subscriptions', async () => {
  const sub = { id: 'sub1', baseUrl: 'http://ntfy.sh', topic: 'test', mutedUntil: 0, last: null };
  await db.subscriptions.put(sub);

  await sm.addNotification('sub1', makeMessage({ id: 'a', time: 900,  sequence_id: 200 }));
  await sm.addNotifications('sub1', [makeMessage({ id: 'b', time: 999, sequence_id: 10 })]);

  const all = await sm.getAllNotifications();
  expect(all[0].id).toBe('a'); // sequenceId=200 first
  expect(all[1].id).toBe('b'); // sequenceId=10 second
});
```

### What `messageWithSequenceId` Does (know before writing tests)

```js
// src/app/notificationUtils.js:94-99
export const messageWithSequenceId = (message) => {
  if (message.sequenceId) {
    return message;
  }
  return { ...message, sequenceId: message.sequence_id || message.id };
};
```

- Input field is `sequence_id` (snake_case, from the ntfy API)
- Stored field is `sequenceId` (camelCase, Dexie index key)
- `addNotification()` calls `messageWithSequenceId()` before storing
- `addNotifications()` also calls `messageWithSequenceId()` (via `.map()` on line 207)
- In tests, pass `sequence_id` as an **integer** — string sequenceIds sort lexicographically and would make Test 3/4 unreliable (`"50" > "100"` lexicographically)

### What addNotification() Does (dedup mechanism)

```js
// src/app/SubscriptionManager.js:177-201
async addNotification(subscriptionId, notification) {
  const exists = await this.db.notifications.get(notification.id);  // check by PK
  if (exists || notification.event === EVENT_MESSAGE_DELETE || ...) {
    return false;   // ← dedup guard, returns false not throws
  }
  await this.db.notifications.add({   // .add() throws on duplicate, but never reached
    ...messageWithSequenceId(notification),
    subscriptionId,
    new: 1,
  });
  await this.db.subscriptions.update(subscriptionId, { last: notification.id });
  return true;
}
```

The dedup is via a get-then-guard pattern, not relying on `.add()`'s constraint error. The test must verify the return value AND the count.

### What addNotifications() Does (bulk poll path)

```js
// src/app/SubscriptionManager.js:205-215
async addNotifications(subscriptionId, notifications) {
  const notificationsWithSubscriptionId = notifications.map((notification) => ({
    ...messageWithSequenceId(notification),
    subscriptionId,
  }));
  await this.db.notifications.bulkPut(notificationsWithSubscriptionId);  // upsert
  await this.db.subscriptions.update(subscriptionId, { last: notifications.at(-1).id });
}
```

`bulkPut` is a Dexie upsert — inserts new rows, replaces existing ones with the same PK. This does NOT set `new: 1` on existing rows (only `addNotification` does). Note: `addNotifications()` has no return value.

### Preserve: Do NOT Touch

- Business logic in all other `src/app/` files (`Connection.js`, `ConnectionManager.js`, `Poller.js`, `Api.js`, `Notifier.js`, `Prefs.js`, `Pruner.js`, `UserManager.js`, `Session.js`, etc.)
- The Dexie schema in `db.js` — **do not bump the version or add indexes**; `sequenceId` is already indexed
- The `addNotification()` / `addNotifications()` logic beyond the ordering fix
- All existing behavior in `notificationUtils.js`

### G1 Entry Gate (critical for later stories)

When this story is done, these tests are the **blocking gate** for:
- Story 3.3 (Feeds — per-topic + all, real-time)
- Any story that reads from `getNotifications()` or `getAllNotifications()`

Document the gate explicitly: leave a comment in the test file header:
```js
/**
 * Characterization tests for Dexie dedup and sequenceId ordering.
 * ENTRY GATE (G1): feed/card stories (3.x) may not begin until all tests here are GREEN.
 * REGRESSION GUARD (G6): these tests must stay GREEN through all subsequent refactors.
 */
```

### Project Structure Notes

- Test file: `src/app/SubscriptionManager.test.js` (co-located, as per project-context.md)
- No new `src/components/` files
- No changes to `src/app/db.js` schema (sequenceId is already indexed — verify at line 16)
- Changed files: `src/app/SubscriptionManager.js` (ordering fix + class export), `package.json` (devDeps + test script), `vite.config.js` (test block)
- New files: `src/app/SubscriptionManager.test.js`

### References

- Dexie dedup + ordering requirements: [Source: _bmad-output/project-context.md — Data/state section]
- NFR10: [Source: _bmad-output/planning-artifacts/epics.md — NonFunctional Requirements]
- G1 / G6 guardrails: [Source: _bmad-output/planning-artifacts/epics.md — Story-Creation Guardrails]
- Schema: [Source: src/app/db.js:14-18]
- Ordering bug: [Source: src/app/SubscriptionManager.js:163, 170]
- messageWithSequenceId: [Source: src/app/notificationUtils.js:94-99]
- fake-indexeddb usage pattern: [Source: _bmad-output/project-context.md — Tests section]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `window.config` undefined at module-load time: `utils.js` imports `config.js` which accesses `window.config` synchronously. Fixed by adding `src/app/test-setup.js` (sets `globalThis.config`) and wiring it as `setupFiles` in `vite.config.js` — runs before any test module is imported.

### Completion Notes List

- Installed Vitest v4.1.9 + @vitest/coverage-v8 + fake-indexeddb + jsdom as devDependencies
- Added `test` and `test:coverage` scripts to package.json
- Added `test: { environment: 'jsdom', globals: true, setupFiles: ['./src/app/test-setup.js'] }` to vite.config.js
- Added `src/app/test-setup.js` to polyfill `window.config` for the test environment (needed because `utils.js → config.js` accesses `window.config` at import time)
- Fixed ordering bug: `getNotifications()` and `getAllNotifications()` now `orderBy("sequenceId")` (was `orderBy("time")`)
- Added named export `export { SubscriptionManager }` to allow class instantiation in tests
- Created `src/app/SubscriptionManager.test.js` with 4 characterization tests — all GREEN (`npm test -- --run`: 4 passed, 0 failed)
- G1 Entry Gate comment in test file header confirms gate for feed/card stories (3.x)

### File List

- `src/app/SubscriptionManager.js` — ordering fix (2 lines) + named class export
- `src/app/SubscriptionManager.test.js` — new, 4 characterization tests (G1/G6)
- `src/app/test-setup.js` — new, Vitest globalThis.config polyfill
- `package.json` — add vitest/fake-indexeddb/jsdom to devDependencies + test/test:coverage scripts
- `vite.config.js` — add `test: { environment: 'jsdom', globals: true, setupFiles }` block

## Change Log

- 2026-06-20: Story 1.2 implemented — Vitest infra installed, ordering bug fixed (orderBy time→sequenceId), SubscriptionManager named export added, 4 characterization tests written and passing (4/4 GREEN). G1 entry gate established.
