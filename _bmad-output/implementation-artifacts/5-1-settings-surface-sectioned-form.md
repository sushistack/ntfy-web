---
baseline_commit: 1ab62c8
---

# Story 5.1: Settings Surface — Sectioned Form

Status: review

## Story

As Jay,
I want one place to configure everything,
so that I control server, appearance, sound, and retention (FR15, UX-DR10).

## Blocking Dependencies

Story 5-1 can start independently, but these prior stories must be `done` for their components/contexts to exist:
- **Story 2.2** (`ThemeContext.jsx`, `useTheme()`, `setChoice()`) — theme segmented control reuses this
- **Story 2.4** (`ServerAuthForm.jsx`) — 서버·인증 section embeds this component
- **Story 1.8** (`Switch.jsx`, `Tabs.jsx`) — toggle and segmented controls come from here
- **Story 1.7** (`Menu`, `Popover`) — select-style controls come from here

All four are `done` in sprint-status.yaml. ✅

## Acceptance Criteria

1. **Given** the settings route (`/settings`) is rendered inside NewShell,
   **when** the page loads,
   **then** a left icon-nav lists five sections — 일반 · 서버·인증 · 모양·테마 · 알림·소리 · 보존·삭제 — with a gray (`bg-surface-2`) active surface and no color accent on the active item.

2. **And** clicking a nav item shows only that section's content in the right content pane; the active section is keyboard-navigable and announces `aria-current="page"` on the active nav item.

3. **And** the 서버·인증 section embeds the existing `ServerAuthForm` component unchanged — no modifications to `ServerAuthForm.jsx`; its white "설정 저장" (`server_auth_form_save_button`) button is the primary save action for that section.

4. **And** the 모양·테마 section renders a segmented control (`TabsRoot/TabsList/TabsTrigger`) wired to `useTheme()`; changing the selection calls `setChoice('light'|'dark'|'system')` immediately (no separate save button); the current choice is pre-selected on render.

5. **And** the 알림·소리 section contains:
   - Sound selector (select/Menu control, dark-fill) wired to `prefs.sound()` via `useLiveQuery`; on change calls `prefs.setSound()` immediately
   - Min priority selector wired to `prefs.minPriority()` via `useLiveQuery`; on change calls `prefs.setMinPriority()` immediately
   - Web push toggle (`Switch`) wired to `prefs.webPushEnabled()` via `useLiveQuery`; on change calls `prefs.setWebPushEnabled()` immediately; toggle ON = green (accent token); actual permission request is story 5.2 and must NOT be added here

6. **And** the 보존·삭제 section contains a delete-after selector (select/Menu, dark-fill) wired to `prefs.deleteAfter()` via `useLiveQuery`; on change calls `prefs.setDeleteAfter()` immediately; the existing `Pruner.js` reads this value on its next cycle — no Pruner change needed.

7. **And** the 일반 section contains a language selector wired to `i18n.changeLanguage()` (reading the current language from `i18n.resolvedLanguage`); immediately changes language on selection.

8. **And** all user-facing strings including `aria-label`/`title` attributes go through `t()` — no hardcoded Korean (ESLint `no-literal-string` enforced).

9. **And** the surface passes its a11y AC: full keyboard navigation across the left nav, visible focus via `focus-ring` token, proper `role`/`aria-*` on all controls, no focus traps.

10. **And** `NEW.settings` in `src/config/migration.js` is flipped to `true` after implementation, and `App.jsx` (NewShell) routes `/settings` to `<SettingsPage />` when `NEW.settings` is true (else falls back to `<ServerAuthForm />`).

## Tasks / Subtasks

- [x] Task 1: Create `src/components/SettingsPage.jsx` — the new settings surface (AC: #1–#9)
  - [x] Layout: two-column flex (`min-h-screen`): left nav (fixed width, e.g. `w-16 md:w-52`) + right content pane (`flex-1 overflow-y-auto`)
  - [x] State: `const [activeSection, setActiveSection] = useState('general')` — sections: `'general' | 'server' | 'appearance' | 'notifications' | 'retention'`
  - [x] Left nav: render 5 `<button>` items, each with icon SVG + label; active item gets `bg-surface-2`, others hover-surface; `aria-current={activeSection === section ? "page" : undefined}`; focus via `focus-ring` token
  - [x] Section structure: `<SectionHeading title={t(...)} hint={t(...)} />` helper component — renders heading text + hint below + bottom border/divider; reuse for each section
  - [x] **일반 section**: language selector — `<select>` styled as dark-fill (see styling notes below), `value={i18n.resolvedLanguage}`, `onChange={e => i18n.changeLanguage(e.target.value)}`; use existing language list (Korean, English minimum; full list from old Preferences.jsx)
  - [x] **서버·인증 section**: `<ServerAuthForm />` — import and render, zero props; section heading wraps it
  - [x] **모양·테마 section**: `<TabsRoot value={choice} onValueChange={setChoice}><TabsList><TabsTrigger value="light">{t('theme_light')}</TabsTrigger><TabsTrigger value="dark">{t('theme_dark')}</TabsTrigger><TabsTrigger value="system">{t('theme_system')}</TabsTrigger></TabsList></TabsRoot>` — `choice`/`setChoice` from `useTheme()`
  - [x] **알림·소리 section**: three controls stacked as labeled rows:
    - Sound: `useLiveQuery(() => prefs.sound())` → `<select>` with `sounds` options from `src/app/utils.js`; `onChange={e => prefs.setSound(e.target.value)}`
    - Min priority: `useLiveQuery(() => prefs.minPriority())` → `<select>` with priority options; `onChange={e => prefs.setMinPriority(Number(e.target.value))}`
    - Web push: `useLiveQuery(() => prefs.webPushEnabled())` → `<Switch checked={!!enabled} onCheckedChange={v => prefs.setWebPushEnabled(v)} />` — use `Switch` from `@/components/ui/Switch`
  - [x] **보존·삭제 section**: `useLiveQuery(() => prefs.deleteAfter())` → `<select>` with the 5 retention options (see Dev Notes for values); `onChange={e => prefs.setDeleteAfter(Number(e.target.value))}`
  - [x] Guard all `useLiveQuery` results with `?? defaultValue` before rendering selects to avoid undefined on cold mount
  - [x] Tokens only — no raw hex/px; use `bg-surface`, `bg-surface-2`, `text-foreground`, `text-muted`, `border-border`, `focus:ring-focus-ring`, `rounded-sm`, `text-body-sm`

- [x] Task 2: Wire `SettingsPage` into `App.jsx` + flip migration flag (AC: #10)
  - [x] In `src/components/App.jsx`, add `import SettingsPage from "./SettingsPage"` and `import { NEW } from "../config/migration"` (already imported)
  - [x] In NewShell's route for settings (line ~182): change `element={<ServerAuthForm />}` to `element={NEW.settings ? <SettingsPage /> : <ServerAuthForm />}`
  - [x] In `src/config/migration.js`: flip `settings: true`

- [x] Task 3: Add i18n keys (AC: #8)
  - [x] Add to `public/static/langs/en.json` under a `# Settings surface` comment block:
    - `"settings_nav_general"`: `"General"`
    - `"settings_nav_server_auth"`: `"Server & Auth"`
    - `"settings_nav_appearance"`: `"Appearance"`
    - `"settings_nav_notifications"`: `"Notifications"`
    - `"settings_nav_retention"`: `"Retention"`
    - `"settings_general_hint"`: `"Language and basic preferences"`
    - `"settings_server_hint"`: `"Server URL and access credentials"`
    - `"settings_appearance_hint"`: `"Display theme"`
    - `"settings_notifications_hint"`: `"Sound and notification delivery"`
    - `"settings_retention_hint"`: `"Message storage and auto-delete policy"`
    - `"settings_language_label"`: `"Language"`
    - `"settings_sound_label"`: `"Notification sound"`
    - `"settings_min_priority_label"`: `"Minimum priority"`
    - `"settings_web_push_label"`: `"Background notifications"`
    - `"settings_delete_after_label"`: `"Delete notifications after"`
  - [x] Add to `public/static/langs/ko.json` same keys:
    - `"settings_nav_general"`: `"일반"`
    - `"settings_nav_server_auth"`: `"서버·인증"`
    - `"settings_nav_appearance"`: `"모양·테마"`
    - `"settings_nav_notifications"`: `"알림·소리"`
    - `"settings_nav_retention"`: `"보존·삭제"`
    - `"settings_general_hint"`: `"언어 및 기본 설정"`
    - `"settings_server_hint"`: `"서버 URL 및 인증 정보"`
    - `"settings_appearance_hint"`: `"표시 테마"`
    - `"settings_notifications_hint"`: `"효과음 및 알림 전달"`
    - `"settings_retention_hint"`: `"메시지 저장 및 자동 삭제 정책"`
    - `"settings_language_label"`: `"언어"`
    - `"settings_sound_label"`: `"알림 효과음"`
    - `"settings_min_priority_label"`: `"최소 우선순위"`
    - `"settings_web_push_label"`: `"백그라운드 알림"`
    - `"settings_delete_after_label"`: `"알림 자동 삭제"`

## Dev Notes

### Architecture Hard Rules
- **Tokens only** — no raw hex/px in any JSX style; use `bg-surface`, `bg-surface-2`, `text-foreground`, `text-muted`, `border-border`, `rounded-sm`, `rounded-md`, `focus:ring-accent-ui`. Raw px only with `/* layout-nudge: <why> */`.
- **No hardcoded Korean** — all strings via `t()` (ESLint `no-literal-string` enforced).
- **`useLiveQuery` returns `undefined` on first render** — always guard: `const sound = useLiveQuery(() => prefs.sound()) ?? 'ding'` before using the value in a select. Without this guard, controlled select throws on cold mount.
- **Dexie is single source of truth** — never copy a `useLiveQuery` result into `useState`. Read live, write via `prefs.setX()`.
- **`contexts/` must NOT import `useLiveQuery`** — this rule does NOT apply to `SettingsPage.jsx` which lives in `components/` (not `contexts/`). Reading prefs with `useLiveQuery` in a component is correct.
- **No modifications to `ServerAuthForm.jsx`** — story 5-1 only embeds it; behavioral changes belong in a separate story.
- **`ThemeContext` pattern** — `useTheme()` returns `{ choice, setChoice }`. `choice` is `'light' | 'dark' | 'system'`. Calling `setChoice` persists to IndexedDB AND applies `.dark` class immediately — no separate save needed.
- **Migration flag pattern** — flip `settings: true` AFTER verifying the page works correctly end-to-end. The flag gates are independent: even with `NEW.settings: true`, `NEW.shell` must also be `true` for the new settings to be reached (NewShell is the outer gate).

### Dark-fill Select Styling (reference)
Use native `<select>` styled with Tailwind tokens — matches the "dark-fill controls" spec:
```jsx
<select
  className="w-full rounded-sm bg-surface-2 border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent-ui appearance-none"
  value={value}
  onChange={e => handler(e.target.value)}
>
  <option value="...">...</option>
</select>
```
`appearance-none` removes the default OS chrome so the dark background shows. Add a custom caret SVG or use a wrapper with a positioned icon if needed.

### Left Nav Styling
```jsx
<nav aria-label={t('nav_button_settings')}>
  {sections.map(s => (
    <button
      key={s.id}
      onClick={() => setActiveSection(s.id)}
      aria-current={activeSection === s.id ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 w-full px-3 py-2 rounded-md text-body-sm transition-colors',
        activeSection === s.id
          ? 'bg-surface-2 text-foreground font-medium'
          : 'text-muted hover:bg-surface-2/50'
      )}
    >
      {s.icon}
      <span className="hidden md:inline">{t(s.labelKey)}</span>
    </button>
  ))}
</nav>
```

### Section Heading Helper
```jsx
const SectionHeading = ({ title, hint }) => (
  <div className="mb-6">
    <h2 className="text-heading-sm font-semibold text-foreground">{title}</h2>
    {hint && <p className="text-body-sm text-muted mt-0.5">{hint}</p>}
    <div className="mt-3 border-t border-border" />
  </div>
);
```

### Labeled Setting Row Pattern
For sound/priority/web-push/delete-after, use a consistent row layout:
```jsx
const SettingRow = ({ label, children }) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
    <span className="text-body-sm text-foreground">{label}</span>
    <div className="shrink-0">{children}</div>
  </div>
);
```

### `deleteAfter` Option Values (from old Preferences.jsx)
```js
const DELETE_AFTER_OPTIONS = [
  { value: 0,       labelKey: 'prefs_notifications_delete_after_never' },
  { value: 10800,   labelKey: 'prefs_notifications_delete_after_three_hours' },
  { value: 86400,   labelKey: 'prefs_notifications_delete_after_one_day' },
  { value: 604800,  labelKey: 'prefs_notifications_delete_after_one_week' },  // default
  { value: 2592000, labelKey: 'prefs_notifications_delete_after_one_month' },
];
```
Default is `604800` (one week). Guard: `const deleteAfter = useLiveQuery(() => prefs.deleteAfter()) ?? 604800`.

### `minPriority` Option Values
```js
const MIN_PRIORITY_OPTIONS = [
  { value: 1, labelKey: 'prefs_notifications_min_priority_any' },
  { value: 2, labelKey: 'prefs_notifications_min_priority_low_and_higher' },
  { value: 3, labelKey: 'prefs_notifications_min_priority_default_and_higher' },
  { value: 4, labelKey: 'prefs_notifications_min_priority_high_and_higher' },
  { value: 5, labelKey: 'prefs_notifications_min_priority_max_only' },
];
```
Default is `1`. Guard: `const minPriority = useLiveQuery(() => prefs.minPriority()) ?? 1`.

### Sound Options
Import `sounds` from `src/app/utils.js`:
```js
import { sounds } from '../app/utils';
// sounds is an object: { none: { label: 'No sound' }, ding: { label: 'Ding' }, ... }
const soundOptions = [
  { value: 'none', label: t('prefs_notifications_sound_no_sound') },
  ...Object.entries(sounds).map(([key, { label }]) => ({ value: key, label })),
];
```
Guard: `const sound = useLiveQuery(() => prefs.sound()) ?? 'ding'`.

### Language Options
Import `i18n` from `../app/i18n` and use `i18n.resolvedLanguage` for current selection:
```js
import { useTranslation } from 'react-i18next';
import i18n from '../app/i18n';
// In component:
const { i18n: i18nInst } = useTranslation();
// onChange: i18nInst.changeLanguage(e.target.value);
```
Minimum language list: Korean (`ko`) and English (`en`). Full list available in the old `Preferences.jsx` if needed. Keep only languages that have translation files in `public/static/langs/`.

### Web Push Toggle Note
The `Switch` toggle for web push in the 알림·소리 section should be wired to read/write `prefs.webPushEnabled()` only. Do NOT add any `Notification.requestPermission()` call — that is story 5-2's scope. If the user flips the toggle on, the pref is saved, but no browser permission dialog is shown yet.

### What the Old `Preferences.jsx` Does That's OUT OF SCOPE for 5-1
- **Multi-user management** (`UserTable`, `UserDialog`) — trimmed feature, not rebuilt
- **Reservations** (`ReservationsTable`) — trimmed feature, not rebuilt
- **Account sync** (`maybeUpdateAccountSettings()`) — backend account API is removed
- These sections must NOT be reimplemented

### `App.jsx` — Expected State After 5-1 (NewShell routing)
```jsx
// Before (current):
<Route path={routes.settings} element={<ServerAuthForm />} />

// After (story 5-1):
<Route path={routes.settings} element={NEW.settings ? <SettingsPage /> : <ServerAuthForm />} />
```
`NEW.settings` in `migration.js` is flipped to `true` as the final step of this story.

### File List (all files touched by this story)
- **NEW**: `src/components/SettingsPage.jsx`
- **UPDATE**: `src/components/App.jsx` — gate SettingsPage with `NEW.settings` flag
- **UPDATE**: `src/config/migration.js` — `settings: true`
- **UPDATE**: `public/static/langs/en.json` — 15 new keys
- **UPDATE**: `public/static/langs/ko.json` — 15 new keys

### References
- Old MUI settings component: [`src/components/Preferences.jsx`](../../src/components/Preferences.jsx) — understand what's being rebuilt; do NOT import anything from it
- Old settings row helper: [`src/components/Pref.jsx`](../../src/components/Pref.jsx) — Tailwind equivalent is the `SettingRow` pattern above
- 서버·인증 form (embed unchanged): [`src/components/ServerAuthForm.jsx`](../../src/components/ServerAuthForm.jsx)
- Theme context: [`src/components/contexts/ThemeContext.jsx`](../../src/components/contexts/ThemeContext.jsx)
- Prefs storage: [`src/app/Prefs.js`](../../src/app/Prefs.js)
- Pruner (no change needed): [`src/app/Pruner.js`](../../src/app/Pruner.js)
- Switch primitive: [`src/components/ui/Switch.jsx`](../../src/components/ui/Switch.jsx)
- Tabs primitive: [`src/components/ui/Tabs.jsx`](../../src/components/ui/Tabs.jsx)
- Migration flags: [`src/config/migration.js`](../../src/config/migration.js)
- UX Beszel pattern spec: [`_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/DESIGN.md`](../_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/DESIGN.md) §8 Settings
- App routing: [`src/components/App.jsx`](../../src/components/App.jsx) line ~182

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — clean implementation, build and all 360 tests passed on first attempt.

### Completion Notes List

- Created `src/components/SettingsPage.jsx` with two-column layout: left icon-nav (5 sections) + right content pane
- Local helper components `SectionHeading`, `SettingRow`, `SelectControl`, `NavIcon` keep the file self-contained
- All five sections implemented: 일반 (language), 서버·인증 (ServerAuthForm embed), 모양·테마 (theme tabs), 알림·소리 (sound/priority/webpush), 보존·삭제 (deleteAfter)
- All `useLiveQuery` results guarded with `?? defaultValue` to prevent cold-mount undefined errors
- Focus rings use `focus-ring` token (`focus-visible:ring-focus-ring`) throughout, matching Switch/Tabs primitives
- `ServerAuthForm` embedded with zero props — no modifications made to that file
- `NEW.settings` flipped to `true` in `migration.js` as the final wiring step
- App.jsx route updated: `NEW.settings ? <SettingsPage /> : <ServerAuthForm />`
- 15 i18n keys added to both en.json and ko.json
- Build: ✅ clean (no errors) | Tests: ✅ 360/360 passed

### File List

- NEW: `src/components/SettingsPage.jsx`
- UPDATE: `src/components/App.jsx`
- UPDATE: `src/config/migration.js`
- UPDATE: `public/static/langs/en.json`
- UPDATE: `public/static/langs/ko.json`

## Change Log

- 2026-06-20: Story 5-1 implemented — new SettingsPage with five-section nav, wired into App.jsx with NEW.settings gate, migration flag flipped to true, 15 i18n keys added to en/ko.
