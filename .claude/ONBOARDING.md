# Claude Code — Onboarding for this repo

Share this with anyone using the Claude Code CLI on BuildSupply Pro.

## Auto-loaded (nothing to do — just open the repo in Claude Code)

When you start Claude Code in this folder it automatically picks up:

- **`CLAUDE.md`** — project conventions, commands, Definition of Done, `/compact` + worktree policy.
- **`.claude/skills/`** — `frappe-doctype`, `landed-cost-sheet`, `react-feature` (invoked automatically when relevant, or on request).
- **`.claude/agents/code-reviewer.md`** — the read-only reviewer subagent.
- **`.claude/settings.json`** — the Stop hook that runs the Definition-of-Done checks.

These are committed, so a fresh `git clone` gives every teammate the same setup.

## Adopt manually (human actions the CLI won't do for you)

1. **Stop hook — already active, nothing to approve.** The Definition-of-Done hook is committed
   in `.claude/settings.json`, so Claude Code runs it automatically on every session end; the
   cost-sheet test + frontend typecheck fire on Stop with no approval step. You can view it under
   `/hooks` (read-only — listed as **Stop (1)**), and run it anytime yourself with
   `bash .claude/hooks/verify-done.sh`.
2. **Run the reviewer before merging.** Ask Claude: *"Use the code-reviewer agent on my
   `git diff`."* It grades correctness, security, and convention adherence on work it didn't write.
3. **Choose commit scope deliberately.** Stage specific files (`git add <path>`), not `git add -A`,
   so unrelated in-flight work isn't swept in. Use Conventional Commits.
4. **Use worktrees for parallel work** (see CLAUDE.md): `git worktree add ../buildsupply-<topic>
   -b feat/<topic>` — one Claude session per worktree so they don't collide.
5. **Keep working memory current.** Update `CHANGELOG.md` for user-facing/schema changes and
   `CLAUDE.md` for new conventions — in the same commit as the change.

## Fast feedback loop

- Cost-sheet engine: `python3 backend/buildsupply/import_tracking/tests/test_costsheet.py`
- Frontend: `cd frontend && npx tsc --noEmit -p tsconfig.app.json && npm run lint`
- Both at once: `bash .claude/hooks/verify-done.sh`

## Requirements

Claude Code CLI (2025+). Hooks and committed Skills/agents are read from `.claude/` in the repo
root; personal overrides go in `.claude/settings.local.json` (gitignored).
