# Visual reference — Beszel dashboard
_2 screenshots supplied by Jay 2026-06-20 as the desired look-and-feel. Inspiration, not a spec; ntfy spines win on conflict._

## What Jay is pointing at
A clean, data-dense dark monitoring dashboard. Adopt its **feel**, not its function (ntfy stays a notification app).

## Observed traits
- **Background:** near-black neutral (~`#0C0D0F`), slightly cool, flatter/darker than our `#15171A`.
- **Cards:** dark surface (~`#16181B`) with subtle 1px border, soft rounding, low elevation. Card header = bold white title + trailing icon buttons (bell, overflow ⋯).
- **Accent = bright emerald green** (~`#42D392`/`#4ADE80`), brighter & greener than our locked teal `#6FD3BC`. Used on meter fills, status dots, version link.
- **Key-value rows:** each row has a **leading muted icon** + label (muted) + value (white); numeric/percentage values get an **inline meter bar** (green fill on a dark track).
- **Threshold colors:** meters green normally; Settings exposes Warning 65% / Critical 90% "meter colors" → maps cleanly onto our priority **amber (warning) / coral (critical)** palette.
- **Buttons:** white "Save Settings" (achromatic) — confirms our UX-D6.
- **Settings layout:** left icon-nav (active = gray rounded surface, NOT colored), sectioned form with selects/steppers, white inputs on dark fill, section dividers, hint text under each heading.
- **Footer:** tiny muted meta row.

## Open decision raised
Brand teal `#338574` is locked in PRD D7 as **shared 1:1 with the Android app**. Switching the accent to Beszel-green changes Android too. → decide: go green vs keep teal.
