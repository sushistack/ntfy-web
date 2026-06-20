import { existsSync } from "node:fs";
import { describe, it, expect } from "vitest";

describe("G5 migration cleanup gate", () => {
  it("keeps the completed migration flag module removed", () => {
    expect(existsSync(new URL("./migration.js", import.meta.url))).toBe(false);
  });
});
