# CLAUDE.md — BuildSupply Pro

Working conventions for AI/agent sessions on this repo. Derived from the actual code, not
boilerplate. Keep it current: if you change a command or convention, update this file in
the same commit.

## What this is

**BuildSupply Pro** — Import & Wholesale management for construction materials, built on
ERPNext/Frappe with a separate React SPA front end. Monorepo, two deployables.

```
frontend/   React 19 + TypeScript + Vite 7 + Tailwind v4 SPA (talks to ERPNext REST API)
backend/    Frappe custom app "buildsupply" (Python ≥3.10) — DocTypes, APIs, business logic
docker/     Compose stack (react-ui + erpnext)
deploy/     VPS deploy scripts and prod compose/env
.github/    CI: deploy.yml — SSH to VPS, rebuild react-ui on push to master (frontend/**)
```

## Backend layout (Frappe)

- App root: `backend/buildsupply/`. Frappe entry point is `hooks.py` (fixtures, doctype_js,
  scheduler_events, permission hooks).
- Modules: **Import Tracking**, **Wholesale Pricing**, **Customer Credit** (see `modules.txt`).
- A DocType lives at `<module>/doctype/<snake_name>/<snake_name>.{json,py}` plus `__init__.py`.
  Child tables set `"istable": 1`. The controller class name is PascalCase of the doctype.
- Public/callable methods are decorated `@frappe.whitelist()`.
- **Pattern: keep math in pure functions** for testability. Example: `compute_costsheet()` in
  `import_tracking/doctype/import_shipment/import_shipment.py` is a plain dict-in/dict-out
  function that the controller calls; the regression test exercises it with a stubbed
  `frappe`. Follow this pattern for any non-trivial calculation.
- Client-side DocType behaviour is a JS file under `public/js/` registered in `hooks.py`
  `doctype_js`.

## Frontend layout (React)

- Entry `src/main.tsx` → `src/App.tsx`. Routing: react-router 7.
- `src/pages/<Feature>/` — page + its drawers (`<Thing>DetailDrawer.tsx`, `New<Thing>Drawer.tsx`).
- `src/api/hooks/use*.ts` — TanStack Query v5 hooks (`useQuery`/`useMutation`); the REST client
  is `src/api/client.ts`; shared types in `src/api/types.ts`.
- `src/stores/` — Zustand stores (e.g. `authStore`, `toastStore` with a `toast` helper).
- `src/utils/` — formatting/helpers (`fmtETB`, `erpnextUrl`, `printViewUrl`, `pdfDownloadUrl`).
- Styling: Tailwind utilities + CSS-variable design tokens. Use the tokens, don't hardcode hex.
  Tokens (also in `PLAN.md`): `--primary` `#2563EB`, page bg `#F9FAFB`, card `#FFFFFF`,
  text `#111827`/`#6B7280`/`#9CA3AF`, border `#E5E7EB`; status green `#059669`, red `#DC2626`,
  amber `#D97706`. One font (Inter); JetBrains Mono only for currency cells (`font-mono`).
- Icons: `lucide-react`. Currency: always `fmtETB(...)`.

## Commands

Frontend (run inside `frontend/`):

| Task       | Command                                  |
|------------|------------------------------------------|
| Dev server | `npm run dev`                            |
| Typecheck  | `npx tsc --noEmit -p tsconfig.app.json`  |
| Lint       | `npm run lint`                           |
| Build      | `npm run build`  (`tsc -b && vite build`)|

Backend:

| Task                 | Command                                                                 |
|----------------------|-------------------------------------------------------------------------|
| Cost-sheet regression| `python3 backend/buildsupply/import_tracking/tests/test_costsheet.py`   |
| Full app tests       | `bench --site <site> run-tests --app buildsupply`                       |
| Apply schema changes | `bench --site <site> migrate`                                           |
| Dry-run sample data  | `bench --site <site> execute buildsupply.import_tracking.demo.run_dry_run` |

The cost-sheet regression stubs Frappe, so it runs anywhere with plain `python3` — use it as
the fast feedback loop for any change to the landed-cost engine.

## Definition of Done

A change is "done" only when all that apply are green:

1. **Frontend touched** → `npx tsc --noEmit -p tsconfig.app.json` passes AND `npm run lint` clean.
2. **Landed-cost engine touched** (`import_shipment.py` / `costsheet.ts`) → the cost-sheet
   regression passes and still ties to the source figures (Purchase 14,706,242.42, CVD
   4,953,190.46, GIT 5,025,731.82). The client `costsheet.ts` mirror must stay in sync with
   the Python engine — change both together.
3. **DocType JSON changed** → it is valid JSON and the change is noted for `bench migrate`.
4. Commit message follows **Conventional Commits**; `CHANGELOG.md` updated for user-facing
   or schema changes.

A committed Stop hook (`.claude/settings.json`) runs checks 1–2 automatically at session end.

## Git & commit conventions

- **Conventional Commits**: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- Small, reviewable commits — one logical change each. Stage specific files (`git add <path>`),
  not `git add -A`, so unrelated in-flight work isn't swept in.
- Default branch is `master`. CI auto-deploys `frontend/**` changes pushed to `master` — be
  deliberate about what you push.
- Never run destructive/irreversible git commands (`reset --hard`, force-push, `clean -fd`)
  without explicit approval.

## Plan-before-edit discipline

For any multi-file or non-trivial change: inspect first, state the plan (files + why), get
approval, then edit incrementally. Prefer ERPNext-native mechanisms over bespoke code. Don't
invent conventions — grep the codebase for an existing pattern and match it.

## Parallel sessions: git worktrees

Run independent tasks in separate worktrees so sessions never edit the same tree:

```bash
git worktree add ../buildsupply-<topic> -b feat/<topic>   # isolated checkout + branch
cd ../buildsupply-<topic>                                  # work, commit here
git worktree remove ../buildsupply-<topic>                 # when merged/done
```

One agent session per worktree. Merge back via PR/normal review. This keeps concurrent work
from colliding in `frontend/` or the Frappe app.

## /compact policy

Compact the conversation when context gets long or the task pivots, and in long sessions
compact at natural checkpoints (after a feature lands and its checks pass). Before compacting,
make sure durable facts are written to disk — `CHANGELOG.md` for what changed, this file for
new conventions — so nothing important lives only in chat history.

## Skills & agents available

- `.claude/skills/frappe-doctype/` — add a DocType / child table / whitelisted method + hooks.
- `.claude/skills/landed-cost-sheet/` — the customs cost-sheet model and how to extend it safely.
- `.claude/skills/react-feature/` — the page + Query hook + types + drawer pattern.
- `.claude/agents/code-reviewer.md` — read-only reviewer; invoke it to grade a diff before "done".
