// Runs the shared parity fixtures (also used verbatim by ntfy-android's IncidentsFixtureTest),
// so the web board and the Android board group the same notifications the same way.
import { describe, it, expect } from "vitest";
import fixtures from "./incidents.fixtures.json";
import * as incidents from "./incidents";

const { groupIncidents, normalizeTitle, incidentId, slotsForDay } = incidents;

const view = (inc, today) => ({
  id: inc.id,
  key: inc.key,
  subscriptionId: inc.subscriptionId,
  title: inc.title,
  state: inc.state,
  firings: inc.firings,
  first: inc.first,
  since: inc.since,
  last: inc.last,
  resolvedAt: inc.resolvedAt,
  priority: inc.priority,
  unread: inc.unread,
  latestId: inc.latest.id,
  notificationIds: inc.notifications.map((n) => n.id),
  todaySlots: [...slotsForDay(inc.firings, today)].sort((a, b) => a - b),
  sentToday: inc.firings.filter((f) => f >= today).length,
});

describe("shared incident fixtures", () => {
  it("constants match", () => {
    for (const [name, value] of Object.entries(fixtures.constants)) expect(incidents[name], name).toBe(value);
  });

  it.each(fixtures.normalizeTitle)("normalizeTitle($in)", ({ in: input, out }) => {
    expect(normalizeTitle(input)).toBe(out);
  });

  it.each(fixtures.incidentId)("incidentId($key)", ({ key, id }) => {
    expect(incidentId(key)).toBe(id);
  });

  it.each(fixtures.cases)("$name", ({ notifications, now, today, expected }) => {
    expect(groupIncidents(notifications, now).map((inc) => view(inc, today))).toEqual(expected);
  });
});
