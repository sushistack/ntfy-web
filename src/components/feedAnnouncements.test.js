import { describe, expect, it } from "vitest";
import { findArrivingNotifications } from "./feedAnnouncements";

describe("findArrivingNotifications", () => {
  it("ignores rows already present during initial load or pagination", () => {
    const notifications = [
      { id: "existing", new: 1 },
      { id: "historical", new: 0 },
    ];

    expect(findArrivingNotifications(notifications, new Set(["existing", "historical"]))).toEqual([]);
  });

  it("returns only unseen notifications marked as newly arrived", () => {
    const notifications = [
      { id: "existing", new: 1 },
      { id: "arrival", new: 1 },
      { id: "persisted-own-message", new: 0 },
    ];

    expect(findArrivingNotifications(notifications, new Set(["existing"]))).toEqual([{ id: "arrival", new: 1 }]);
  });
});
