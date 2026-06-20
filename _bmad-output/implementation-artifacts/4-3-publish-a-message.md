---
baseline_commit: efdde3dd6681d5b6e2e7c900d48cd28386e7faf3
---

# Story 4.3: Publish a Message

Status: review

## Story

As Jay,
I want to publish a message from the app,
So that I can leave myself notes or trigger my own alerts (FR8, UX-DR9).

## Acceptance Criteria

1. **Given** a connected server,
   **when** Jay opens publish — desktop via a header action `Dialog`, mobile via the green FAB → bottom `Sheet` (UX-DR9) —
   **then** he can set topic (pre-set to the current feed, changeable), title, body, priority, and tags.

2. **And** the priority selector is segmented chips (4 options: 낮음 / 보통 / 높음 / 긴급, mapping to ntfy priorities 2 / 3 / 4 / 5); the selected chip shows a priority-colored outline + tint; unselected defaults to 보통 (P3).

3. **And** the FAB is the single green button in the product (UX-DR6); all other buttons stay white/ghost.

4. **And** submitting calls `api.publish()` with the form values; on success the dialog/sheet closes and state resets.

5. **And** on failure, an inline error message appears inside the dialog/sheet with a "다시 시도" option; the form content is **retained** (not cleared) so Jay can retry.

6. **And** the dialog/sheet traps focus, restores to trigger, closes on Esc (NFR3); all strings via `t()`.

## Tasks / Subtasks

- [x] Task 1: Create `src/components/PublishFab.jsx` (AC: #1, #3)
  - [x] Green rounded-square FAB button with a "+" or compose inline SVG icon
  - [x] Accepts `onClick` prop; renders `aria-label={t("publish_fab_label")}`
  - [x] Styled: `bg-accent text-[#0C1A12]` (the single green button in product — **no other buttons use `bg-accent`**)
  - [x] Positioned `fixed bottom-[calc(56px+1rem)] right-4 z-fab md:bottom-6 md:right-6` so it clears BottomNav on mobile and sits at corner on desktop

- [x] Task 2: Rebuild `src/components/PublishDialog.jsx` (AC: #1, #2, #5, #6)
  - [x] Accept props: `open` (bool), `onOpenChange` (fn), `initialTopic` (string), `baseUrl` (string)
  - [x] Managed state: `topic`, `title`, `body`, `priority` (default `3`), `tags`, `error`, `submitting`
  - [x] Render form fields:
    - [x] Topic: text `<input>`, pre-filled with `initialTopic`, validates with `validTopic()` from `@/app/utils`
    - [x] Title: text `<input>`, optional
    - [x] Body: `<textarea>`, required (disable send button when empty)
    - [x] Priority: 4 segmented chips — see **Priority Chip Spec** below
    - [x] Tags: text `<input>`, comma-separated (e.g. "warning, backup")
  - [x] On submit: call `api.publish(baseUrl, topic, body, options)` — see **API Spec** below
  - [x] On success: reset form state, call `onOpenChange(false)`
  - [x] On failure: set `error` state, show inline error; **do NOT clear form fields**
  - [x] Disable submit button while `submitting === true`
  - [x] Close button calls `onOpenChange(false)` and resets error state
  - [x] All strings via `t()` — no hardcoded Korean
  - [x] Render the form inside the appropriate container via `useIsMobile()` — see **Responsive Modal Spec** below

- [x] Task 3: Rebuild `src/components/Messaging.jsx` (AC: #1, #3)
  - [x] Manages `publishOpen` state
  - [x] Uses `useActiveTopic()` + `useLiveQuery` to resolve current subscription (same pattern as Feed.jsx)
  - [x] Renders `<PublishFab onClick={() => setPublishOpen(true)} />`
  - [x] Renders `<PublishDialog open={publishOpen} onOpenChange={setPublishOpen} initialTopic={topicName ?? ""} baseUrl={activeTopic?.baseUrl ?? config.base_url} />`
  - [x] Import `config` from `"@/app/config"` for the fallback baseUrl

- [x] Task 4: Wire `Messaging` into `NewShell` in `src/components/App.jsx` (AC: #1)
  - [x] Import `Messaging` from `"./Messaging"` (already imported)
  - [x] Added `<Messaging />` after `<BottomNav />`, as flat chrome at the shell level
  - [x] Not inside `<main>` or route outlets

- [x] Task 5: Add i18n keys to `public/static/langs/ko.json` and `public/static/langs/en.json` (AC: #6)
  - [x] 10 new keys added: publish_fab_label, publish_dialog_title, publish_dialog_close, publish_dialog_body_label, publish_priority_low/default/high/urgent, publish_dialog_send, publish_dialog_error_sending

- [x] Task 6: Add test `src/components/PublishDialog.test.jsx` (AC: #1–#6)
  - [x] 10 tests passing: form rendering, submit success (with priority options), submit failure (error + retained content), mobile Sheet branch, no hardcoded Korean

---

## Dev Notes

### Hard Prerequisites (All Complete)

| Prerequisite | Story | Status | What You Need |
|---|---|---|---|
| `src/components/ui/Dialog.jsx` | 1.7 | done | `Dialog`, `DialogContent`, `DialogClose` |
| `src/components/ui/Sheet.jsx` | 1.7 | done | `Sheet`, `SheetContent`, `SheetClose` |
| `src/components/ui/Button.jsx` | 1.6 | done | `Button` (primary + ghost variants) |
| `src/components/ui/Chip.jsx` | 1.6 | done | `Chip` (priority variant) for the segmented selector |
| `src/app/Api.js` `api.publish()` | pre-existing | done | Must REUSE — do NOT re-implement |
| `src/components/hooks.js` `useActiveTopic()` | 2.x | done | Must REUSE — pre-fills topic |

---

### File Locations

| File | Action |
|---|---|
| `src/components/PublishFab.jsx` | **CREATE NEW** |
| `src/components/PublishDialog.jsx` | **REBUILD** (replace MUI code — existing file) |
| `src/components/Messaging.jsx` | **REBUILD** (replace MUI code — existing file) |
| `src/components/App.jsx` | **MODIFY** — add `<Messaging />` to `NewShell` |
| `src/components/PublishDialog.test.jsx` | **CREATE NEW** |
| `public/static/langs/ko.json` | **MODIFY** — add 14 new keys |
| `public/static/langs/en.json` | **MODIFY** — add 14 new keys |

**Do NOT create `PublishDialog.jsx` inside `src/components/message/`** — it is NOT domain-specific like `CardOverflowMenu`; it lives at the flat chrome level alongside `Messaging.jsx`.

---

### Responsive Modal Spec

The publish form renders inside a `Sheet` (bottom side) on mobile and a `Dialog` on desktop. Use the `useIsMobile` hook:

```js
// Add to src/components/hooks.js
import { useState, useEffect } from "react";

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
};
```

This follows the same `window.matchMedia` pattern already used by `useIsLaunchedPWA` in `hooks.js`. Add it at the end of `hooks.js`.

In `PublishDialog.jsx`:

```jsx
import { useIsMobile } from "@/components/hooks";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/Dialog";
import { Sheet, SheetContent, SheetClose } from "@/components/ui/Sheet";

const PublishDialog = ({ open, onOpenChange, initialTopic, baseUrl }) => {
  const isMobile = useIsMobile();
  const Container = isMobile ? Sheet : Dialog;
  const Content = isMobile ? SheetContent : DialogContent;
  const Close = isMobile ? SheetClose : DialogClose;

  return (
    <Container open={open} onOpenChange={onOpenChange}>
      <Content side={isMobile ? "bottom" : undefined} title={t("publish_dialog_title")}>
        {/* form content */}
        <Close asChild>
          <Button variant="ghost" aria-label={t("publish_dialog_close")}>{/* × */}</Button>
        </Close>
      </Content>
    </Container>
  );
};
```

**Why not CSS show/hide:** Radix Dialog and Sheet render in portals — CSS `hidden` cannot suppress their open state. Conditional render based on `isMobile` is required.

**Breakpoint choice:** `767px` matches Tailwind's `md` (768px) breakpoint — stays consistent with `md:hidden` / `hidden md:flex` used throughout the shell.

---

### API Spec

```js
// Import at top of Messaging.jsx
import api from "@/app/Api";
import config from "@/app/config";    // ESLint readonly global — do NOT use window.config

// In submit handler inside PublishDialog:
const handleSubmit = async () => {
  if (!body.trim() || !validTopic(topic)) return;
  setSubmitting(true);
  setError(null);
  try {
    const options = {};
    if (title.trim()) options.title = title.trim();
    if (priority !== 3) options.priority = priority;
    if (tags.trim()) options.tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
    await api.publish(baseUrl, topic, body, options);
    onOpenChange(false);
    // reset form after successful close
    setTopic(initialTopic); setTitle(""); setBody(""); setPriority(3); setTags(""); setError(null);
  } catch (e) {
    setError(t("publish_dialog_error_sending"));
  } finally {
    setSubmitting(false);
  }
};
```

**Key facts about `api.publish(baseUrl, topic, message, options)`:**
- Defined in `src/app/Api.js` line 32 — REUSE, do NOT re-implement
- Internally calls `userManager.get(baseUrl)` for auth headers via `maybeWithAuth` — you do NOT need to handle auth
- Sends `PUT` to `${baseUrl}` with JSON body `{ topic, message, ...options }`
- The ntfy server PUT endpoint is just the base URL — confirmed in `Api.js`
- `options.tags` must be an **array of strings** (e.g. `["warning", "backup"]`), not a comma-separated string
- `options.priority` is an integer 1–5; omit or pass `undefined` to use server default (P3)

---

### Priority Chip Spec

4 chips, each rendered as `<Chip variant="priority">`, mapping value to ntfy priority integer:

| Label | Korean | ntfy Priority | Selected Color |
|---|---|---|---|
| 낮음 | Low | 2 | `border-[var(--color-border)] text-muted` (neutral) |
| 보통 | Normal | 3 (default) | `border-[var(--color-border)] text-text` (neutral + default text) |
| 높음 | High | 4 | `border-[var(--color-priority-high)] text-[var(--color-priority-high)] bg-[var(--color-priority-high)]/10` |
| 긴급 | Urgent | 5 | `border-[var(--color-priority-max)] text-[var(--color-priority-max)] bg-[var(--color-priority-max)]/10` |

Min priority (1) is intentionally dropped in the new UI — the simplified 4-chip design omits it.

```jsx
const PRIORITIES = [
  { value: 2, labelKey: "publish_priority_low" },
  { value: 3, labelKey: "publish_priority_default" },
  { value: 4, labelKey: "publish_priority_high" },
  { value: 5, labelKey: "publish_priority_urgent" },
];

const PRIORITY_SELECTED_CLASSES = {
  2: "border-border text-muted",
  3: "border-border text-text",
  4: "border-[var(--color-priority-high)] text-[var(--color-priority-high)] bg-[var(--color-priority-high)]/10",
  5: "border-[var(--color-priority-max)] text-[var(--color-priority-max)] bg-[var(--color-priority-max)]/10",
};

const PRIORITY_UNSELECTED_CLASS = "border-border text-muted bg-transparent";

{PRIORITIES.map(({ value, labelKey }) => (
  <Chip
    key={value}
    variant="priority"
    as="button"
    type="button"
    onClick={() => setPriority(value)}
    aria-pressed={priority === value}
    className={cn(
      "flex-1 border",
      priority === value ? PRIORITY_SELECTED_CLASSES[value] : PRIORITY_UNSELECTED_CLASS
    )}
  >
    {t(labelKey)}
  </Chip>
))}
```

`aria-pressed` on each chip satisfies NFR3 accessibility.

---

### FAB Spec

```jsx
// src/components/PublishFab.jsx
import { useTranslation } from "react-i18next";
import { cn } from "@/components/ui/utils";

const ComposeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const PublishFab = ({ onClick }) => {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t("publish_fab_label")}
      className={cn(
        "fixed z-fab",
        // Mobile: above BottomNav (~56px) + 1rem gap
        "bottom-[calc(56px+1rem)] right-4",
        // Desktop: standard corner position
        "md:bottom-6 md:right-6",
        // FAB styling — the ONLY green button in the product
        "w-14 h-14 rounded-[10px] bg-accent text-[#0C1A12]",
        "shadow-elev-2",
        "flex items-center justify-center",
        "hover:brightness-110 active:brightness-90 transition-[filter]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
      )}
    >
      <ComposeIcon />
    </button>
  );
};

export default PublishFab;
```

**Token mapping:**
- `bg-accent` → `--color-accent: #42D392` (emerald green, dark mode) / light mode equivalent
- `text-[#0C1A12]` → dark green text on accent fill (see `fab-publish.foreground` in DESIGN.md)
- `rounded-[10px]` → Tailwind arbitrary value matching `--radius-sm`
- `z-fab` — add `fab: 40` to Tailwind theme if not present; must be above BottomNav (below `z-overlay: 50`)

---

### Messaging.jsx Architecture

```jsx
// src/components/Messaging.jsx
import { useState } from "react";
import { useActiveTopic } from "@/components/hooks";
import PublishFab from "./PublishFab";
import PublishDialog from "./PublishDialog";
import config from "@/app/config";

const Messaging = () => {
  const [publishOpen, setPublishOpen] = useState(false);
  const activeTopic = useActiveTopic();

  return (
    <>
      <PublishFab onClick={() => setPublishOpen(true)} />
      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        initialTopic={activeTopic?.topic ?? ""}
        baseUrl={activeTopic?.baseUrl ?? config.base_url}
      />
    </>
  );
};

export default Messaging;
```

**`useActiveTopic()` return value:** The full subscription object `{ id, topic, baseUrl, mutedUntil, ... }` or `null` when on `/all` or `/settings`. Guard with `?.` before accessing `.topic` and `.baseUrl`.

**`config.base_url`:** The server's base URL from `public/config.js` (server-generated). ESLint treats `config` as a readonly global — always import via `import config from "@/app/config"`.

---

### NewShell Wiring (App.jsx)

```jsx
// In the NewShell component, after <BottomNav />:
import Messaging from "./Messaging";

const NewShell = () => {
  // ... existing state ...
  return (
    <div className="flex flex-col h-dvh bg-bg">
      <AppBarNew ... />
      <div className="flex flex-1 overflow-hidden">
        {/* ... sidebar, main, detail ... */}
      </div>
      <BottomNav />
      {/* ... Sheet drawer ... */}
      <Messaging />   {/* ← ADD THIS — flat chrome, renders FAB + publish modal */}
    </div>
  );
};
```

`<Messaging />` renders at shell level (not inside `<main>`) because `PublishFab` is `position: fixed` and must not be clipped by `overflow-hidden` on parent columns.

---

### Sheet API (src/components/ui/Sheet.jsx) — Already Built

```jsx
import { Sheet, SheetContent, SheetClose } from "@/components/ui/Sheet";

// Sheet = Dialog.Root (controls open/close state) — uses Radix Dialog.Root
// SheetContent = Dialog.Content with side variant ("bottom" | "right" | "left")
//   bottom: inset-x-0 bottom-0 border-t rounded-t-md
//   right: inset-y-0 right-0 max-w-sm border-l
// SheetClose = Dialog.Close

// Usage:
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent side="bottom">
    {/* form content */}
    <SheetClose asChild>
      <Button variant="ghost">닫기</Button>
    </SheetClose>
  </SheetContent>
</Sheet>
```

`SheetContent` does NOT have a `title` prop — add a `<h2>` heading manually for accessibility (required for Radix Dialog.Title):

```jsx
import { VisuallyHidden } from "radix-ui";
// Inside SheetContent:
<h2 className="text-subtitle font-semibold text-text mb-4">{t("publish_dialog_title")}</h2>
// OR for the accessible title (required if visually hidden):
<VisuallyHidden.Root><Dialog.Title>{t("publish_dialog_title")}</Dialog.Title></VisuallyHidden.Root>
```

Because `SheetContent` uses `Dialog.Content` internally, Radix requires a `Dialog.Title` or `VisuallyHidden` fallback. `DialogContent` handles this automatically via its `title` prop; `SheetContent` does not. Add it manually.

---

### i18n Key Reference

Complete set of new keys to add to both `ko.json` and `en.json`:

```json
// ko.json
"publish_fab_label":             "알림 보내기",
"publish_dialog_title":          "알림 보내기",
"publish_dialog_close":          "닫기",
"publish_dialog_topic_label":    "토픽",
"publish_dialog_title_label":    "제목",
"publish_dialog_body_label":     "내용",
"publish_dialog_priority_label": "우선순위",
"publish_dialog_tags_label":     "태그",
"publish_priority_low":          "낮음",
"publish_priority_default":      "보통",
"publish_priority_high":         "높음",
"publish_priority_urgent":       "긴급",
"publish_dialog_send":           "보내기",
"publish_dialog_error_sending":  "메시지를 전송하지 못했습니다. 다시 시도해 주세요."

// en.json
"publish_fab_label":             "Publish a message",
"publish_dialog_title":          "Publish a message",
"publish_dialog_close":          "Close",
"publish_dialog_topic_label":    "Topic",
"publish_dialog_title_label":    "Title",
"publish_dialog_body_label":     "Message",
"publish_dialog_priority_label": "Priority",
"publish_dialog_tags_label":     "Tags",
"publish_priority_low":          "Low",
"publish_priority_default":      "Normal",
"publish_priority_high":         "High",
"publish_priority_urgent":       "Urgent",
"publish_dialog_send":           "Send",
"publish_dialog_error_sending":  "Failed to send. Please try again."
```

**Existing keys to REUSE (do not re-add):**
- `publish_dialog_topic_label`, `publish_dialog_title_label`, `publish_dialog_message_label`, `publish_dialog_tags_label`, `publish_dialog_priority_label` already exist in `en.json` — check before adding to avoid duplication. Use the `publish_*` (no "dialog") prefix for the new chip labels (`publish_priority_low` etc.) which do NOT exist yet.

**Check existing keys first:** Run `grep "publish_priority\|publish_fab\|publish_dialog_send\|publish_dialog_error_sending" public/static/langs/en.json` before adding to confirm which are genuinely new.

---

### Korean Voice Rules

| Principle | This Story |
|---|---|
| 해요체 (casual polite) | "알림 보내기", "다시 시도해 주세요" |
| Buttons say the verb | "보내기" (send), "닫기" (close) |
| Error is calm, not alarming | "메시지를 전송하지 못했습니다. 다시 시도해 주세요." |
| Labels use noun form | "토픽", "제목", "내용", "우선순위", "태그" |
| No exclamation marks or emoji in strings | — |

---

### Testing Approach

```jsx
// src/components/PublishDialog.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PublishDialog from "./PublishDialog";

// Mock hooks — useIsMobile controls Dialog vs Sheet branch
vi.mock("@/components/hooks", () => ({
  useIsMobile: () => false,  // test the Dialog (desktop) path
  useActiveTopic: () => null,
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k) => k }),
}));

// Mock api.publish
const mockPublish = vi.fn();
vi.mock("@/app/Api", () => ({ default: { publish: mockPublish } }));
vi.mock("@/app/config", () => ({ default: { base_url: "https://ntfy.example.com" } }));

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  initialTopic: "notes",
  baseUrl: "https://ntfy.example.com",
};

beforeEach(() => {
  mockPublish.mockClear();
  defaultProps.onOpenChange.mockClear();
});

describe("PublishDialog — form rendering", () => {
  it("renders topic pre-filled with initialTopic", () => {
    render(<PublishDialog {...defaultProps} />);
    expect(screen.getByLabelText("publish_dialog_topic_label")).toHaveValue("notes");
  });

  it("renders 4 priority chips with P3 selected by default", () => {
    render(<PublishDialog {...defaultProps} />);
    const chips = screen.getAllByRole("button", { name: /publish_priority/ });
    expect(chips).toHaveLength(4);
    expect(screen.getByRole("button", { name: "publish_priority_default" })).toHaveAttribute("aria-pressed", "true");
  });

  it("disables Send when body is empty", () => {
    render(<PublishDialog {...defaultProps} />);
    const send = screen.getByRole("button", { name: "publish_dialog_send" });
    expect(send).toBeDisabled();
  });
});

describe("PublishDialog — submit success", () => {
  it("calls api.publish with topic and body", async () => {
    mockPublish.mockResolvedValueOnce(undefined);
    render(<PublishDialog {...defaultProps} />);
    fireEvent.change(screen.getByLabelText("publish_dialog_body_label"), { target: { value: "hello" } });
    fireEvent.click(screen.getByRole("button", { name: "publish_dialog_send" }));
    await waitFor(() => expect(mockPublish).toHaveBeenCalledWith(
      "https://ntfy.example.com", "notes", "hello", {}
    ));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("includes priority in options when not default (P3)", async () => {
    mockPublish.mockResolvedValueOnce(undefined);
    render(<PublishDialog {...defaultProps} />);
    fireEvent.change(screen.getByLabelText("publish_dialog_body_label"), { target: { value: "hi" } });
    fireEvent.click(screen.getByRole("button", { name: "publish_priority_urgent" })); // select P5
    fireEvent.click(screen.getByRole("button", { name: "publish_dialog_send" }));
    await waitFor(() => expect(mockPublish).toHaveBeenCalledWith(
      expect.any(String), expect.any(String), "hi", expect.objectContaining({ priority: 5 })
    ));
  });
});

describe("PublishDialog — submit failure", () => {
  it("shows error and retains form content on failure", async () => {
    mockPublish.mockRejectedValueOnce(new Error("network error"));
    render(<PublishDialog {...defaultProps} />);
    fireEvent.change(screen.getByLabelText("publish_dialog_body_label"), { target: { value: "test" } });
    fireEvent.click(screen.getByRole("button", { name: "publish_dialog_send" }));
    await waitFor(() => expect(screen.getByText("publish_dialog_error_sending")).toBeInTheDocument());
    // Form content retained
    expect(screen.getByLabelText("publish_dialog_body_label")).toHaveValue("test");
    // Dialog NOT closed
    expect(defaultProps.onOpenChange).not.toHaveBeenCalled();
  });
});
```

**No `fake-indexeddb` needed** — `PublishDialog` has no direct Dexie access; it delegates to `api.publish`. `Messaging.jsx` calls `useActiveTopic()` which does use Dexie, but that's mocked at the hook level.

For the `Sheet` mobile branch test, add a second describe block with `useIsMobile: () => true` and verify `SheetContent` renders (e.g. by checking the element has `bottom-0` or by querying `role="dialog"` — Radix Sheet is still a dialog role).

---

### Architecture Boundary Summary

```
src/components/
├── PublishFab.jsx         ← NEW flat chrome (positioned fixed, green accent, single green button)
├── Messaging.jsx          ← REBUILD (orchestrates open state, renders FAB + PublishDialog)
├── PublishDialog.jsx      ← REBUILD (form + Dialog/Sheet container, responsive modal)
├── App.jsx                ← MODIFY NewShell (add <Messaging /> after <BottomNav />)
└── hooks.js               ← MODIFY (add useIsMobile hook at the end)

src/components/ui/
├── Dialog.jsx             ← EXISTING — desktop modal
├── Sheet.jsx              ← EXISTING — mobile bottom sheet
├── Button.jsx             ← EXISTING — primary + ghost
└── Chip.jsx               ← EXISTING — priority variant
```

**Layer boundaries enforced by ESLint:**
- `PublishFab.jsx` → `ui/` imports: **ALLOWED** (flat chrome may use ui/)
- `Messaging.jsx` → `ui/`, `app/`, `hooks.js`: **ALLOWED**
- `PublishDialog.jsx` → `ui/`, `app/Api.js`, `app/utils.js`: **ALLOWED**
- `ui/` → `message/` (or any domain): **FORBIDDEN**
- `app/` → `src/components/` (except Notifier→routes): **FORBIDDEN**

---

### Critical Anti-Patterns to Avoid

```jsx
// ✗ Implementing HTTP fetch yourself in the component
const res = await fetch(topicUrl(baseUrl, topic), { method: "PUT", ... }); // ✗
// ✓ Use api.publish() — it handles auth, headers, and error formatting

// ✗ Adding auth header logic outside Api.js
const headers = { Authorization: `Basic ${btoa(...)}` }; // ✗
// ✓ api.publish() calls userManager.get() and maybeWithAuth() internally

// ✗ Making PublishFab green via anything other than bg-accent
className="bg-emerald-400" // ✗ — raw Tailwind color class, not a token
className="bg-[#42D392]"   // ✗ — raw hex, ESLint will catch this
// ✓ className="bg-accent" — resolves to var(--color-accent)

// ✗ Adding a second green button anywhere in the product
<Button className="bg-accent">구독 추가</Button> // ✗ — FAB is the ONLY green button
// ✓ All other buttons use white fill (primary) or ghost (secondary) from Button.jsx variants

// ✗ Clearing form fields on failure
setBody(""); setTitle(""); // ✗ — user would have to retype everything
// ✓ Only clear on SUCCESS, retain on failure so user can retry

// ✗ Converting tags at the wrong level
options.tags = tags; // ✗ — api expects an array, not a comma string
// ✓ options.tags = tags.split(",").map(t => t.trim()).filter(Boolean)

// ✗ Using window.config directly
const url = window.config.base_url; // ✗ — ESLint readonly global violation
// ✓ import config from "@/app/config"; then config.base_url

// ✗ Hardcoded Korean strings
<h2>알림 보내기</h2> // ✗
// ✓ <h2>{t("publish_dialog_title")}</h2>

// ✗ Adding Messaging inside <main> / the route outlet
<main><Messaging /></main> // ✗ — fixed-position FAB gets clipped by overflow-hidden parent
// ✓ Add Messaging as a direct child of the root flex container in NewShell

// ✗ Importing from @mui
import { Dialog } from "@mui/material"; // ✗ — MUI is being removed from the project
// ✓ import { Dialog, DialogContent, DialogClose } from "@/components/ui/Dialog"

// ✗ Using useState array for priorities
const [priorities] = useState([...]); // ✗ — constant, no reason to be state
// ✓ const PRIORITIES = [...]; (file-level constant)
```

---

### Existing Publish Infrastructure (REUSE, Do Not Reinvent)

The old `Messaging.jsx` and `PublishDialog.jsx` use MUI — they are being replaced. The `app/` layer code is **preserved as-is**:

| Existing code | Location | How to use it |
|---|---|---|
| `api.publish()` | `src/app/Api.js` line 32 | Call with `(baseUrl, topic, body, options)` |
| `api.publishXHR()` | `src/app/Api.js` line 61 | NOT needed for this story (XHR/file upload = story scope out) |
| `validTopic()` | `src/app/utils.js` line 43 | Validate topic field before submit |
| `topicUrl()` | `src/app/utils.js` line 16 | NOT needed — api.publish() builds the URL internally |
| `useActiveTopic()` | `src/components/hooks.js` line 158 | Pre-fill topic + get baseUrl |
| `config.base_url` | `src/app/config.js` | Fallback baseUrl when no active topic |

---

### Scope Boundaries (This Story Excludes)

The old `PublishDialog.jsx` (MUI version) has many features **out of scope for 4.3**:
- File attachments (scroll to `attachFile`, `publishXHR`) — out of scope
- Click URL, email forward, phone call, delay — out of scope  
- Emoji picker — out of scope
- Markdown toggle — out of scope
- "Publish another" checkbox — out of scope
- Drag-and-drop drop zone — out of scope
- Upload progress tracking — out of scope

Story 4.3 delivers: **topic + title + body + priority chips + tags + send + error handling**. Scope creep beyond these 5 fields is a failure mode.

Story 4.4 (Optimistic Publish Queue) is also excluded — `api.publish()` is synchronous; the optimistic card-at-feed-top behavior is Story 4.4's responsibility.

---

### References

- Epic spec: `_bmad-output/planning-artifacts/epics.md` § Story 4.3
- Architecture: `_bmad-output/planning-artifacts/architecture.md` § SC5 Publish, Communication Patterns, File Structure
- UX design: `_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/EXPERIENCE.md` § Flow 3, Publish dialog
- UX mockup: `_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/mockups/mobile-layout.html` (bottom sheet structure)
- api.publish: `src/app/Api.js` lines 32–46
- useActiveTopic: `src/components/hooks.js` lines 158–167
- validTopic: `src/app/utils.js` lines 43–47
- Dialog API: `src/components/ui/Dialog.jsx`
- Sheet API: `src/components/ui/Sheet.jsx`
- Chip API: `src/components/ui/Chip.jsx`
- Button API: `src/components/ui/Button.jsx`
- Design tokens: `src/styles/tokens.css` (priority-high, priority-max, accent)
- Korean voice: `_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/EXPERIENCE.md` § Voice and Tone
- Pattern reference: `_bmad-output/implementation-artifacts/3-4-card-overflow-actions-read-copy-delete.md` (component + test patterns)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Created `PublishFab.jsx`: fixed green rounded-square FAB (`bg-accent`, `z-fab`, compose SVG icon). Added `--z-fab: 40` token to `tokens.css`.
- Rebuilt `PublishDialog.jsx`: complete MUI removal. Responsive Dialog/Sheet via `useIsMobile()` hook (added to `hooks.js`). 4-chip priority selector with per-priority selected styles. Submit calls `api.publish()` with correct options shape; retains form on failure; resets on success.
- Rebuilt `Messaging.jsx`: uses `useActiveTopic()` (returns topic string) + `useLiveQuery(subscriptionManager.all())` to resolve full subscription, matching the same pattern as Feed.jsx. FAB + PublishDialog rendered as a Fragment.
- Wired `<Messaging />` into `NewShell` in App.jsx after `<BottomNav />` (flat chrome, not inside `<main>`).
- Added 10 new i18n keys to `en.json` and `ko.json`.
- Note: story spec assumed `useActiveTopic()` returns a full subscription object, but current implementation returns only the topic string. Adapted Messaging.jsx to resolve the subscription separately (identical to Feed.jsx pattern).

### File List

- `src/components/PublishFab.jsx` (created)
- `src/components/PublishDialog.jsx` (rebuilt — MUI removed)
- `src/components/Messaging.jsx` (rebuilt — MUI removed)
- `src/components/App.jsx` (modified — added `<Messaging />` to NewShell)
- `src/components/hooks.js` (modified — added `useIsMobile` hook)
- `src/styles/tokens.css` (modified — added `--z-fab: 40` token)
- `src/components/PublishDialog.test.jsx` (created — 10 tests)
- `public/static/langs/en.json` (modified — 10 new keys)
- `public/static/langs/ko.json` (modified — 10 new keys)

### Change Log

- feat(4-3): PublishFab, PublishDialog (MUI→Tailwind+Radix), Messaging rebuild, NewShell wiring, i18n keys, tests (2026-06-20)
