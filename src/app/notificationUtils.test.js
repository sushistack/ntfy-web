import { describe, it, expect } from "vitest";
import { summarizeCard, formatMessage } from "./notificationUtils";

describe("summarizeCard", () => {
  it("flattens a kv card to lines", () => {
    const raw = JSON.stringify({
      type: "kv",
      rows: [
        { key: "Service", value: "anytype-heart" },
        { key: "Newest", value: "15h old" },
      ],
    });
    expect(summarizeCard(raw)).toBe("Service: anytype-heart\nNewest: 15h old");
  });

  it("flattens sections (kv + list + markdown)", () => {
    const raw = JSON.stringify({
      type: "sections",
      blocks: [
        { type: "markdown", text: "Backup stale" },
        { type: "kv", rows: [{ key: "Status", value: "error" }] },
        { type: "list", items: ["check logs"] },
      ],
    });
    expect(summarizeCard(raw)).toBe("Backup stale\nStatus: error\n• check logs");
  });

  it("returns null for non-JSON or empty", () => {
    expect(summarizeCard("hello world")).toBeNull();
    expect(summarizeCard(JSON.stringify({ type: "kv", rows: [] }))).toBeNull();
  });

  it("formatMessage uses the summary for card-tagged messages", () => {
    const msg = {
      title: "Backup stale",
      tags: ["card"],
      message: JSON.stringify({ type: "kv", rows: [{ key: "Service", value: "x" }] }),
    };
    expect(formatMessage(msg)).toBe("Service: x");
  });

  it("formatMessage leaves normal messages untouched", () => {
    expect(formatMessage({ title: "t", message: "hi", tags: [] })).toBe("hi");
  });
});
