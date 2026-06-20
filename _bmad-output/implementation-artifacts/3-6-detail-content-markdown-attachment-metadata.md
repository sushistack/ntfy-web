---
baseline_commit: 50645f853e7dd0a72ca7b40398b5b0a16536c2a6
---

# Story 3.6: Detail Content — Markdown, Attachment, Metadata

Status: review

## Story

As Jay,
I want the full notification in detail,
so that I can read everything and get the attachment (FR5, UX-DR18, NFR13).

`Depends-on:` 3.5 (DetailPane shell + SelectionContext — **BLOCKING**), 3.2 (MarkdownContent.jsx — **BLOCKING**).
**Touched:** `src/components/DetailPane.jsx`, `src/components/message/AttachmentBox.jsx`.

---

## Acceptance Criteria

1. **Given** a selected notification,
   **when** the detail pane renders,
   **then** it shows: the notification title (or message if no title), a `PriorityBadge` (P4/P5 only), the full markdown body in `MarkdownContent` (unclamped, `max-w-[70ch]`, `leading-[1.5]`, `text-body` / 16px, mono code blocks 14px), a tags row, source topic chip, and a relative timestamp.

2. **And** markdown remains XSS-safe (NFR11): `MarkdownContent`'s existing link/image sanitization (Story 3.2) covers this — Story 3.6 does NOT add a separate sanitization layer; it reuses `MarkdownContent` as-is.

3. **And given** a parse failure (malformed content),
   **then** the detail body degrades to safe raw text — the panel always survives.

4. **And given** an attachment (`notification.attachment` is truthy),
   **when** the attachment is an image (per `isImage(attachment)` from `notificationUtils`),
   **then** `AttachmentBox` renders a thumbnail (`max-h-48`, `object-contain`, `rounded-sm`, `bg-surface-muted`) wrapped in an `<a>` that opens the image in a new tab; URL must be `http://` or `https://` — otherwise the attachment is silently hidden.

5. **And given** an attachment that is NOT an image,
   **then** `AttachmentBox` renders a file chip: a document icon, the `attachment.name`, a formatted size (`formatBytes(attachment.size)` if size > 0), and an `<a>` that downloads the file with `download={attachment.name}`; chip styling: `bg-surface-muted`, `rounded-sm`, `text-body-sm`, border.

6. **And** body line-height is 1.5, body font-size is 16px (`text-body` token), mono code spans are 14px (`text-mono` / `font-mono` tokens) — verified visually against DESIGN.md NFR13.

7. **And** opening the detail pane marks the notification as read — a `useEffect` in `DetailPane` calls `subscriptionManager.markNotificationRead(notification.id)` when `notification` mounts (only when `notification.new === 1`); this is the **same call** established in Story 3.4 AC #5 for consistency; the unread dot clears reactively via Dexie → `useLiveQuery` in the feed.

---

## Tasks / Subtasks

- [x] Task 1: Create `src/components/message/AttachmentBox.jsx` (AC: #4, #5)
  - [x] Export default `AttachmentBox({ attachment })`
  - [x] Guard: return `null` if `!attachment`
  - [x] URL safety guard: if `attachment.url` does not start with `http://` or `https://`, return `null` (silently skip)
  - [x] Expired link guard: if `attachment.expires` is set and `attachment.expires * 1000 < Date.now()`, render expired state using existing key `t("notifications_attachment_link_expired")` ("다운로드 링크 만료됨") styled as `text-muted text-body-sm`
  - [x] Image path (`isImage(attachment)` returns true):
    - [x] Render `<a href={attachment.url} target="_blank" rel="noopener noreferrer" aria-label={t("notifications_attachment_open_button")}>`
    - [x] Inside: `<img src={attachment.url} alt={t("notifications_attachment_image")} className="max-h-48 w-auto object-contain rounded-sm bg-surface-muted" />`
    - [x] On image load error (`onError`): hide the image (set state `imgFailed = true`), render file chip fallback instead
  - [x] File chip path (non-image):
    - [x] Render `<a href={attachment.url} download={attachment.name} className="inline-flex items-center gap-2 px-3 py-2 rounded-sm bg-surface-muted border border-border text-body-sm text-text">`
    - [x] Inside: document icon (inline SVG), `<span className="truncate max-w-[24ch]">{attachment.name}</span>`, size span `<span className="text-muted shrink-0">{attachment.size > 0 ? formatBytes(attachment.size) : ""}</span>`
    - [x] `aria-label={t("detail_attachment_file_download_label", { name: attachment.name })}` (new key — see Task 4)
  - [x] All strings via existing `t()` keys where available — see i18n Key Reference

- [x] Task 2: Create `src/components/message/AttachmentBox.test.jsx` (AC: #4, #5)
  - [x] Mock `react-i18next` (`useTranslation: () => ({ t: (k, o) => (o ? \`\${k}:\${o.name}\` : k) })`)
  - [x] Test: `null` attachment → renders nothing
  - [x] Test: image attachment → renders `<img>` with correct src; link opens in new tab
  - [x] Test: non-image attachment → renders file chip with name and size; link has `download` attribute
  - [x] Test: `javascript:` URL → component renders nothing (URL guard fires)
  - [x] Test: `data:` URL → component renders nothing (URL guard fires)
  - [x] Test: image with broken src → triggers `onError` → falls back to file chip

- [x] Task 3: Modify `src/components/DetailPane.jsx` — fill in content (AC: #1, #3, #6, #7)
  - [x] **Verify Story 3.5 created this file** — if missing, stop and implement Story 3.5 first
  - [x] Check Story 3.5's prop contract for `DetailPane`:
    - [x] If `DetailPane` receives `{ notification }` as a prop from the host (App.jsx): proceed directly
    - [x] If `DetailPane` does its own Dexie lookup via `useParams + useLiveQuery`: adapt to that shape (do NOT add a second lookup; use what Story 3.5 established)
  - [x] Add `useEffect` that calls `subscriptionManager.markNotificationRead(notification.id)` when `notification` mounts with `notification.new === 1`; dep array: `[notification?.id]`
  - [x] Render title section: `<h2 className="text-title font-semibold text-text">{notification.title || notification.message}</h2>`
  - [x] Render `<PriorityBadge priority={notification.priority ?? 3} />` (shows only for P4/P5)
  - [x] Render full markdown body via `<MarkdownContent>` (Story 3.2) wrapped in a container:
    - [x] Container: `className="max-w-[70ch] leading-[1.5] text-body text-text"`
    - [x] Pass `notification.message` as the markdown source
    - [x] Wrap in try/catch; on failure render `<p className="text-body text-text">{notification.message}</p>` (raw text fallback, AC #3)
  - [x] Render tags row: `{unmatchedTags(notification.tags ?? []).map(tag => <TagChip key={tag} label={tag} />)}`
  - [x] Render `<AttachmentBox attachment={notification.attachment} />` (null-safe — shows nothing when no attachment)
  - [x] Render meta row: `<TopicChip name={subscriptionName} />` + `<span className="text-caption text-muted">{formatShortDateTime(notification.time, i18n.language)}</span>`
  - [x] The `subscriptionName` value: Story 3.5 must expose the subscription name; if not, use `notification.topic` as a fallback

- [x] Task 4: Add i18n keys to `public/static/langs/ko.json` AND `en.json` (AC: #4, #5)
  - [x] **REUSED** existing keys — do NOT add these (already in ko.json):
    - `"notifications_attachment_image"` = "첨부 이미지" (image alt text)
    - `"notifications_attachment_open_button"` = "첨부 파일 열기" (open link aria-label)
    - `"notifications_attachment_link_expired"` = "다운로드 링크 만료됨" (expiry state)
  - [x] **ADD NEW** to `ko.json`: `"detail_attachment_file_download_label": "파일 다운로드: {{name}}"`
  - [x] **ADD NEW** to `en.json`: `"detail_attachment_file_download_label": "Download file: {{name}}"`
  - [ ] Maintain valid JSON in both files — no trailing commas

---

## Dev Notes

### Hard Prerequisites (Do Not Start Until These Exist)

| Prerequisite | Story | Sprint Status | What You Need |
|---|---|---|---|
| `src/components/DetailPane.jsx` | 3.5 | **backlog** (no file yet) | The pane shell — **Story 3.6 Task 3 is fully blocked until Story 3.5 is done** |
| `src/components/message/MarkdownContent.jsx` | 3.2 | ready-for-dev (file not built yet) | `useRemark` wrapper with sanitized component map — **Task 3 blocked until 3.2 done** |
| `src/components/message/PriorityBadge.jsx` | 3.1 | **done ✅** | `PriorityBadge({ priority })` — exists, import from `./PriorityBadge` |
| `src/components/message/TopicChip.jsx` | 3.1 | **done ✅** | `TopicChip({ name, as?, onClick? })` — exists |
| `src/components/message/TagChip.jsx` | 3.1 | **done ✅** | `TagChip({ label })` — exists |

**Tasks 1 and 2 (`AttachmentBox` + its tests) are fully independent and have NO blockers — implement them first.**

---

### File Locations

| File | Action |
|---|---|
| `src/components/message/AttachmentBox.jsx` | **CREATE NEW** |
| `src/components/message/AttachmentBox.test.jsx` | **CREATE NEW** |
| `src/components/DetailPane.jsx` | **MODIFY** — add content sections (Story 3.5 creates the file; this story fills it) |
| `public/static/langs/ko.json` | **UPDATE** — add 3 new keys |

**Do NOT modify:**
- `src/components/message/NotificationCard.jsx` — G4 card signature is frozen after Story 3.1
- `src/components/message/MarkdownContent.jsx` — owned by Story 3.2; reuse as-is
- Any `ui/` primitive — they are done and stable

---

### Notification Data Model (Attachment Fields)

```js
// notification object shape relevant to Story 3.6
{
  id:         string,    // Dexie PK
  title:      string?,   // optional; if absent, use message as heading
  message:    string,    // markdown content for detail body
  priority:   number,    // 1–5; default 3 if absent → `notification.priority ?? 3`
  tags:       string[],  // raw tag array; pass through unmatchedTags() to strip emoji-mapped ones
  time:       number,    // Unix timestamp (seconds)
  topic:      string,    // topic name (fallback for subscriptionName)
  new:        number,    // 1 = unread, 0 = read
  attachment: {          // optional; undefined when no attachment
    url:      string,    // absolute URL to the attachment file
    name:     string,    // original filename e.g. "report.pdf"
    size:     number,    // file size in bytes (0 if unknown)
    type:     string?,   // MIME type e.g. "image/jpeg", "application/pdf" (optional)
    expires:  number?,   // Unix timestamp when attachment URL expires (optional)
  }
}
```

---

### AttachmentBox Component Architecture

```jsx
// src/components/message/AttachmentBox.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { isImage } from "@/app/notificationUtils";
import { formatBytes } from "@/app/utils";

const SAFE_URL = /^https?:\/\//i;

const DocumentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const AttachmentBox = ({ attachment }) => {
  const { t } = useTranslation();
  const [imgFailed, setImgFailed] = useState(false);

  if (!attachment) return null;
  if (!SAFE_URL.test(attachment.url)) return null;

  // Expired attachment — use existing key
  if (attachment.expires && attachment.expires * 1000 < Date.now()) {
    return <p className="text-body-sm text-muted">{t("notifications_attachment_link_expired")}</p>;
  }

  if (isImage(attachment) && !imgFailed) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("notifications_attachment_open_button")}
        className="block"
      >
        <img
          src={attachment.url}
          alt={t("notifications_attachment_image")}
          className="max-h-48 w-auto object-contain rounded-sm bg-surface-muted"
          onError={() => setImgFailed(true)}
        />
      </a>
    );
  }

  // File chip — used for non-image attachments AND as image fallback on load error
  return (
    <a
      href={attachment.url}
      download={attachment.name}
      aria-label={t("detail_attachment_file_download_label", { name: attachment.name })}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-sm bg-surface-muted border border-border text-body-sm text-text hover:bg-surface-active transition-colors"
    >
      <DocumentIcon />
      <span className="truncate max-w-[24ch]">{attachment.name}</span>
      {attachment.size > 0 && (
        <span className="text-muted text-caption shrink-0">{formatBytes(attachment.size)}</span>
      )}
    </a>
  );
};

export default AttachmentBox;
```

**Why the URL safety guard (`SAFE_URL.test`)?**
Attachment URLs originate from message content on the ntfy server — any publisher to Jay's topic can embed a `javascript:` or `data:` URL. The guard prevents link injection identical to the one `MarkdownContent` applies to markdown links.

**Why `imgFailed` state?**
When an image URL has expired or returns a 404, the `<img>` fires `onError`. We can't detect this without mounting the element first. The state flag swaps to the file chip fallback, so Jay sees the filename/size instead of a broken image — graceful degradation.

---

### DetailPane Content Architecture (Task 3)

The exact shape of `DetailPane.jsx` after Story 3.5 is unknown at story-write time. Adapt to whatever Story 3.5 established, but the rendered content order must be:

```
┌─────────────────────────────────────────────┐
│  [PriorityBadge]  Title                     │  ← header
│─────────────────────────────────────────────│
│  Full markdown body (max-w-[70ch])          │  ← body
│─────────────────────────────────────────────│
│  [AttachmentBox]  (if attachment present)   │  ← attachment
│─────────────────────────────────────────────│
│  [TagChip] [TagChip] …                      │  ← tags row
│─────────────────────────────────────────────│
│  [TopicChip]              timestamp         │  ← meta row
└─────────────────────────────────────────────┘
```

**Mark-as-read effect:**
```jsx
useEffect(() => {
  if (notification?.new === 1) {
    subscriptionManager.markNotificationRead(notification.id);
  }
}, [notification?.id]);
```
Place this at the top of the DetailPane component body. It fires when `notification.id` changes (new detail selected). The unread dot clears in the feed automatically via `useLiveQuery` reactivity — no local state needed.

**Referencing MarkdownContent** (after Story 3.2 is done):
```jsx
import MarkdownContent from "@/components/message/MarkdownContent";

// In the render — FULL body, NO line clamp (unlike CardBody which clamps to 3 lines):
<div className="max-w-[70ch] leading-[1.5] text-body text-text">
  <MarkdownContent content={notification.message} />
</div>
```

`MarkdownContent` from Story 3.2 accepts a `content` string prop (or check Story 3.2's actual export — adapt to whatever prop name was implemented). It handles XSS sanitization internally — do NOT add `dangerouslySetInnerHTML` or a second sanitizer.

**Raw text fallback (AC #3):**
```jsx
const [bodyFailed, setBodyFailed] = useState(false);

// In render:
{bodyFailed ? (
  <p className="max-w-[70ch] leading-[1.5] text-body text-text">
    {notification.message}
  </p>
) : (
  <ErrorBoundary onError={() => setBodyFailed(true)}>
    <div className="max-w-[70ch] leading-[1.5] text-body text-text">
      <MarkdownContent content={notification.message} />
    </div>
  </ErrorBoundary>
)}
```

`ErrorBoundary` already exists at `src/components/ErrorBoundary.jsx` — import and use it.

---

### Typography Tokens for NFR13

| Content | Token / Class | Value |
|---|---|---|
| Body text | `text-body` | 16px |
| Body line-height | `leading-[1.5]` | 1.5 |
| Code spans | `font-mono` + `text-mono` | 14px, JetBrains Mono |
| Caption / meta | `text-caption` | per token |
| Muted labels | `text-muted` | per token |

Verify that `MarkdownContent`'s component map (Story 3.2) already applies `font-mono` to `<code>` elements — if it does, no extra work needed in the detail pane. If not, override the `code` entry in the component map to add `text-[14px] font-mono`.

---

### SubscriptionManager API

```js
import subscriptionManager from "@/app/SubscriptionManager";

// Mark notification as read (sets new: 0 in Dexie, triggers useLiveQuery re-render in feed)
await subscriptionManager.markNotificationRead(notificationId);
```

This is the same call used in Story 3.4's overflow menu. Both paths (overflow menu + detail open) converge on this single API — keeping them consistent was explicit in Story 3.4 AC #5.

---

### Utility API Reference

```js
// src/app/notificationUtils.js
import { isImage } from "@/app/notificationUtils";
isImage({ type: "image/jpeg" })  // → true
isImage({ name: "photo.png" })   // → true (extension fallback)
isImage({ name: "report.pdf" })  // → false

// src/app/utils.js
import { formatBytes, formatShortDateTime, unmatchedTags } from "@/app/utils";
formatBytes(1048576)             // → "1 MB"
formatBytes(0)                   // → "0 Bytes"
formatShortDateTime(1234567890, "ko") // → locale-formatted string
unmatchedTags(["tag1", "smile"]) // → strips emoji-mapped tags (e.g. "smile" → removed)
```

---

### Architecture Boundary Summary

```
src/components/
├── DetailPane.jsx         ← MODIFY — content sections added here
├── message/
│   ├── AttachmentBox.jsx  ← CREATE NEW (domain-aware: knows ntfy attachment shape)
│   ├── MarkdownContent.jsx ← EXISTS after Story 3.2 (do NOT modify)
│   ├── PriorityBadge.jsx  ← EXISTS (import, don't recreate)
│   ├── TopicChip.jsx      ← EXISTS (import, don't recreate)
│   └── TagChip.jsx        ← EXISTS (import, don't recreate)
└── ui/
    └── (domain-ignorant primitives — no changes needed)
```

Import direction rules:
- `message/` → `app/` is **ALLOWED** — `AttachmentBox` imports `isImage`, `formatBytes`
- `message/` → `ui/` is **ALLOWED** — but no `ui/` imports needed for this story
- `ui/` → `message/` is **FORBIDDEN** (ESLint enforced)
- `app/` → `components/` is **FORBIDDEN** (ESLint enforced)

---

### i18n Key Reference

**Reuse these existing keys — do NOT redefine them:**
```json
"notifications_attachment_image":        "첨부 이미지"   ← image alt (AttachmentBox img alt)
"notifications_attachment_open_button":  "첨부 파일 열기" ← image link aria-label
"notifications_attachment_link_expired": "다운로드 링크 만료됨" ← expired state
```

**Add one new key to `ko.json`:**
```json
"detail_attachment_file_download_label": "파일 다운로드: {{name}}"
```

**Add the same new key to `en.json`:**

```json
"detail_attachment_file_download_label": "Download file: {{name}}"
```

Note on i18next interpolation: `{{name}}` is the i18next double-brace syntax. In the component:
```js
t("detail_attachment_file_download_label", { name: attachment.name })
// → "파일 다운로드: report.pdf"
```

The existing `notifications_attachment_*` keys live in the old `Notifications.jsx` component's namespace — reusing them is correct because the semantic is identical (same attachment data, same display intent).

---

### Korean Voice Rules (UX-DR12)

| String | Key | Value | Principle |
|---|---|---|---|
| Image alt text | `detail_attachment_image_alt` | 첨부 이미지 | Neutral, descriptive |
| Image open label | `detail_attachment_image_open_label` | 이미지 열기 | Verb on the action |
| File download label | `detail_attachment_file_download_label` | 파일 다운로드: {{name}} | Names the thing |

No exclamation marks, no emoji, 해요체 tone throughout.

---

### Testing Approach for AttachmentBox

```jsx
// src/components/message/AttachmentBox.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AttachmentBox from "./AttachmentBox";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k, opts) => opts?.name ? `${k}:${opts.name}` : k,
  }),
}));
// notificationUtils and utils are NOT mocked — use real implementations

const imageAttachment = { url: "https://example.com/photo.jpg", name: "photo.jpg", size: 12345, type: "image/jpeg" };
const fileAttachment  = { url: "https://example.com/report.pdf", name: "report.pdf", size: 98765 };
const dangerUrl       = { url: "javascript:alert(1)", name: "x.jpg", size: 0, type: "image/jpeg" };
const dataUrl         = { url: "data:text/html,<h1>x</h1>", name: "x.html", size: 0 };

describe("AttachmentBox — null guard", () => {
  it("renders nothing when attachment is null", () => {
    const { container } = render(<AttachmentBox attachment={null} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("AttachmentBox — URL safety", () => {
  it("renders nothing for javascript: URL", () => {
    const { container } = render(<AttachmentBox attachment={dangerUrl} />);
    expect(container.firstChild).toBeNull();
  });
  it("renders nothing for data: URL", () => {
    const { container } = render(<AttachmentBox attachment={dataUrl} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("AttachmentBox — image", () => {
  it("renders img with correct src", () => {
    render(<AttachmentBox attachment={imageAttachment} />);
    expect(screen.getByRole("img")).toHaveAttribute("src", imageAttachment.url);
  });
  it("wraps image in a new-tab link", () => {
    render(<AttachmentBox attachment={imageAttachment} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", imageAttachment.url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
  it("falls back to file chip on image load error", () => {
    render(<AttachmentBox attachment={imageAttachment} />);
    fireEvent.error(screen.getByRole("img"));
    // After error, img should be gone, download link should appear
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByRole("link")).toHaveAttribute("download", imageAttachment.name);
  });
});

describe("AttachmentBox — file chip", () => {
  it("renders filename and formatted size", () => {
    render(<AttachmentBox attachment={fileAttachment} />);
    expect(screen.getByText(fileAttachment.name)).toBeInTheDocument();
    // formatBytes(98765) → "96.45 KB" or similar — just check it's present
    const sizeEl = screen.getByText(/KB|MB|Bytes/);
    expect(sizeEl).toBeInTheDocument();
  });
  it("link has download attribute with filename", () => {
    render(<AttachmentBox attachment={fileAttachment} />);
    expect(screen.getByRole("link")).toHaveAttribute("download", fileAttachment.name);
  });
});
```

No `fake-indexeddb` needed — `AttachmentBox` has no Dexie access.

---

### Critical Anti-Patterns to Avoid

```jsx
// ✗ Adding dangerouslySetInnerHTML for markdown
<div dangerouslySetInnerHTML={{ __html: marked(notification.message) }} />
// MarkdownContent already handles XSS-safe rendering via useRemark

// ✗ Using CardBody instead of MarkdownContent directly
<CardBody notification={notification} />
// CardBody clamps to 3 lines + has expand toggle — that's card behavior.
// In detail, use <MarkdownContent content={notification.message} /> directly (no clamp).

// ✗ Reading attachment URL without the SAFE_URL guard
<img src={notification.attachment.url} />
// Publishers can inject javascript: or data: URLs — always validate to http/https

// ✗ Copying subscriptionManager.markNotificationRead logic from scratch
// Call the same imported function used in CardOverflowMenu — one API, two call sites

// ✗ Storing notification in local state after useLiveQuery
const [notif, setNotif] = useState(null); // WRONG
useEffect(() => setNotif(dexieResult), [dexieResult]); // WRONG
// Dexie result goes straight to render — no useState copy

// ✗ Importing AttachmentBox from ui/ or putting it there
import AttachmentBox from "@/components/ui/AttachmentBox"; // WRONG
// AttachmentBox is domain-aware (knows ntfy attachment shape); it belongs in message/

// ✗ Hardcoded Korean strings
<span>첨부 이미지</span>  // WRONG — use t("detail_attachment_image_alt")

// ✗ Modifying NotificationCard.jsx to pass through to DetailPane
// DetailPane is a sibling, not a child of NotificationCard — they are separate layout zones

// ✗ Two routes for desktop/mobile detail
// One route /:topic/:msgId; CSS breakpoint splits the layout — not the router
```

---

### Dependency Story Status Warning

Both critical prerequisites are NOT yet implemented at story-write time:

| Story | What Is Needed | Current Status |
|---|---|---|
| **3.5** (detail host + SelectionContext) | `DetailPane.jsx` shell + routing | **backlog** — no story file yet |
| **3.2** (CardBody + MarkdownContent) | `MarkdownContent.jsx` | **ready-for-dev** — file exists, not built |

**Recommended implementation approach:**
1. **Do Tasks 1 and 2 immediately** — `AttachmentBox.jsx` and its tests have zero blockers
2. **Do Task 4 immediately** — add i18n keys (no blockers)
3. **Wait for Story 3.5 to ship** — Task 3 (`DetailPane` content) requires the shell to exist
4. **Wait for Story 3.2 to ship** — Task 3 also requires `MarkdownContent.jsx`

If implementing Stories 3.2, 3.5, and 3.6 in the same session: implement 3.2 → 3.5 → 3.6 in that order.

---

### Project Structure Notes

- `AttachmentBox.jsx` belongs in `src/components/message/` — it is domain-aware (it knows the ntfy attachment data shape, uses `isImage` from `notificationUtils`, and understands "image vs file" in the context of notifications)
- `message/` currently contains: `EmptyStates.jsx`, `EmptyStates.test.jsx`, `NotificationCard.jsx`, `PriorityBadge.jsx`, `TagChip.jsx`, `TopicChip.jsx` — all built in Stories 2.6 and 3.1
- `DetailPane.jsx` lives at the flat `src/components/` level (not inside `message/`) — it is a screen-level component that composes `message/` components

---

### References

- Epic spec: `_bmad-output/planning-artifacts/epics.md` § Story 3.6
- UX detail panel: `_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/EXPERIENCE.md` § Component Patterns + Responsive
- UX typography: `_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/DESIGN.md` § Typography + NFR13
- Architecture detail pane: `_bmad-output/planning-artifacts/architecture.md` § Frontend Architecture (routing + SelectionContext + DetailPane)
- Architecture component directory: `_bmad-output/planning-artifacts/architecture.md` § Complete Project Directory Structure
- MarkdownContent API: `src/components/message/MarkdownContent.jsx` (Story 3.2 output — verify prop name)
- PriorityBadge: `src/components/message/PriorityBadge.jsx` (exists — `PriorityBadge({ priority })`)
- TopicChip: `src/components/message/TopicChip.jsx` (exists — `TopicChip({ name, as?, onClick? })`)
- TagChip: `src/components/message/TagChip.jsx` (exists — `TagChip({ label })`)
- isImage utility: `src/app/notificationUtils.js` lines 39–48
- formatBytes: `src/app/utils.js` line 185
- formatShortDateTime: `src/app/utils.js` line 150
- unmatchedTags: `src/app/utils.js` (emoji-mapped tag filtering — same usage as NotificationCard)
- subscriptionManager.markNotificationRead: `src/app/SubscriptionManager.js` (same call as Story 3.4)
- ErrorBoundary: `src/components/ErrorBoundary.jsx` (exists — use for markdown body fallback)
- Korean voice: `_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/EXPERIENCE.md` § Voice and Tone
- Previous story pattern: `_bmad-output/implementation-artifacts/3-4-card-overflow-actions-read-copy-delete.md` (same message/ module patterns, i18n approach)
- Story 3.5 (creates DetailPane shell): `_bmad-output/implementation-artifacts/3-5-url-as-source-of-truth-selection-detail-host.md` (when created)

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Task 1: `AttachmentBox.jsx` created with SAFE_URL guard, image/file-chip paths, expired-link state, imgFailed fallback. 11 unit tests pass.
- Task 2: `AttachmentBox.test.jsx` created using project's createRoot+act pattern (no @testing-library/react). Covers null guard, URL safety (javascript:/data:), image rendering, file chip, image error fallback.
- Task 3: `DetailPane.jsx` modified with full content: title (h2 + mobile a11y ref), PriorityBadge, MarkdownContent wrapped in inline MarkdownBoundary class, AttachmentBox (conditional), tags row, meta row (TopicChip + formatShortDateTime). useEffect marks notification read only when `new === 1`. subscriptionName derived via Dexie subscriptions lookup with notification.topic fallback.
- Task 4: Added `detail_attachment_file_download_label` to both `en.json` and `ko.json`. Also added `detail_back_button` and `detail_loading_placeholder` keys which were needed by Story 3.5 i18n.
- Note: `useActiveTopic` in hooks.js was NOT changed (returns subscription object, not string) since Feed.jsx already relies on this behavior. DetailPane uses `useSelection()` directly from SelectionContext.
- All 317 tests pass. Build compiles cleanly.

### File List

- `src/components/message/AttachmentBox.jsx` (created)
- `src/components/message/AttachmentBox.test.jsx` (created)
- `src/components/DetailPane.jsx` (modified — Story 3.5 shell extended with Story 3.6 full content)
- `public/static/langs/ko.json` (modified — added `detail_attachment_file_download_label`, `detail_back_button`, `detail_loading_placeholder`)
- `public/static/langs/en.json` (modified — added `detail_attachment_file_download_label`, `detail_back_button`, `detail_loading_placeholder`)
