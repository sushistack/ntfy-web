---
stepsCompleted: ['step-01-document-discovery', 'step-02-prd-analysis', 'step-03-epic-coverage-validation', 'step-04-ux-alignment', 'step-05-epic-quality-review', 'step-06-final-assessment']
status: 'complete'
documentsIncluded:
  prd: 'prds/prd-ntfy-web-2026-06-20/prd.md (+ addendum.md)'
  architecture: 'architecture.md'
  epics: 'epics.md'
  ux: 'ux-designs/ux-ntfy-web-2026-06-20/DESIGN.md + EXPERIENCE.md'
date: '2026-06-20'
---

# Implementation Readiness Assessment Report

**Date:** 2026-06-20
**Project:** ntfy-web

## Document Inventory

| Type | File | Size | Modified |
|------|------|------|----------|
| PRD | prds/prd-ntfy-web-2026-06-20/prd.md | 18,994 B | 2026-06-20 |
| PRD (addendum) | prds/prd-ntfy-web-2026-06-20/addendum.md | 4,344 B | 2026-06-20 |
| Architecture | architecture.md | 54,474 B | 2026-06-20 |
| Epics & Stories | epics.md | 61,194 B | 2026-06-20 |
| UX (design) | ux-designs/ux-ntfy-web-2026-06-20/DESIGN.md | 19,302 B | 2026-06-20 |
| UX (experience) | ux-designs/ux-ntfy-web-2026-06-20/EXPERIENCE.md | 20,586 B | 2026-06-20 |

**Duplicates:** None (no whole + sharded conflicts).
**Missing:** None — PRD, Architecture, Epics, UX all present.

## PRD Analysis

The PRD is story- and criteria-driven (no explicit FR/NFR numbering). Requirements
were normalized below from User Stories (§2), UI/UX Requirements (§3), Technical
Constraints (§4), Android Handoff (§5), and Success Criteria (§1.4).

### Functional Requirements (normalized from US1–US15, SC1–SC7, §3.4)

- **FR1** (US1): Connect to ntfy server — URL + auth (basic or token).
- **FR2** (US2): Subscribe to a topic by name.
- **FR3** (US3): Receive notifications in real time (WS primary + poll fallback) without refresh.
- **FR4** (US4): Browse past notifications (history) per-topic and across all topics.
- **FR5** (US5): Open notification detail — full markdown body, tags/priority, attachment view/download.
- **FR6** (US6): Priority is visually obvious (P4–P5 stand out), multi-channel (color + label/icon + position), never color-only.
- **FR7** (US7): Mute / unmute a topic (optimistic + revert-on-failure).
- **FR8** (US8): Publish a message (topic, title, body, priority, tags/emoji) via publish-only send queue.
- **FR9** (US9): Manage subscriptions — rename / clear / unsubscribe, see connection status.
- **FR10** (US10): Tap an action button (view URL / HTTP action / broadcast) and have it run.
- **FR11** (US11): Switch light / dark / system theme with warm palette (dark = hero).
- **FR12** (US12): Work as installable PWA with desktop/browser notifications (SW + Notifier retained).
- **FR13** (US13): Responsive layout — desktop / tablet / phone (breakpoints §3.5).
- **FR14** (US14): Clear empty / error / connection states (not-connected, no-subs, no-messages).
- **FR15** (US15): Per-topic + global settings — sounds, notification permission, retention/deletion policy.
- **FR16** (SC1): App shell — desktop sidebar + main; mobile top bar + bottom nav/drawer.
- **FR17** (SC3/§3.5): Desktop detail = right-side pane (list visible); mobile = full-screen route.
- **FR18** (§3.4): Notification card hero anatomy — accent bar, title, 3-line clamped body w/ expand, metadata row, attachment, ≤3 actions, unread dot, overflow menu.
- **FR19** (§4.5/§4.1): Runtime-configurable server URL/auth; conditional login UI only when `require_login`.
- **FR20** (§4.5): Remove account/signup/billing/upgrade/reserved/token-mgmt surfaces.

### Non-Functional Requirements (normalized from §1.4, §3.1, §4)

- **NFR1** (S1): Functional parity for all core flows against existing server, zero backend changes.
- **NFR2** (S3/§3.1.3): WCAG AA contrast (≥4.5:1 body) in light + dark; body ≥14px/sp; line-height 1.5; detail max ~70ch.
- **NFR3** (§3.1.5): Calm motion — fade/slide, respect `prefers-reduced-motion`.
- **NFR4** (§4.4): Accessibility — Radix/headless a11y; dialogs/menus/focus re-verified.
- **NFR5** (S2/§3.2): Platform-neutral token system is single source of truth; web CSS vars ↔ Android resources 1:1.
- **NFR6** (§4.1): Standalone static build, NOT embedded in ntfy server binary.
- **NFR7** (§4.2/§4.3): WS + poll subscription logic functionally identical; Dexie persistence retained; no API changes.
- **NFR8** (§4.4): Replace MUI with Tailwind v4 + headless (Radix); i18next retained.
- **NFR9** (§4.4): RTL dropped (LTR/Korean only).
- **NFR10** (S4): Subjective visual-quality gate — Jay accepts card + topic list as "polished" desktop+mobile.

### Additional Requirements / Constraints

- **C1** (§5): Android handoff spec — tokens → `colors.xml`/`dimens.xml`/type styles; restyle `DetailAdapter`, `MainAdapter`, global theme; side-by-side visual check (S5). *(Out of this repo's build scope but a PRD deliverable.)*
- **C2** (addendum A): Hand-synced single token file (no Style Dictionary generator at this scale).
- **C3** (§4.6): Single server assumed — no multi-server switching UI.
- **C4** (security, project-context): Markdown link sanitization mandatory (allowlist http/https/mailto).

### PRD Completeness Assessment (initial)

- **Strong:** clear goals/non-goals, resolved open questions, concrete token tables, card anatomy spec, explicit scope trims, Android handoff sequence.
- **Watch items for traceability:**
  - S4 (visual polish) and S5 (Android adoption) are **subjective/cross-repo** gates — epics must not silently absorb or drop them.
  - FR19 conditional-login (`require_login`) carries an `[ASSUMPTION]` — verify epic coverage handles both branches.
  - C1 Android handoff is a PRD deliverable but outside this web repo's build — epics should clarify ownership.
  - Token hex values differ between PRD §3.2/addendum A and addendum B's CSS sketch (e.g. dark `brand` `#6FD3BC` vs `#65B5A3`) — addendum B is explicitly a "sketch"; canonical = §3.2/addendum A. Architecture/epics must cite the canonical source.

## Epic Coverage Validation

The epics doc maintains its **own** normalized FR1–FR19 list + an explicit "FR Coverage Map"
(epics.md:101–126). The matrix below traces my **PRD-derived** requirements (Step 2) to that
map, so renumbering between the two docs cannot hide a gap.

### Coverage Matrix — PRD requirements → Epics

| PRD req | Requirement | Epic / Story | Status |
|---------|-------------|--------------|--------|
| FR1 connect (URL+auth) | E2 / 2.4 | ✓ Covered |
| FR2 subscribe | E2 / 2.5 | ✓ Covered |
| FR3 real-time receive | E3 / 3.3 | ✓ Covered |
| FR4 history (per-topic + all) | E3 / 3.3 | ✓ Covered |
| FR5 detail (md, attach, meta) | E3 / 3.5, 3.6 | ✓ Covered |
| FR6 priority multi-channel | E3 / 3.1 | ✓ Covered |
| FR7 mute/unmute | E4 / 4.2 | ✓ Covered |
| FR8 publish | E4 / 4.3 | ✓ Covered |
| FR9 manage subs + status | E2 / 2.3 (status) + E4 / 4.1 (manage) | ✓ Covered (split 9a/9b) |
| FR10 action buttons | E3 / 3.7 | ✓ Covered |
| FR11 theme | E2 / 2.2 | ✓ Covered |
| FR12 PWA + browser notif | E5 / 5.2 (+ SW fix E1/1.5) | ✓ Covered |
| FR13 responsive | E2 / 2.1 | ✓ Covered |
| FR14 states | E2 / 2.6 + E3 / 3.3 (structural owner E1 / 1.9) | ✓ Covered |
| FR15 settings | E5 / 5.1 | ✓ Covered |
| FR16 card hero anatomy | E3 / 3.1 (+ epics FR16/18) | ✓ Covered |
| FR17 desktop detail right-pane | E3 / 3.5 | ✓ Covered |
| FR18 card anatomy detail | E3 / 3.1, 3.4 | ✓ Covered |
| FR19 conditional login (both branches) | E2 / 2.4 | ✓ Covered |
| FR20 remove account surfaces | E5 / 5.4 (gated cleanup) | ✓ Covered |
| NFR1 functional parity | E2/3 cross + 1.2 char test | ✓ Covered |
| NFR2 AA contrast / readability | E1 / 1.4 + E5 / 5.3 verification | ✓ Covered |
| NFR3 calm motion | woven (reduced-motion ACs) | ✓ Covered |
| NFR4 accessibility | E1 contract + per-epic AC + E5 / 5.3 | ✓ Covered |
| NFR5 token system SoT | E1 / 1.4 + E5 / 5.4 parity gate | ✓ Covered |
| NFR6 standalone build | E5 / 5.4 (NFR7) | ✓ Covered |
| NFR7 WS+poll / Dexie unchanged | E1 / 1.2 + E3 / 3.3 | ✓ Covered |
| NFR8 MUI→Tailwind+Radix | E1 + E5 / 5.4 cleanup | ✓ Covered |
| NFR9 RTL dropped | E5 / 5.4 (stylis-rtl removal) | ✓ Covered |
| NFR10 (S4) subjective polish gate | **no explicit story/AC owner** | ⚠️ Implicit only |
| C1 Android handoff (S5) | tokens/manifest in E1 / 1.4; Android **impl out-of-repo** | ⚠️ Out of scope (by design) |
| C2 hand-synced tokens | E1 / 1.4 + E5 drift-linter | ✓ Covered |
| C3 single server | assumed throughout | ✓ Covered |
| C4 md link sanitization (js:/data:) | E3 / 3.2, 3.6 cover XSS-via-raw-HTML; **href allowlist not explicit** | ⚠️ Partial |

### Coverage Statistics

- Total PRD functional requirements (FR1–FR20): **20** — covered: **20** → **100%**
- Total PRD non-functional (NFR1–NFR10): **10** — fully covered: **9**, implicit/ungated: **1** (NFR10/S4)
- Constraints (C1–C4): C2/C3 covered; **C1 out-of-repo by design**; **C4 partial** (see below)

### Missing / Weak Coverage (gaps to resolve before implementation)

**✅ Gap 1 — C4 markdown link sanitization (security) — RESOLVED 2026-06-20.**
project-context.md's security invariant requires sanitizing `javascript:`/`data:` URIs in
markdown link `href`/image `src` to an allowlist (http/https/mailto). Epics NFR11 + Stories
3.2/3.6 only asserted "no `rehype-raw`/`dangerouslySetInnerHTML`, plugin chain kept verbatim" —
which blocks raw HTML but does **not** neutralize `javascript:`/`data:` URIs in *valid* markdown
links. **Resolution:** an `href`/`src` allowlist AC + test were added to Story 3.2.

**✅ Gap 2 — NFR10 / S4 visual-quality gate had no owner — RESOLVED 2026-06-20.**
S4 ("Jay accepts card + topic list as polished, desktop+mobile") is a PRD success criterion that
appeared in no story AC or epic DoD. **Resolution:** added as an explicit Epic 3 DoD sign-off gate.

**ℹ️ Note — C1 / S5 Android adoption is correctly out-of-repo.**
Epics deliver the token manifest (the handoff artifact, E1/1.4 + E5 parity gate); the actual
Android restyling lives in `ntfy-android`. This is by design, not a gap — but the readiness of
*this* repo cannot validate S5. Flagging so it isn't mistaken for completed scope.

## UX Alignment Assessment

### UX Document Status

**Found** — two first-class spines (`DESIGN.md` visual, `EXPERIENCE.md` behavioral) + a
`reconcile-prd.md` that explicitly logs where UX overrode the PRD. UX is the most mature artifact
set; it carries FR-level rigor (UX-DR1–18, named flows, accessibility floor, state matrix).

### Alignment Findings

**Internal consistency (good):** UX spines ↔ Architecture ↔ Epics are tightly aligned. The
architecture lists both spines + reconcile-prd as input documents and faithfully implements them
(emerald `#42D392`, near-black `#0C0D0F`, cool/neutral, squared-left card, achromatic buttons,
3-form-factor split, URL-as-SoT, 2-level renderer, FOUC `matchMedia` fix). Epics trace cleanly to
both. **The downstream chain is coherent.**

### ⚠️ Alignment Issue 1 (MEDIUM) — stale warm/teal palette lives in PRD §3.2 + addendum  *(RESOLVED 2026-06-20)*

> **Correction (post-review):** an earlier draft of this section claimed `project-context.md`
> carried the stale warm palette. **That was wrong** — `grep` confirms project-context.md contains
> **no hex values, no "teal", no "warm"**; it references colors only as abstract tokens
> (`bg-surface`, `accent-text`) and points to `tokens.css`/`design-tokens.md` as source of truth.
> project-context.md is **clean and was NOT a blocker.**

`reconcile-prd.md` records that Jay deliberately overrode the PRD's visual decisions during UX:
warm→cool, teal `#338574`→emerald `#42D392`, warm-charcoal→near-black `#0C0D0F`. **The spines
win.** UX/Architecture/Epics all correctly use the emerald/neutral system.

The actual stale content lives only in **`prd.md` §3.2/§3.4 + `addendum.md` §A/§B** (warm hex
tables) — superseded by reconcile-prd.md but with no inline warning, so a reader hitting the PRD
first could build the wrong palette. **Resolution applied:** a `⚠️ SUPERSEDED` banner was added to
prd.md §3.2 and addendum §A pointing at DESIGN.md / reconcile-prd.md / `design-tokens.md` as
canonical. Issue closed.

### ⚠️ Alignment Issue 2 (LOW) — minor intra-DESIGN.md numeric drift

- Feed max-width: DESIGN.md "Layout & Spacing" says **~760px**; its own frontmatter context,
  EXPERIENCE.md, PRD, Architecture, and Epics all say **~720px**. Pick one (720 is the majority).
- Card padding: PRD §3.4 says `space-4` (16px); DESIGN.md says `{spacing.5}` (24px). Spines win
  (24px) — but Story 3.1 should cite the DESIGN value so the dev doesn't copy the PRD's 16px.

### Architecture Support for UX

Architecture explicitly supports every UX behavior: Radix focus/a11y floor (NFR3/UX-DR15),
`state × hasData` connection model (UX state matrix), `DataBoundary`/`StatePanel` (UX-DR11/14),
self-hosted fonts (UX-DR16), accent sub-token split for WCAG 1.4.11 (a rigor *add* over DESIGN.md,
correctly carried into Epic Story 1.4). **No UX requirement is left architecturally unsupported.**

### Warnings

- `[ASSUMPTION]`-flagged UX items (light-theme accent contrast, Voice & Tone microcopy, named
  Key Flows, mobile swipe UX-DR17, attachment as standalone component) are openly marked and
  routed into stories (5.3 contrast, DR12 single-source voice, 3.8 swipe confirm-or-scope-out).
  These are tracked, not dropped — but Jay still owes confirmations before those stories run.

## Epic Quality Review

Reviewed all 5 epics / 27 stories against create-epics-and-stories standards: user value,
epic independence, forward dependencies, story sizing, AC quality, brownfield fit.

### Dependency Analysis (rigorous) — ✅ clean

Every story carries an explicit `Depends-on:` line (their own guardrail G3). I traced all 27:

- **Epic-level ordering is strictly backward:** E2→E1, E3→{E1,E2}, E4→{E1,E2,E3}, E5→all.
  **No epic requires a later epic.** ✅
- **Within-epic deps all point backward** (e.g. 1.9→{1.6,1.8}; 3.6→{3.5,3.2}; 4.4→{4.3,3.1,3.3};
  5.4→all). **No forward references found anywhere.** ✅
- The deliberate **card-signature freeze (G4)** — 3.1 fixes pending/error slot prop types, E4
  "injects data only, no card edits" — is a dependency *inversion* that kills E3↔E4 churn. Good.

### AC Quality — ✅ strong

ACs are Given/When/Then, testable, and **include failure paths** (2.4 wrong auth, 3.2 parse
failure→raw text, 3.7 action failure→inline retry, 4.4 send failure→retain form). Enabler stories
correctly use **non-GWT shapes** by design — Decision Record (1.1 spike), Behavioral Snapshot
(1.2 characterization) — per the party-mode agreement. This is appropriate, not a defect (a naive
"GWT-only" check would wrongly flag them).

### Brownfield Fit — ✅ excellent

Integration points are explicit (the 3-item `app→components` contract: `hooks.js` listeners,
`Notifier.js→routes.js`, permission gesture); migration/compat is first-class (strangler flags,
S1 coexistence spike, `src/app/` characterization tests, gated cleanup with in-code flag assertion
G5). Dexie schema is preserved, not re-created — so the "create tables only when needed" rule is
N/A (no upfront-table violation possible).

### Compliance Checklist (per epic)

| Check | E1 | E2 | E3 | E4 | E5 |
|-------|----|----|----|----|----|
| Delivers user value | ⚠️ enabler | ✓ | ✓ | ✓ | ✓ (+cleanup) |
| Functions independently of later epics | ✓ | ✓ | ✓ | ✓ | ✓ |
| Stories appropriately sized | ⚠️ (1.6/1.7/1.8) | ✓ | ✓ | ✓ | ⚠️ (5.4) |
| No forward dependencies | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tables created when needed | N/A (preserved) | N/A | N/A | N/A | N/A |
| Clear acceptance criteria | ✓ | ✓ | ✓ | ✓ | ✓ |
| FR traceability maintained | ✓ | ✓ | ✓ | ✓ | ✓ |

### 🔴 Critical Violations

**None.** No technical epic masquerades as user value (E1 is an honestly-labeled enabler), no
forward dependency breaks independence, no epic-sized unsplittable story.

### 🟠 Major Issues

**M1 — E1 primitive-bundle stories violate the doc's *own* G2 cap.** G2 (epics.md:169) states
"primitives capped at 1–2 per story," but Story 1.6 bundles **3** (Button/Card/Chip), 1.7 bundles
**5** (Dialog/Sheet/Menu/Popover/Tooltip), 1.8 bundles **4** (Switch/Tabs/Meter/Skeleton). Each
risks exceeding one dev-agent context — the exact failure G2 was written to prevent.
**Recommendation:** either split 1.7/1.8 (e.g. overlay-core vs overlay-aux), or explicitly raise
the G2 cap and justify the bundling as cohesive — but don't leave the guardrail self-contradicted.

**M2 — Story 5.4 is an oversized "remove everything" closeout.** It removes MUI/Emotion/stylis,
deletes ~10 named files, AND turns on the full ESLint rule set AND runs the token-parity gate.
Gated (good), but large and high-blast-radius. **Recommendation:** consider splitting into
"dependency + file removal" vs "ESLint full-enforcement turn-on" so a lint-rule avalanche doesn't
block the bundle-removal merge.

### 🟡 Minor Concerns

- **mC1 — E1 has no direct user value (self-stated "enabler — no direct user FR").** Justified for
  a brownfield de-risk foundation, and the first demoable moment (E2) is intentionally close
  behind. Accepted deviation, but it does mean 9 stories land before any user-visible value — keep
  S1 truly blocking and parallelize 1.2–1.9 to shorten that runway.
- **mC2 — Two homes for server/auth UI:** Story 2.4 builds a "minimal" entry, 5.1 "fully expands"
  it. Fine as written, but 5.1's AC should say it *replaces/extends* 2.4's surface, not duplicates,
  to avoid two divergent forms.
- **mC3 — Epics renumber FRs vs PRD** (epics FR16–18 ≠ PRD-derived). Harmless because the FR
  Coverage Map bridges them, but anyone cross-reading the two FR lists must use the map, not match
  by number.

## Summary and Recommendations

### Overall Readiness Status

**READY.** (No true pre-implementation blocker — see correction below.)

The planning set is unusually strong: FR coverage is 100% (20/20), the artifact chain
UX→Architecture→Epics is internally coherent, dependencies are strictly backward with no forward
references, ACs include failure paths, and brownfield integration/migration is first-class.

> **Post-review correction:** the earlier draft flagged a 🔴 Critical "project-context.md carries
> the superseded palette." On verification that was **false** — project-context.md has no hex/teal
> content and correctly points to `tokens.css`/`design-tokens.md`. The stale palette lived only in
> PRD §3.2 + addendum, which have now received `⚠️ SUPERSEDED` banners. **There is no remaining
> blocker.**

### Critical Issues Requiring Immediate Action

**None.** (The previously-listed Critical was a misattribution; corrected and the underlying PRD
staleness has been banner-fixed.)

### Fixes Applied During This Review (2026-06-20)

1. ✅ **PRD §3.2 + addendum §A** — added `⚠️ SUPERSEDED` banners pointing to DESIGN.md /
   reconcile-prd.md / `design-tokens.md` as canonical (closes the stale-palette risk).
2. ✅ **Story 3.2 (C4 security)** — added an AC requiring an `href`/`src` allowlist
   (http/https/mailto) that neutralizes `javascript:`/`data:` URIs, with a test.
3. ✅ **Epic 3 DoD (NFR10/S4)** — added Jay's subjective polish sign-off as an explicit epic gate.
4. ✅ **G2 / M1** — revised the primitive-bundle cap to be context-intent-based (1–2 unrelated, or
   ~4 sharing a pattern) and flagged Story 1.7 (5 overlays) to split if context pressure appears.

### Remaining Minor Items (track, don't block)

5. DESIGN.md feed max-width 760 vs 720 elsewhere; card padding 24 (DESIGN) vs 16 (PRD §3.4) — pick
   the spine value and cite it in Story 3.1/2.1 (Alignment Issue 2).
6. M2 — Story 5.4 oversized closeout; consider splitting removal vs ESLint-enforcement.
7. mC2 — Story 5.1 AC should say it *extends/replaces* Story 2.4's server-auth surface, not duplicates.
8. Confirm the open `[ASSUMPTION]` UX items with Jay before their stories run (light-theme accent
   contrast → 5.3; Voice & Tone → DR12; mobile swipe → 3.8).

### Recommended Next Steps

1. **Proceed to implementation** starting with the foundation sequence the architecture already
   prescribes: Story 1.1 S1 coexistence spike (BLOCKING) + Story 1.2 `src/app/` characterization
   tests → Story 1.3 stack install. These ARE the first epic stories, not separate pre-work.
2. Fold the 4 remaining minor items into story refinement as you reach them (none gate the start).

### Final Note

This assessment reviewed 6 artifacts. After correcting one misattributed finding, **there is no
critical blocker**; 4 issues were fixed in place during the review and 4 minor items remain as
story-refinement notes. The planning is sound — implementation can begin with Epic 1.

---

**Assessed by:** Implementation Readiness workflow (PM role) · **Date:** 2026-06-20 · **For:** Jay
