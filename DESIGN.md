# DESIGN.md — BuildSupply Pro React SPA

Source of truth for the SPA's visual system. Extracted from the rendered app and
`frontend/src/index.css` (2026-06-11 design review). If a value here disagrees with
code, the code wins — then update this file in the same commit.

## Identity

Dark-first operations tool. Confident, quiet, data-dense. One accent color carries the
brand; everything else stays neutral. The ERPNext Desk UI remains the second face of the
product — the SPA mirrors its module structure (sidebar groups) but not its visual style.

## Themes

Both themes share `--primary: #FF8400` (orange). Tokens live in `frontend/src/index.css`
(`:root` = light, `.dark` = dark). **Always style through `var(--token)` — never hardcode hex.**

| Token | Dark (default) | Light |
|---|---|---|
| `--background` | `#111111` | `#F2F3F0` |
| `--card` / `--popover` | `#1A1A1A` | `#FFFFFF` |
| `--border` / `--input` | `#2E2E2E` | `#CBCCC9` |
| `--foreground` | `#FFFFFF` | `#111111` |
| `--muted-foreground` | `#B8B9B6` | `#666666` |
| `--primary` | `#FF8400` | `#FF8400` |
| `--secondary` | `#2E2E2E` | `#E7E8E5` |
| `--destructive` | `#FF5C33` | `#D93C15` |
| `--color-success(-foreground)` | `#222924` / `#B6FFCE` | `#DFE6E1` / `#004D1A` |
| `--color-warning(-foreground)` | `#291C0F` / `#FF8400` | `#E9E3D8` / `#804200` |
| `--color-error(-foreground)` | `#24100B` / `#FF5C33` | `#E5DCDA` / `#8C1C00` |
| `--color-info(-foreground)` | `#222229` / `#B2B2FF` | `#DFDFE6` / `#000066` |
| `--sidebar` family | `#18181b` base | `#E7E8E5` base |

Radii: `--radius-m: 16px` (inputs/cards), `--radius-pill: 999px` (chips, toggles, buttons).

## Typography

- **`.font-secondary` — Geist**: all UI text (body, headings, buttons, nav).
- **`.font-primary` — JetBrains Mono**: ALL-CAPS tracked section labels (`SALES TREND`),
  axis ticks, and currency cells. Numbers in tables use `font-mono` + tabular feel.
- Page title: one `h1`, 24px/700. Card titles are mono uppercase labels, not headings.
- Currency: always through `fmtETB` / `fmtETBPlain` / `fmtETBCompact` (`src/utils/format.ts`).
  Chart axis ticks: `fmtCompactNum` (no ETB prefix — context comes from the card).

## Charts (recharts)

House style established 2026-06:

- **Trend over time** → gradient area: `--primary` stroke 2.5px, vertical `linearGradient`
  fill 0.32→0 opacity, dotted grid (`strokeDasharray="3 6"`, horizontal only), dashed hover
  cursor, active dot ringed with `--card`. See `SalesTrendChart.tsx`.
- **Ranked categories (vertical)** → gradient bars (1→0.45 opacity), `radius [6,6,0,0]`.
  Secondary series = dashed monotone line at reduced opacity. See `TopCustomersChart.tsx`.
- **Ranked categories (horizontal)** → pill bars `radius [0,7,7,0]` on a full-width
  `--secondary` track, share % labels at right, opacity fades by rank. See `TopItemsChart.tsx`.
- **Decorative sparkbars** → pill tops, brightness graded by value, peak at full strength.
  See `RevenueBreakdown.tsx`.
- Tooltips: `--card` panel, `--border`, mono values via `fmtETBPlain`.
- **Data contract**: chart `dataKey`s must match the TS types in `src/api/types.ts` AND the
  mock layer in `src/api/client.ts` (`getDevMockData`). recharts fails silently on missing
  keys — when adding an endpoint, copy field names from the type, not from memory.

## Layout & responsive

Breakpoints in use: `md` (header search appears), `lg` (sidebar pins, KPI grids go 4-col),
`xl` (chart rows go side-by-side).

- Sidebar: fixed 280px, pinned at `lg+`; below `lg` it is an off-canvas drawer
  (hamburger in header, `bg-black/60` backdrop, closes on nav click). `AppLayout.tsx`.
- KPI grids: `grid-cols-2 lg:grid-cols-4`.
- Chart rows: `flex-col xl:flex-row`; fixed-width side cards become `w-full` when stacked.

## Motion

Entrance only, fast and quiet: `anim-fade-up` (0.3s), `anim-fade-in`, `anim-scale-in`
(0.25s) from `index.css`. Charts may animate on mount (recharts default). Hover
transitions 150ms. Nothing decorative, nothing looping.

## Components

- Cards: `bg-[var(--card)] rounded-lg border border-[var(--border)]` — flat, no shadows.
- Status pills: `--color-*` pairs (success/warning/error/info), pill radius, 11–12px text.
- Buttons/chips/toggles: pill radius; primary actions solid `--primary` with
  `--primary-foreground` text.
- Icons: `lucide-react`, 14–18px, `strokeWidth 1.75` in nav.
- Skeletons: shapes match the real content layout (`PageSkeleton`).

## Don'ts

- No hardcoded hex in components (status colors included — use `--color-*`).
- No new fonts; no Inter (the old docs were wrong — Geist + JetBrains Mono only).
- No shadows for hierarchy; use borders and surface steps.
- No raw numbers on chart axes ("6000k") — compact-format everything.
- No deltas/changes under a missing ("—") KPI value.
