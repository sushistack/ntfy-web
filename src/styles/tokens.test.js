import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const tokensCss = readFileSync(`${process.cwd()}/src/styles/tokens.css`, "utf8");
const tokenManifest = readFileSync(`${process.cwd()}/design-tokens.md`, "utf8");
const lightTheme = tokensCss.match(/@theme\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";

const tokenValue = (name) => {
  const match = lightTheme.match(new RegExp(`--color-${name}:\\s*(#[0-9A-Fa-f]{6})`));
  if (!match) throw new Error(`Missing light-theme color token: ${name}`);
  return match[1];
};

const luminance = (hex) => {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    .map((channel) => parseInt(channel, 16) / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrast = (first, second) => {
  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
};

describe("light-theme WCAG contrast tokens", () => {
  it.each([
    ["text", "surface", 4.5],
    ["text", "bg", 4.5],
    ["muted", "surface", 4.5],
    ["muted", "bg", 4.5],
    ["accent-text", "surface", 4.5],
    ["accent-text", "bg", 4.5],
    ["accent-text", "surface-2", 4.5],
    ["topic-chip-text", "topic-chip-bg", 4.5],
    ["button-fill-text", "button-fill", 4.5],
    ["priority-urgent", "surface", 4.5],
    ["priority-urgent", "surface-2", 4.5],
    ["accent-ui", "surface", 3],
    ["accent-ui", "bg", 3],
    ["focus-ring", "surface", 3],
    ["focus-ring", "bg", 3],
    ["control-border", "surface", 3],
    ["control-border", "bg", 3],
    ["control-border", "surface-2", 3],
    ["priority-high", "surface", 3],
    ["priority-high", "bg", 3],
    ["priority-max", "surface", 3],
    ["priority-max", "bg", 3],
    ["meter-ok", "meter-track", 3],
    ["meter-warning", "meter-track", 3],
    ["meter-critical", "meter-track", 3],
  ])("%s on %s clears %s:1", (foreground, background, minimum) => {
    expect(contrast(tokenValue(foreground), tokenValue(background))).toBeGreaterThanOrEqual(minimum);
  });

  it.each([
    ["accent-on-surface", "accent-ui"],
    ["priority-high-on-surface", "priority-high"],
    ["priority-max-on-surface", "priority-max"],
  ])("%s clears 4.5:1 on %s", (foreground, background) => {
    expect(contrast(tokenValue(foreground), tokenValue(background))).toBeGreaterThanOrEqual(4.5);
  });

  it("contains no provisional marker syntax in token sources", () => {
    expect(tokensCss).not.toMatch(/\[ASSUMPTION\]/);
    expect(tokenManifest).not.toMatch(/`\[A\]`|\s\[A\]/);
  });
});
