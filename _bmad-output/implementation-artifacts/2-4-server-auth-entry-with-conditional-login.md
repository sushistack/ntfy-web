---
baseline_commit: 257552137c60518011b27ca2d97fd44d7a127bee
---

# Story 2.4: Server + Auth Entry with Conditional Login

Status: review

## Story

As Jay,
I want to enter my server URL and credentials,
so that the app can connect and subscribe on my behalf (FR1, FR19).

## Acceptance Criteria

1. **Given** the 서버·인증 entry surface, **when** Jay enters server URL + token or basic auth and saves, **then** credentials are stored via the existing `UserManager`/`Session` plumbing (no API changes) and the connection attempts with them on the next subscribe.

2. **And** **given** `config.require_login` is `true`, **when** the app loads unauthenticated (no active session), **then** a login UI renders (Tailwind-rebuilt `Login.jsx`); **given** it is `false` (Jay's setup), **then** no login UI appears and credentials are just stored settings.

3. **And** account / signup / billing / reserved / token-management surfaces are not reachable — their routes (`/signup`, `/account`) are removed from `routes.js`.

4. **And** on wrong URL/auth, the ConnectionIndicator returns to "연결 끊김", and the entered values are retained in the form for a quick fix (copy: `"주소와 인증을 확인해 주세요."` — used by the not-connected state panel in Story 2.6).

5. **And** all user-facing strings (labels, placeholders, button text, error messages) route through `t()` — no hardcoded Korean or English strings in JSX.

6. **And** the server URL field reads the current saved credentials from `userManager.get(config.base_url)` on mount, pre-filling existing values so a re-visit retains what was saved.

## Tasks / Subtasks

- [x] Task 1: Create `src/components/ServerAuthForm.jsx` (AC: #1, #4, #5, #6)
  - [x] Read saved user from `useLiveQuery(() => userManager.get(config.base_url), [])` to pre-fill fields on mount
  - [x] Form fields: server URL (read-only display — `config.base_url` is runtime-configured, not editable here), auth type toggle (`token` | `password`), username, token OR password field
  - [x] On save: call `await userManager.save({ baseUrl: config.base_url, username, [authType === 'token' ? 'token' : 'password']: credential })`
  - [x] On success: no toast — quiet success per voice rules; ConnectionContext will reflect the new connection attempt when a subscription triggers
  - [x] On `userManager.save` error: show inline error text via `t()` key `server_auth_form_save_error`
  - [x] Save button: achromatic white `variant="primary"` `<Button>` from `ui/Button.jsx` (NEVER green per UX-DR6); label `t("server_auth_form_save_button")` → "설정 저장"
  - [x] All field labels, placeholders, and aria-labels route through `t()`
  - [x] Use `useLiveQuery` for the read; do NOT copy into `useState` (Dexie rule)

- [x] Task 2: Rebuild `src/components/Login.jsx` from MUI → Tailwind (AC: #2, #5)
  - [x] Guard: `if (!config.require_login) return null` — never renders when `require_login` is false
  - [x] Fields: username + password (Tailwind `<input>` styled with token classes, NOT MUI TextField)
  - [x] Password visibility toggle using a plain icon button (no MUI `InputAdornment`)
  - [x] Submit handler preserves existing logic: `await accountApi.login({ username, password })` → `await session.store(username, token)` → `window.location.href = routes.app`
  - [x] On `UnauthorizedError`: show inline error `t("login_error_invalid_credentials")` (reuse or add key)
  - [x] Remove import of `@mui/*` entirely — all styling via Tailwind token classes
  - [x] Remove signup link (`config.enable_signup` branch) — account creation surfaces are trimmed
  - [x] Remove import of `AvatarBox` (MUI-based wrapper) — wrap with a simple centered `<div>` instead
  - [x] Keep import of `accountApi`, `session`, `routes`, `UnauthorizedError`, `useTranslation`

- [x] Task 3: Update `src/components/routes.js` (AC: #3)
  - [x] Remove `signup: "/signup"` and `account: "/account"` keys
  - [x] Keep `login: "/login"` (still needed for `require_login=true` flow)
  - [x] Keep `app`, `settings`, `subscription`, `subscriptionExternal`, `forSubscription`
  - [x] Add `settings: "/settings"` if not already present (placeholder for the full surface in 5.1)

- [x] Task 4: Update `src/config/migration.js` (AC: #2)
  - [x] Add `auth: false` flag to the `NEW` object (analogous to `shell`, `feed`, etc.)
  - [x] This story's implementation sets `auth: true` when complete

- [x] Task 5: Wire `ServerAuthForm` into a settings route (AC: #1, #4)
  - [x] Depends on Story 2.1's `App.jsx` for the route host. If 2.1 is done, add `<Route path={routes.settings} element={<ServerAuthForm />} />` inside the migrated routes block.
  - [x] If 2.1 is not yet merged, add a `// TODO 2.4: mount ServerAuthForm at routes.settings` comment in App.jsx and note in Dev Agent Record.
  - [x] The not-connected `StatePanel` CTA ("설정 열기") from Story 2.6 will link to `routes.settings`.

- [x] Task 6: Add i18n keys to `public/static/langs/en.json` and `ko.json` (AC: #5)
  - [x] `"server_auth_form_server_url_label"` → en: `"Server URL"` / ko: `"서버 URL"`
  - [x] `"server_auth_form_auth_type_label"` → en: `"Auth type"` / ko: `"인증 방식"`
  - [x] `"server_auth_form_auth_type_token"` → en: `"Access token"` / ko: `"액세스 토큰"`
  - [x] `"server_auth_form_auth_type_password"` → en: `"Username + password"` / ko: `"사용자 이름 + 비밀번호"`
  - [x] `"server_auth_form_username_label"` → en: `"Username"` / ko: `"사용자 이름"`
  - [x] `"server_auth_form_token_label"` → en: `"Access token"` / ko: `"액세스 토큰"`
  - [x] `"server_auth_form_password_label"` → en: `"Password"` / ko: `"비밀번호"`
  - [x] `"server_auth_form_save_button"` → en: `"Save settings"` / ko: `"설정 저장"`
  - [x] `"server_auth_form_save_error"` → en: `"Failed to save. Try again."` / ko: `"저장하지 못했습니다. 다시 시도해 주세요."`
  - [x] `"login_error_invalid_credentials"` → en: `"Invalid username or password"` / ko: `"사용자 이름 또는 비밀번호가 맞지 않습니다"`
  - [x] Check existing keys before adding to avoid duplicates — `login_title`, `login_form_button_submit` already exist

- [x] Task 7: Tests (AC: #1, #2)
  - [x] `src/components/ServerAuthForm.test.jsx` — test that save button calls `userManager.save` with correct shape for token auth and for password auth
  - [x] Test that pre-fill reads from `userManager.get()` (mock the return value)
  - [x] `src/components/Login.test.jsx` — test that `config.require_login = false` renders `null`; test submit handler calls `accountApi.login` and `session.store`

## Dev Notes

### CRITICAL: The two distinct auth systems

There are **two separate auth systems** in the codebase — do NOT conflate them:

| System | File | When used | What stores |
|---|---|---|---|
| **Account session** (`Session.js`) | `src/app/Session.js` | `config.require_login === true` only — user has a ntfy account | `localStorage.user` + `localStorage.token` + IndexedDB `session-replica` |
| **Per-server user credentials** (`UserManager.js`) | `src/app/UserManager.js` | Always — for accessing protected topics | Dexie `users` table: `{ baseUrl, username, token \| password }` |

Story 2.4 builds:
- **For `require_login=false` (Jay's setup):** `ServerAuthForm.jsx` saves to `UserManager` only (no session involved).
- **For `require_login=true`:** Rebuilt `Login.jsx` uses `accountApi.login()` → `session.store()` (existing flow, just MUI removed).

### CRITICAL: `userManager.save()` shape

```js
// Token auth (preferred for ntfy)
await userManager.save({ baseUrl: config.base_url, username: "jay", token: "tk_abc123" });

// Basic auth
await userManager.save({ baseUrl: config.base_url, username: "jay", password: "secret" });
```

`maybeWithAuth` in `utils.js:92-98` checks `user.password` first, then `user.token`. Do NOT confuse the two fields. Do NOT use `token` for a password or vice versa. Token goes to `Bearer` header; password goes to `Basic` header.

Session's `token()` method returns the account token from localStorage — this is NOT the same as the per-server access token in `UserManager`. Do not mix these up.

### CRITICAL: Server URL is NOT user-editable in this story

`config.base_url` comes from `window.config` (`public/config.js`) — a server-generated runtime value. For Jay's standalone deployment, this is fixed at deploy time. Do NOT add a server URL input field that writes to `config.base_url` — that's a `window.config` global, not a Dexie value.

The `서버·인증` form in this story stores auth credentials *for* `config.base_url`. The full settings surface (Story 5.1) will display the server URL as a read-only informational field.

### CRITICAL: `useLiveQuery` in `ServerAuthForm.jsx`

Read the current user with:
```jsx
const existingUser = useLiveQuery(() => userManager.get(config.base_url), []);
```

`useLiveQuery` returns `undefined` on first render — guard before using:
```jsx
const [username, setUsername] = useState("");
const [token, setToken] = useState("");
// Only sync from Dexie once (when existingUser transitions from undefined to value)
useEffect(() => {
  if (existingUser !== undefined) {
    setUsername(existingUser?.username ?? "");
    setToken(existingUser?.token ?? existingUser?.password ?? "");
  }
}, [existingUser]);
```

Note: `useLiveQuery` is allowed in `src/components/ServerAuthForm.jsx` (flat component, NOT a Context file). This is architecturally correct — only `contexts/` is banned from using `useLiveQuery`.

### CRITICAL: Login.jsx — no `accountApi` loop on `require_login=false`

The existing `Login.jsx` uses `accountApi.login()`. `AccountApi.js` is on the **remove** list (feature trim). However, `AccountApi.js` is only removed in Story 5.4 (Migration Cleanup), which is gated on all flags being `true`. For now, keep the import — just don't call it when `require_login` is false.

The rebuilt `Login.jsx` structure:
```jsx
const Login = () => {
  const { t } = useTranslation();
  if (!config.require_login) return null;  // Jay's setup: never show login
  // ... Tailwind form
};
```

The `App.jsx` redirect logic (`if (!session.exists() && config.require_login)`) remains as-is — this story rebuilds only the login UI component, not the routing logic (that belongs to Story 2.1's App shell).

### CRITICAL: `routes.js` — keep `forSubscription` seam

`routes.forSubscription` is imported by `src/app/Notifier.js` — the one allowed `app→components` cross-layer seam. **Do NOT remove or rename this function.** Route shapes `/:topic` and `/:baseUrl/:topic` must be preserved.

Only remove the keys `signup` and `account` from the routes object. Keep `login` (for `require_login=true` flow), `settings`, `subscription`, `subscriptionExternal`, `forSubscription`.

### Connection feedback (no direct test in this form)

After saving credentials, the connection attempt happens automatically when a subscription is added (Story 2.5). `Connection.js` calls `userManager.get(baseUrl)` when establishing a WS/poll connection. The `ConnectionIndicator` (Story 2.3) reflects the result.

There is no inline connection test in `ServerAuthForm.jsx` for this story. If credentials are wrong:
1. Jay subscribes (2.5) → WS fails (401) → `Connection.js` emits "connecting" state, never transitions to "connected"
2. `ConnectionIndicator` shows "연결 끊김"  
3. The not-connected state panel (2.6) will show the "주소와 인증을 확인해 주세요." copy

When Jay revisits the settings form, values are pre-filled via `useLiveQuery` (AC #6 — retained values).

### Auth type toggle UX

Use a simple two-option `<Tabs>` component from `ui/Tabs.jsx` (built in Story 1.8) to select between token and password auth:
- Tab 1: "액세스 토큰" → shows single `token` input field
- Tab 2: "사용자 이름 + 비밀번호" → shows `username` + `password` fields

Both tabs need a `username` field. Token auth: username + token. Password auth: username + password.

### Styling rules

All form elements must use token classes. Key patterns:
```jsx
// Input field (no raw MUI TextField)
<input
  className="w-full rounded-sm bg-surface-2 border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent-ui"
  type="text"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  aria-label={t("server_auth_form_username_label")}
/>

// Save button — white/primary, NOT green
<Button variant="primary" type="submit">{t("server_auth_form_save_button")}</Button>
```

No `bg-[#hex]`, no `mt-[Npx]` without `/* layout-nudge */` comment.

### Migration flag

`src/config/migration.js` (created in Story 2.1) exports `NEW = { shell: ..., feed: ..., ... }`. Add `auth: false` at creation time; this story sets it to `true` when the form is wired and working.

In `App.jsx`, the migration flag for the auth surface would look like:
```js
import { NEW } from "@/config/migration";
// In the routes:
{NEW.auth && <Route path={routes.login} element={<Login />} />}
```

But Story 2.1 owns `App.jsx` structure — if 2.1 is not complete, just create the components and leave route wiring with a TODO comment.

### File locations summary (architecture.md)

| File | Action | Notes |
|---|---|---|
| `src/components/ServerAuthForm.jsx` | **CREATE NEW** | Flat chrome, same level as `ConnectionIndicator.jsx` |
| `src/components/Login.jsx` | **REBUILD** (remove MUI) | Keep conditional `require_login` guard |
| `src/components/routes.js` | **MODIFY** | Remove signup/account keys |
| `src/config/migration.js` | **MODIFY** | Add `auth` flag |
| `public/static/langs/en.json` | **MODIFY** | Add `server_auth_form_*` keys |
| `public/static/langs/ko.json` | **MODIFY** | Add Korean `server_auth_form_*` strings |
| `src/components/ServerAuthForm.test.jsx` | **CREATE NEW** | Co-located test |
| `src/components/Login.test.jsx` | **CREATE NEW** | Co-located test |

**Do not modify anything in `src/app/` — `UserManager.js`, `Session.js`, `Api.js`, `AccountApi.js` are read-only for this story.**

### Dependencies on prior stories

- **Story 1.6** (`ui/Button.jsx`) — needed for the "설정 저장" button in `ServerAuthForm.jsx`
- **Story 1.8** (`ui/Tabs.jsx`) — needed for the auth-type toggle in `ServerAuthForm.jsx`
- **Story 2.1** (`AppProviders.jsx`, `routes.js` base, `App.jsx` shell) — needed to mount `ServerAuthForm` at `routes.settings`. If 2.1 is not done, create components but leave route wiring with `// TODO 2.4` comment.
- **Story 2.3** (`ConnectionContext`, `ConnectionIndicator`) — AC #4 assumes the indicator exists to show "연결 끊김". If 2.3 is not yet merged, the indicator feedback won't display, but the form itself can still be built and tested.

### Testing approach

Use Vitest + jsdom (already configured in `vitest.config.js` from Story 1.2).

```jsx
// ServerAuthForm.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userManager from "../app/UserManager";
import ServerAuthForm from "./ServerAuthForm";

vi.mock("../app/UserManager", () => ({
  default: { get: vi.fn().mockResolvedValue(null), save: vi.fn() },
}));

it("calls userManager.save with token shape when token tab is active", async () => {
  render(<ServerAuthForm />);
  fireEvent.change(screen.getByLabelText(/사용자 이름/), { target: { value: "jay" } });
  fireEvent.change(screen.getByLabelText(/액세스 토큰/), { target: { value: "tk_abc" } });
  fireEvent.click(screen.getByText(/설정 저장/));
  await waitFor(() => {
    expect(userManager.save).toHaveBeenCalledWith({
      baseUrl: config.base_url,
      username: "jay",
      token: "tk_abc",
    });
  });
});

// Login.test.jsx
it("renders null when config.require_login is false", () => {
  config.require_login = false;
  const { container } = render(<Login />);
  expect(container.firstChild).toBeNull();
});
```

For `useLiveQuery` in `ServerAuthForm`, use `fake-indexeddb`:
```js
import "fake-indexeddb/auto"; // reset Dexie for each test
```

OR mock `useLiveQuery` directly:
```js
vi.mock("dexie-react-hooks", () => ({ useLiveQuery: (fn) => fn() }));
```

### Previous story learnings (Story 2.3)

From Story 2.3 (`ConnectionContext`):
- `contexts/` may NOT import `useLiveQuery` — but `ServerAuthForm.jsx` is NOT a Context file, so `useLiveQuery` is fine here.
- The `useConnection()` guard pattern: always guard hooks that throw outside their Provider.
- i18n key structure: `<feature>_<element>_<action>` — e.g. `server_auth_form_save_button`.
- `motion-safe:animate-pulse` for animations — not directly relevant here, but reinforces the pattern.
- Tests use `renderHook` + Vitest; mock `fake-indexeddb` carefully; `fake-indexeddb/auto` at top of test file.

### References

- `require_login` conditional: [src/app/config.js:1-7](src/app/config.js) + [src/components/App.jsx:50](src/components/App.jsx#L50)
- `UserManager.save()` shape: [src/app/UserManager.js:20-26](src/app/UserManager.js#L20)
- `maybeWithAuth` (token vs password field): [src/app/utils.js:92-98](src/app/utils.js#L92)
- `Session.store()` (require_login path): [src/app/Session.js:31-40](src/app/Session.js#L31)
- Existing `Login.jsx` (to be rebuilt): [src/components/Login.jsx](src/components/Login.jsx)
- Conditional login UI spec: Architecture §Authentication & Security — "login is rendered only when `config.require_login` is true"
- Feature trim list: Architecture §Technical Constraints — "Remove Account.jsx, Signup.jsx, Login.jsx (rebuild), Upgrade*/Reserve* dialogs"
- Routes `forSubscription` seam (preserve): [src/components/routes.js:10-17](src/components/routes.js#L10) — imported by `Notifier.js:30`
- Button system (achromatic): UX-DR6 — "green is NEVER a button variant except the single publish FAB"
- Auth entry Flow 1: EXPERIENCE.md — "taps 설정 열기 → lands in 서버·인증 → enters ntfy server URL and token → taps 설정 저장"
- Voice error copy: EXPERIENCE.md — "주소와 인증을 확인해 주세요." (used in not-connected state panel, Story 2.6)
- i18n key convention: architecture.md § Naming Patterns — `<feature>_<element>_<action>`
- No hardcoded strings: architecture.md § Enforcement — `eslint-plugin-i18next no-literal-string`
- `useLiveQuery` guard: project-context.md — "returns `undefined` on first render — always guard before `.map`/`.length`"
- Token-only styling: architecture.md § Format Patterns — "No raw hex; no arbitrary px"
- `AccountApi.js` lifecycle: architecture.md §Project Structure — `[remove]` in Story 5.4

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(none)

### Completion Notes List

- Created `ServerAuthForm.jsx`: Dexie `useLiveQuery` pre-fills fields from `userManager.get(config.base_url)`. Auth-type toggle (Tabs) switches between token/password shape. `userManager.save()` called with correct shape on submit. Inline error on failure. All labels via `t()`.
- Rebuilt `Login.jsx`: MUI entirely removed. Pure Tailwind token classes. `config.require_login` guard returns null. Password visibility toggle via inline SVG icon buttons. `accountApi.login()` → `session.store()` flow preserved. Signup link removed.
- Updated `routes.js`: removed `signup` and `account` keys; `settings` already present.
- Updated `migration.js`: added `auth: false` flag.
- Updated `App.jsx`: removed Signup/Account imports and routes; added `ServerAuthForm` import; added `<Route path={routes.settings} element={<ServerAuthForm />} />` inside NewShell's main content area.
- Added 10 i18n keys to both `en.json` and `ko.json` (`server_auth_form_*`, `login_error_invalid_credentials`).
- 17 new tests pass (9 for ServerAuthForm, 8 for Login). Full suite: 192 tests, 22 files — no regressions.

### File List

- `src/components/ServerAuthForm.jsx` (created)
- `src/components/ServerAuthForm.test.jsx` (created)
- `src/components/Login.jsx` (modified — MUI removed, Tailwind rebuilt)
- `src/components/Login.test.jsx` (created)
- `src/components/routes.js` (modified — signup/account removed)
- `src/config/migration.js` (modified — auth: false added)
- `src/components/App.jsx` (modified — ServerAuthForm route added to NewShell, Signup/Account removed)
- `public/static/langs/en.json` (modified — 10 keys added)
- `public/static/langs/ko.json` (modified — 10 keys added)

## Change Log

- 2026-06-20: Story 2.4 implemented — ServerAuthForm created, Login.jsx rebuilt (MUI→Tailwind), routes trimmed, i18n keys added, migration flag added, 17 tests written.
