import { describe, it, expect } from "vitest";
import { groupIncidents, normalizeTitle, slotsForDay, dayStart, QUIET_AFTER_SECONDS, SLOT_SECONDS } from "./incidents";

const NOW = 1_800_000_000;
let seq = 0;
const nextId = () => {
  seq += 1;
  return `n${seq}`;
};
const n = (title, ago, extra = {}) => ({
  id: nextId(),
  subscriptionId: "sub-a",
  time: NOW - ago,
  title,
  message: "",
  priority: 5,
  new: 0,
  ...extra,
});

describe("normalizeTitle", () => {
  it("strips Kuma UP/DOWN suffixes and numbers", () => {
    expect(normalizeTitle("Karakeep  DOWN")).toBe("karakeep");
    expect(normalizeTitle("Karakeep UP")).toBe("karakeep");
    expect(normalizeTitle("k3s-cp-1 disk at 82%")).toBe(normalizeTitle("k3s-cp-1 disk at 91%"));
  });
});

describe("groupIncidents", () => {
  it("collapses repeated firings into one open incident", () => {
    const list = [0, 900, 1800].map((ago) => n("🥪 Backup stale: anytype", ago));
    const [inc] = groupIncidents(list, NOW);
    expect(inc.state).toBe("open");
    expect(inc.firings).toHaveLength(3);
    expect(inc.first).toBe(NOW - 1800);
    expect(inc.last).toBe(NOW);
  });

  it("starts 'since' at the latest unbroken run, not the first ever firing", () => {
    const list = [n("Disk at 81%", 0), n("Disk at 80%", 900), n("Disk at 80%", 86400)];
    const [inc] = groupIncidents(list, NOW);
    expect(inc.first).toBe(NOW - 86400);
    expect(inc.since).toBe(NOW - 900);
  });

  it("marks an incident quiet once it stops re-firing", () => {
    const [inc] = groupIncidents([n("Backup stale: anytype", QUIET_AFTER_SECONDS + 60)], NOW);
    expect(inc.state).toBe("quiet");
  });

  it("resolves a Kuma DOWN followed by UP and keeps the DOWN title", () => {
    const [inc] = groupIncidents([n("Karakeep DOWN", 600), n("Karakeep UP", 300, { priority: 3 })], NOW);
    expect(inc.state).toBe("resolved");
    expect(inc.title).toBe("Karakeep DOWN");
    expect(inc.firings).toEqual([NOW - 600]);
    expect(inc.resolvedAt).toBe(NOW - 300);
  });

  it("treats UP as the later message when DOWN and UP share a second", () => {
    const [inc] = groupIncidents([n("Webapp UP", 0, { priority: 3 }), n("Webapp DOWN", 0)], NOW);
    expect(inc.state).toBe("resolved");
  });

  it("treats low-priority one-offs as info", () => {
    const [inc] = groupIncidents([n("Daily summary", 60, { priority: 3 })], NOW);
    expect(inc.state).toBe("info");
  });

  it("keeps the same title on different topics apart", () => {
    const list = [n("Disk at 80%", 0), n("Disk at 80%", 0, { subscriptionId: "sub-b" })];
    expect(groupIncidents(list, NOW)).toHaveLength(2);
  });

  it("falls back to the first message line when there is no title", () => {
    const [inc] = groupIncidents([n("", 0, { message: "hello\nworld", priority: 3 })], NOW);
    expect(inc.title).toBe("hello");
  });

  it("counts unread messages", () => {
    const [inc] = groupIncidents([n("X", 0, { new: 1 }), n("X", 900, { new: 1 }), n("X", 1800)], NOW);
    expect(inc.unread).toBe(2);
  });
});

describe("slotsForDay", () => {
  it("maps times to 15-minute slots of that day only", () => {
    const start = dayStart(NOW);
    const slots = slotsForDay([start, start + SLOT_SECONDS * 2 + 5, start - 1, start + 86400], start);
    expect([...slots].sort()).toEqual([0, 2]);
  });
});
