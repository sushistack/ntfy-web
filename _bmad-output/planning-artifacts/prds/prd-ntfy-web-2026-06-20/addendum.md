# Addendum — ntfy-web Redesign PRD

Downstream depth that supports the PRD but doesn't belong in its narrative: full token mapping,
config sketches, and rejected-alternative rationale. Feeds the UX spec / architecture phase.

## A. Full token → platform mapping

> ⚠️ **SUPERSEDED.** The warm/teal values below were overridden during UX (see `reconcile-prd.md`).
> Canonical tokens now live in `DESIGN.md` frontmatter → `tokens.css` + `design-tokens.md`
> (emerald `#42D392`, near-black `#0C0D0F`, cool/neutral). Kept for history only.

Web column = CSS custom property (also a Tailwind theme key); Android column = resource name.

| Token | CSS var / Tailwind key | Android resource | Light | Dark (hero) |
|-------|------------------------|------------------|-------|------|
| brand | `--brand` / `brand` | `@color/brand` | `#338574` | `#6FD3BC` |
| brand-container | `--brand-container` | `@color/brand_container` | `#A0F2DD` | `#08453A` |
| bg | `--bg` / `bg` | `@color/bg` | `#FAF7F2` | `#1A1613` |
| surface | `--surface` | `@color/surface` | `#FFFFFF` | `#251F1A` |
| surface-muted | `--surface-muted` | `@color/surface_muted` | `#F3EEE6` | `#2F2823` |
| border | `--border` | `@color/border` | `#ECE6DD` | `#3A322B` |
| text | `--text` | `@color/text` | `#2B2724` | `#F5EFE7` |
| text-muted | `--text-muted` | `@color/text_muted` | `#7A7068` | `#B5AA9C` |
| prio-min | `--prio-min` | `@color/prio_min` | `#9A9088` | `#8A8178` |
| prio-low | `--prio-low` | `@color/prio_low` | `#6F8F86` | `#8FB3A9` |
| prio-high | `--prio-high` | `@color/prio_high` | `#E8943A` | `#F5A95C` |
| prio-max | `--prio-max` | `@color/prio_max` | `#E5484D` | `#FF6B6E` |
| success | `--success` | `@color/success` | `#2F9E6E` | `#5FD49A` |
| warning | `--warning` | `@color/warning` | `#E8943A` | `#F5A95C` |
| danger | `--danger` | `@color/danger` | `#C30000` | `#FF6B6E` |

Spacing (identical px/dp): `space-1`=4, `2`=8, `3`=12, `4`=16, `5`=24, `6`=32, `7`=48.
Radius: `sm`=10, `md`=16, `pill`=999. Type: see PRD §3.2.
Fonts: **Plus Jakarta Sans** (UI) + **JetBrains Mono** (code) — both free variable fonts; bundle
into Android `res/font` and self-host in the web build (no CDN).

`[ASSUMPTION]` Keeping one token file as the source and hand-syncing to Android is fine for a
two-app, single-maintainer setup. A generator (Style Dictionary) is **not** justified at this
scale — add it only if the token set starts drifting between apps. (ponytail: hand-sync, automate when it drifts.)

## B. Web config sketch (Tailwind tokens)

Tokens as CSS vars in `:root` / `.dark`, surfaced to Tailwind via `theme.extend.colors` pointing
at the vars. This keeps light/dark a single class toggle and gives Android a 1:1 hex reference.

```css
:root {
  --brand:#338574; --bg:#FAF7F2; --surface:#FFFFFF; --text:#2B2724;
  --prio-max:#E5484D; --prio-high:#E8943A; /* …rest of table… */
  --radius-md:16px; --radius-sm:10px;
}
.dark {
  --brand:#65B5A3; --bg:#1A1715; --surface:#24201D; --text:#F2EDE6;
  --prio-max:#F2686C; --prio-high:#F0A857; /* … */
}
```

Theme switch reuses the existing logic in `App.jsx` (system pref + IndexedDB-stored choice) — only
the mechanism of applying it changes from MUI's `createTheme` to toggling a `.dark` class.

## C. Rejected alternative — keep MUI + retheme

**Considered:** keep MUI v5, rewrite only `theme.js` tokens (the lowest-effort path; it gives a
large visual change for a small diff and preserves RTL, a11y, and all dialogs for free).

**Why rejected:** user chose Tailwind + shadcn for maximum design freedom and a lighter bundle.

**Cost being accepted by that choice:**
- Re-implement every screen currently built on MUI components.
- Re-establish RTL (MUI + `stylis-plugin-rtl` provided it; Tailwind does not) — see Open Question 1.
- Re-verify a11y/focus/keyboard on dialogs and menus (headless libs help but don't free).
- Larger overall effort than retheme; smaller runtime bundle and full visual control as the payoff.

If effort becomes a problem, the fastest fallback to still hit the "warm & friendly" goal is the
retheme path above — same token table, applied through MUI instead.

## D. Feature-trim file impact (reference for implementation phase)

Remove/route-out: `Account.jsx`, `Signup.jsx`, `UpgradeDialog.jsx`, `ReserveDialogs.jsx`, and
account/billing/reserved branches in `Navigation.jsx`. Keep auth plumbing in `UserManager.js` /
`Api.js` (token + basic auth) since protected topics may still need it. Confirm `require_login`
status of the server to decide whether any login UI remains (PRD §4.5 assumption).
