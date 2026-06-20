---
baseline_commit: 50645f8
---

# Story 3.2: Adaptive Card Body Renderer

Status: review

## Story

As Jay,
I want the card body to render appropriately whatever shape the message takes,
so that plain text, key-value data, and metrics all read well (FR16, UX-DR3/4).

`Depends-on:` 3.1 (NotificationCard body slot — **BLOCKING**), 1.8 (Meter ✅ exists), 1.4 (mono token ✅ exists in `tokens.css`).

**Touched files:**

| File | Action |
|---|---|
| `src/components/message/CardBody.jsx` | **CREATE NEW** — the adaptive shape detector + renderer |
| `src/components/message/MarkdownContent.jsx` | **CREATE NEW** — `useRemark` wrapper with sanitized component map |
| `src/components/message/CardBody.test.jsx` | **CREATE NEW** — unit tests including the `javascript:` security assertion |

**Do NOT touch:**
- `src/components/ui/Meter.jsx` — already built; import it, don't recreate
- `src/app/` — logic layer, ESLint-enforced boundary
- `src/components/ui/` files — primitives owned by Epic 1
- `src/styles/tokens.css` / `src/styles/main.css`
- `src/components/message/EmptyStates.jsx` — unrelated, do not modify

---

## Acceptance Criteria

1. **Given** message content,
   **when** `CardBody` inspects the message string,
   **then** it renders exactly one of the three forms — the renderer picks; Jay never toggles:
   - *Paragraph*: markdown body-sm text, clamped to ~3 lines in the card, with an in-place expand affordance (no navigation).
   - *Key-value rows*: `dt`/`dd` pairs (leading mono icon + muted label + value); bad/error values render in `text-priority-max` (coral); ok values in `text-accent-text`.
   - *Rich key-value*: `dt`/`dd` pairs with a leading mono icon, muted label, and value — **numeric or percentage values additionally render an inline `<Meter>` bar** + tabular-nums percentage label.

2. **Given** content that fails shape detection or render,
   **then** `CardBody` degrades to safe raw text (the card always survives). A failed sub-element — bad meter value, broken image — is dropped silently without crashing the card.

3. **Given** markdown paragraph content,
   **when** rendered,
   **then** `MarkdownContent` uses the `useRemark` hook (NOT `<Remark>`), keeps the existing remark plugin chain verbatim, and re-points the component map to Tailwind/`ui` prose classes — `body-sm`, `text-muted`, `font-mono` for code — **never via `dangerouslySetInnerHTML`**.

4. **Given (security — C4)** markdown containing a link with `href="javascript:alert(1)"` or `href="data:text/html,..."`,
   **when** rendered by `MarkdownContent`,
   **then** the rendered anchor element has no clickable `href` attribute (stripped or replaced with `#`/empty). Only `http://`, `https://`, and `mailto:` are allowed. A test asserts this.

5. **Given (security)** an image tag in markdown with `src="javascript:..."` or `src="data:..."`,
   **then** the `src` is stripped or replaced so no executable content loads. Only `http://` and `https://` are allowed for image sources.

---

## Tasks / Subtasks

- [x] Task 1: Create `src/components/message/MarkdownContent.jsx` (AC: #3, #4, #5)
  - [x] Import `useRemark` from `react-remark` (hook API, not component)
  - [x] Call `useRemark({ remarkToReactComponents: componentMap })` to get React content
  - [x] Build `componentMap` that re-points each element to Tailwind-styled equivalents (see Dev Notes)
  - [x] In the `a` override: sanitize `href` — allow `http:`, `https:`, `mailto:` only; strip everything else (set `href` to `undefined` or `"#"`)
  - [x] In the `img` override: sanitize `src` — allow `http:`, `https:` only; strip everything else
  - [x] Never use `dangerouslySetInnerHTML`
  - [x] Export default `MarkdownContent`

- [x] Task 2: Create `src/components/message/CardBody.jsx` (AC: #1, #2)
  - [x] Implement shape detection: inspect the `message` string to determine paragraph/kv/rich-kv (see Dev Notes for algorithm)
  - [x] Implement `ParagraphBody`: renders `<MarkdownContent>` with clamp-3 + in-place expand button
  - [x] Implement `KvBody`: renders `<dl>` of `<dt>`/`<dd>` pairs with leading mono icon; coral bad values, accent ok values; falls back per-row on parse error
  - [x] Implement `RichKvBody`: same as `KvBody` + for numeric/percentage values render `<Meter value={n} label={\`\${n}%\`} />` from `@/components/ui/Meter`
  - [x] Wrap the whole render in a try/catch → raw text fallback (AC #2)
  - [x] Drop failed sub-elements (bad meter value → just show text, broken image in markdown → `MarkdownContent` component map skips it)
  - [x] Export default `CardBody` that takes `{ notification }` (full notification object, consumed as-is)
  - [x] The expand toggle is local UI state — the one sanctioned `useState` in this component (see Dev Notes)

- [x] Task 3: Create `src/components/message/CardBody.test.jsx` (AC: #4 required, #1, #2)
  - [x] Test: `javascript:` href is stripped — rendered anchor has no clickable href
  - [x] Test: `data:` href is stripped
  - [x] Test: `https://` href passes through unchanged
  - [x] Test: paragraph message renders as `MarkdownContent`
  - [x] Test: key-value message renders a `<dl>` structure
  - [x] Test: rich key-value with `75%` value renders a `<Meter>` component
  - [x] Test: invalid message falls back to raw text, does not throw

---

## Dev Notes

### Critical Prerequisite: Story 3.1

**Story 3.1 (NotificationCard shell) must be implemented before this story.** 3.1 defines the `body` slot prop that `CardBody` plugs into. The body slot is typed in 3.1's G4 contract:

```jsx
// From 3.1 — the card body slot:
// <NotificationCard notification={n} body={<CardBody notification={n} />} />
// CardBody receives the full notification object; the card knows nothing about the body internals
```

If `NotificationCard.jsx` does not exist in `src/components/message/`, stop and complete Story 3.1 first.

---

### File Locations

```
src/components/message/
├── EmptyStates.jsx          ← exists (do NOT modify)
├── CardBody.jsx             ← CREATE — shape detector + 3 sub-renderers
├── CardBody.test.jsx        ← CREATE — includes the javascript: security test
└── MarkdownContent.jsx      ← CREATE — useRemark wrapper with sanitized component map
```

**`CardBody.jsx` and `MarkdownContent.jsx` MUST be in `src/components/message/`** — NOT in `ui/`. They are domain-aware (know the ntfy message shape). ESLint `no-restricted-paths` forbids `ui/` from importing `message/`; `message/` importing `ui/` is allowed.

---

### Existing Meter API (DO NOT recreate)

```jsx
// src/components/ui/Meter.jsx — already exists after Story 1.8
import { Meter } from "@/components/ui/Meter";

// Props:
//   value:    number  — 0–100 (clamped internally; non-finite → 0, no crash)
//   label:    string  — displayed as tabular-nums text beside the bar (optional)
//   className: string — extra classes (optional)

// Usage for a 75% reading:
<Meter value={75} label="75%" />

// The Meter already handles:
// - green ok → amber (≥65%) → coral (≥90%) fill thresholds
// - tabular-nums on the label
// - label tints coral at critical
// - 7px height, pill radius (from tokens)
// DO NOT reimplement any of this
```

---

### Shape Detection Algorithm

The message string is inspected heuristically. The goal is simple and robust — not exhaustive. Implementation judgment is allowed as long as the 3 forms are supported.

```js
// Heuristic used to select a body form
// Returns: 'paragraph' | 'kv' | 'rich-kv'
function detectShape(message) {
  if (!message || !message.trim()) return 'paragraph';

  const lines = message.trim().split('\n').filter(l => l.trim());

  // Require at least 2 lines for key-value to prevent false positives like "Title: My note"
  if (lines.length < 2) return 'paragraph';

  // All lines must be "key: value" pairs
  const kvPattern = /^[^:]+:\s*.+$/;
  const allKv = lines.every(l => kvPattern.test(l.trim()));
  if (!allKv) return 'paragraph';

  // Any value looks numeric or percentage → rich key-value
  const hasNumeric = lines.some(l => {
    const value = l.split(/:\s+(.+)/)[1]?.trim() ?? '';
    return /^\d+(\.\d+)?%$/.test(value) || /^\d+(\.\d+)?$/.test(value);
  });

  return hasNumeric ? 'rich-kv' : 'kv';
}
```

Edge cases handled by the fallback (if shape detection throws → raw text; if Meter gets a non-numeric value → `Meter` clamps to 0 internally, no crash).

---

### CardBody Component Structure

```jsx
// src/components/message/CardBody.jsx

import { useState } from "react";
import { cn } from "@/components/ui/utils";
import { Meter } from "@/components/ui/Meter";
import MarkdownContent from "./MarkdownContent";

// detectShape — see algorithm above

// ParagraphBody: markdown body with clamp + expand
const ParagraphBody = ({ message }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <div className={cn("text-body-sm text-muted", !expanded && "line-clamp-3")}>
        <MarkdownContent content={message} />
      </div>
      {/* Only show expand toggle when content is long enough to clamp */}
      {/* Use: t("card_body_expand") / t("card_body_collapse") for i18n */}
    </div>
  );
};

// KvBody: key-value rows (no meters)
const KvBody = ({ lines }) => (
  <dl className="text-body-sm space-y-1">
    {lines.map(({ key, value, isError }, i) => (
      <div key={i} className="flex items-baseline gap-2">
        <KvIcon keyName={key} />  {/* leading mono icon — see Icon section */}
        <dt className="text-muted font-medium shrink-0">{key}</dt>
        <dd className={cn("ml-auto", isError ? "text-priority-max" : "text-accent-text")}>{value}</dd>
      </div>
    ))}
  </dl>
);

// RichKvBody: key-value rows + Meter for numeric values
const RichKvBody = ({ lines }) => (
  <dl className="text-body-sm space-y-2">
    {lines.map(({ key, value, numericValue }, i) => (
      <div key={i} className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <KvIcon keyName={key} />
          <dt className="text-muted font-medium shrink-0">{key}</dt>
          <dd className="ml-auto tabular-nums">{value}</dd>
        </div>
        {numericValue !== null && (
          <Meter value={numericValue} />
        )}
      </div>
    ))}
  </dl>
);

const CardBody = ({ notification }) => {
  try {
    const { message } = notification;
    const shape = detectShape(message);

    if (shape === 'paragraph') return <ParagraphBody message={message} />;

    const lines = parseKvLines(message); // parses "key: value" → [{ key, value, numericValue, isError }]
    if (shape === 'rich-kv') return <RichKvBody lines={lines} />;
    return <KvBody lines={lines} />;
  } catch {
    // Any render failure → raw text fallback; the card always survives
    return <p className="text-body-sm text-muted whitespace-pre-wrap">{notification?.message ?? ''}</p>;
  }
};

export default CardBody;
```

---

### MarkdownContent Component (useRemark)

```jsx
// src/components/message/MarkdownContent.jsx

import { useRemark } from "react-remark";
import { useEffect } from "react";
import { cn } from "@/components/ui/utils";

// Allowed href/src schemes
const SAFE_SCHEMES = ['http://', 'https://', 'mailto:'];
const isSafeUrl = (url) => url && SAFE_SCHEMES.some(s => url.toLowerCase().startsWith(s));

// Component overrides for useRemark — re-points the remark element map
// to Tailwind/token classes. Keep the remark plugin chain verbatim.
const componentMap = {
  p: ({ children }) => <p className="text-body-sm text-muted leading-relaxed">{children}</p>,
  a: ({ href, children }) => {
    const safeHref = isSafeUrl(href) ? href : undefined;  // strip dangerous schemes
    return safeHref
      ? <a href={safeHref} target="_blank" rel="noopener noreferrer" className="text-accent-text underline">{children}</a>
      : <span className="text-accent-text">{children}</span>;  // stripped — render as plain text
  },
  img: ({ src, alt }) => {
    if (!isSafeUrl(src)) return null;  // strip data:/javascript: — drop the image entirely
    return <img src={src} alt={alt ?? ''} className="max-w-full rounded-sm mt-1" />;
  },
  code: ({ children }) => <code className="font-mono text-body-sm bg-surface-2 rounded px-1">{children}</code>,
  pre: ({ children }) => <pre className="font-mono text-body-sm bg-surface-2 rounded p-3 overflow-x-auto my-1">{children}</pre>,
  strong: ({ children }) => <strong className="font-semibold text-text">{children}</strong>,
  em: ({ children }) => <em className="italic text-muted">{children}</em>,
  ul: ({ children }) => <ul className="list-disc list-inside text-body-sm text-muted space-y-0.5 my-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside text-body-sm text-muted space-y-0.5 my-1">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  blockquote: ({ children }) => <blockquote className="border-l-2 border-border pl-3 text-muted my-1">{children}</blockquote>,
  h1: ({ children }) => <h1 className="text-subtitle font-semibold text-text my-1">{children}</h1>,
  h2: ({ children }) => <h2 className="font-semibold text-text my-1">{children}</h2>,
  h3: ({ children }) => <h3 className="font-medium text-text my-0.5">{children}</h3>,
};

const MarkdownContent = ({ content, className }) => {
  const [reactContent, setMarkdownSource] = useRemark({
    remarkToReactComponents: componentMap,
  });

  useEffect(() => {
    setMarkdownSource(content ?? '');
  }, [content, setMarkdownSource]);

  return <div className={cn("markdown-content", className)}>{reactContent}</div>;
};

export default MarkdownContent;
```

**Critical `useRemark` usage rules:**
- Import `useRemark` from `react-remark` — the hook, NOT the `<Remark>` component
- The hook returns `[reactContent, setMarkdownSource]`
- Call `setMarkdownSource(string)` in a `useEffect` when content changes
- The `remarkToReactComponents` option maps HTML element names to React components
- **Do not add `rehype-raw`** — raw HTML is blocked by design (XSS safety)
- **Keep the remark plugin chain verbatim** — no plugins removed or reordered

---

### Leading Mono Icons (KvIcon)

The "leading mono icon" for key-value rows. Use inline SVG rendered at 16px in `text-muted`. The icon should hint at the metric type from common key names. A simple lookup with a generic fallback:

```jsx
// A small lookup for common monitoring keys → simple icon
const KV_ICONS = {
  cpu: '⚙',
  disk: '💾',
  memory: '🧠',
  mem: '🧠',
  ram: '🧠',
  load: '📈',
  uptime: '⏱',
  status: '●',
  error: '✕',
  warning: '⚠',
  temp: '🌡',
  temperature: '🌡',
  ping: '◎',
  speed: '▶',
  version: '#',
  exit: '⏎',
};

const KvIcon = ({ keyName }) => {
  const icon = KV_ICONS[keyName?.toLowerCase()] ?? '·';
  return (
    <span
      className="font-mono text-body-sm text-muted shrink-0 w-4 text-center"
      aria-hidden="true"
    >
      {icon}
    </span>
  );
};
```

If no icon library is installed, this emoji/text approach is correct. **Do NOT import from `@mui/icons-material`** — MUI is being removed.

---

### KvLine Parsing

```js
// Parse "key: value" lines from message
// Returns: [{ key, value, numericValue (null if not numeric), isError }]
const parseKvLines = (message) => {
  return message.trim().split('\n')
    .filter(l => l.trim())
    .map(line => {
      const match = line.match(/^([^:]+):\s*(.*)$/);
      if (!match) return { key: line, value: '', numericValue: null, isError: false };
      const [, key, value] = match;
      // Detect numeric/percentage
      const percentMatch = value.trim().match(/^(\d+(\.\d+)?)%$/);
      const numericMatch = value.trim().match(/^(\d+(\.\d+)?)$/);
      const numericValue = percentMatch
        ? parseFloat(percentMatch[1])
        : numericMatch ? parseFloat(numericMatch[1]) : null;
      // Heuristic for error values: key name contains 'error'/'fail'/'err'
      const isError = /error|fail|err/i.test(key);
      return { key: key.trim(), value: value.trim(), numericValue, isError };
    });
};
```

---

### i18n — Expand Toggle

The only i18n strings in this story are the expand/collapse button labels (all other content is user message content, not i18n'd):

Add to `public/static/langs/ko.json`:
```json
"card_body_expand": "더 보기",
"card_body_collapse": "접기"
```

Use `t("card_body_expand")` / `t("card_body_collapse")` in `ParagraphBody`. No other hardcoded Korean strings.

---

### The Security Test (Required — AC #4)

This is the one test that is non-negotiable:

```jsx
// src/components/message/CardBody.test.jsx

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MarkdownContent from "./MarkdownContent";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k) => k }),
}));

describe("MarkdownContent — link sanitization (security)", () => {
  it("strips javascript: href — no clickable executable link", () => {
    render(<MarkdownContent content="[click me](javascript:alert(1))" />);
    // The anchor must not have an executable href
    const link = screen.queryByRole("link");
    // Either no <a> at all, or <a> with no href / href="#" / href=""
    if (link) {
      const href = link.getAttribute("href");
      expect(href).not.toMatch(/^javascript:/i);
      expect(href).not.toMatch(/^data:/i);
    }
    // The visible text still renders
    expect(screen.getByText("click me")).toBeInTheDocument();
  });

  it("strips data: href", () => {
    render(<MarkdownContent content="[bad](data:text/html,<script>alert(1)</script>)" />);
    const link = screen.queryByRole("link");
    if (link) {
      expect(link.getAttribute("href")).not.toMatch(/^data:/i);
    }
  });

  it("passes through https: href unchanged", () => {
    render(<MarkdownContent content="[safe](https://example.com)" />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("https://example.com");
  });
});

describe("CardBody — shape detection", () => {
  // Minimal notification object shape (from the logic layer)
  const notif = (message) => ({ message });

  it("renders a kv structure for key-value message", () => {
    const { container } = render(<CardBody notification={notif("Status: OK\nVersion: 1.2.3")} />);
    expect(container.querySelector("dl")).toBeInTheDocument();
  });

  it("renders Meter for a percentage value", () => {
    render(<CardBody notification={notif("CPU: 78%\nMemory: 45%")} />);
    expect(document.querySelector('[role="meter"]')).toBeInTheDocument();
  });

  it("falls back to raw text on broken content without throwing", () => {
    // Null message should not crash
    expect(() =>
      render(<CardBody notification={{ message: null }} />)
    ).not.toThrow();
  });
});
```

---

### Architecture Boundary Summary

```
src/components/
├── message/
│   ├── EmptyStates.jsx      ← exists (leave alone)
│   ├── CardBody.jsx         ← NEW (domain-aware: knows ntfy notification shape)
│   ├── CardBody.test.jsx    ← NEW
│   └── MarkdownContent.jsx  ← NEW (domain-aware: used as body sub-renderer)
└── ui/
    └── Meter.jsx            ← EXISTING — import at "@/components/ui/Meter", do not recreate
```

**Boundary rules:**
- `ui/` → `message/` imports: **FORBIDDEN** (ESLint `no-restricted-paths`)
- `message/` → `ui/` imports: **ALLOWED** — `CardBody` imports `Meter` from `ui/`
- `src/app/` → `src/components/` imports: **FORBIDDEN** — the notification object is passed as a prop; never import `src/app/` modules directly in message/

---

### Tokens Reference

Token classes used in this story (all resolve to `@theme` vars — no raw hex):

| Class | Purpose |
|---|---|
| `text-body-sm` | 14px / line-height 20px — card body and kv row text |
| `text-muted` | Secondary/label text (`#8B9197` dark, `#6B7177` light) |
| `text-text` | Primary body text |
| `text-accent-text` | Emerald — "ok" kv values, markdown links |
| `text-priority-max` | Coral — "error" kv values, meter critical label |
| `font-mono` | JetBrains Mono — leading icons, code spans, version strings |
| `line-clamp-3` | Tailwind clamp utility — paragraph body truncated to 3 lines |
| `bg-surface-2` | Code block background |
| `rounded-sm` | Radius 10px — inline code, images |
| `border-border` | 1px border color — blockquote left border |

---

### Key Anti-Patterns to Avoid

```jsx
// ✗ Wrong import for useRemark
import { Remark } from "react-remark";         // ✗ — component API, not the hook
// ✓ Correct:
import { useRemark } from "react-remark";

// ✗ Dangerous HTML
<div dangerouslySetInnerHTML={{ __html: markdownHtml }} />  // ✗ NEVER

// ✗ Recreating Meter
const MeterBar = ({ pct }) => <div style={{ width: `${pct}%` }} />;  // ✗ — Meter exists in ui/

// ✗ Wrong file location
// src/components/ui/CardBody.jsx              // ✗ — domain-aware, belongs in message/

// ✗ Importing from src/app/ in CardBody
import db from "@/app/db";                     // ✗ — notification object is passed as prop

// ✗ Passing raw hex colors
<dd className="text-[#FF6B6E]">              // ✗ — use text-priority-max token

// ✗ Wrong shape detection: toggling based on user interaction
const [mode, setMode] = useState("paragraph");
<button onClick={() => setMode("kv")}>Switch</button>  // ✗ — the renderer picks, Jay never toggles

// ✗ Adding rehype-raw
import rehypeRaw from "rehype-raw";            // ✗ — this would allow raw HTML, XSS risk

// ✗ Allowing javascript: through
const isSafe = (url) => !url.includes("script");  // ✗ — insufficient; use allowlist (http/https/mailto only)
```

---

### Component API Contract (for Story 3.1 integration)

Story 3.1 (NotificationCard) must expose a body slot. This story's `CardBody` plugs into it:

```jsx
// In NotificationCard (Story 3.1):
// <NotificationCard notification={n} body={<CardBody notification={n} />} />

// CardBody props:
// notification: object — the full notification object from the logic layer, consumed as-is
//   { id, time, event, topic, message, title, priority, tags, click, actions, attachment }
// The body renders notification.message; it does not reshape or re-derive other fields.
```

CardBody does not need `title`, `priority`, `tags`, `attachment`, or `actions` — those are owned by NotificationCard's shell (Story 3.1). CardBody renders ONLY the `message` string in one of the 3 forms.

---

### Testing Approach

Use the Vitest + RTL pattern established in the project:

```jsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Mock react-i18next (for expand/collapse button labels)
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k) => k }),
}));
```

No `fake-indexeddb` needed — CardBody and MarkdownContent are pure display components with no Dexie access.

Co-locate the test as `src/components/message/CardBody.test.jsx`.

---

### References

- Epic spec: `_bmad-output/planning-artifacts/epics.md` § Story 3.2
- Architecture adaptive renderer: `architecture.md` § Frontend Architecture → "Adaptive card renderer = 2 levels"
- UX body forms: `ux-designs/ux-ntfy-web-2026-06-20/DESIGN.md` § Components → Notification card Body
- UX experience patterns: `ux-designs/ux-ntfy-web-2026-06-20/EXPERIENCE.md` § Component Patterns → Adaptive card body
- Meter component: `src/components/ui/Meter.jsx` (Story 1.8 — already built)
- Tokens: `src/styles/tokens.css` — `--color-accent-text`, `--color-priority-max`, `--font-mono`
- Token naming: `architecture.md` § Format Patterns → Styling — Tokens only
- Security requirement: epics.md § Story 3.2 → AC (security, C4)
- i18n pattern: `architecture.md` § Naming Patterns → i18n keys → `<feature>_<element>_<action>`
- Architecture boundary: `architecture.md` § Architectural Boundaries → "ui/ may not import message/"
- `useRemark` usage: `project-context.md` → `react-remark` note ("uses the **`useRemark` hook**, not `<Remark>`")

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Created `MarkdownContent.jsx` using the `useRemark` hook (not `<Remark>` component). `componentMap` remaps all markdown elements to Tailwind token classes. URL sanitization uses an allowlist (`http:`, `https:`, `mailto:`) — `javascript:` and `data:` hrefs render as `<span>` (no href); unsafe image `src` returns `null` (image dropped).
- Created `CardBody.jsx` with `detectShape` heuristic (paragraph / kv / rich-kv). `ParagraphBody` uses `line-clamp-3` + i18n expand toggle. `KvBody` renders `<dl>` with error coloring (`text-priority-max` for keys matching `/error|fail|err/i`). `RichKvBody` adds `<Meter>` for numeric/percentage values. Outer `try/catch` guarantees raw-text fallback on any render failure.
- `react-remark` is mocked synchronously in tests (its real `process()` is async/Promise-based) so tests use the existing `createRoot` + `act()` pattern without async plumbing.
- All 19 new tests pass. Pre-existing `CardOverflowMenu.test.jsx` failure (untracked, Story 3.4 work) is unrelated to this story.
- Added `card_body_expand` / `card_body_collapse` keys to `public/static/langs/ko.json`.

### File List

- `src/components/message/MarkdownContent.jsx` (created)
- `src/components/message/CardBody.jsx` (created)
- `src/components/message/CardBody.test.jsx` (created)
- `public/static/langs/ko.json` (modified — added card_body_expand, card_body_collapse)

## Change Log

- 2026-06-20: Implemented Story 3.2 — created MarkdownContent.jsx (useRemark + URL sanitization), CardBody.jsx (adaptive shape detector: paragraph/kv/rich-kv), CardBody.test.jsx (19 tests including mandatory javascript:/data: security assertions). Added i18n expand/collapse keys to ko.json.
