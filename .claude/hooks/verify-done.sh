#!/usr/bin/env bash
# Definition-of-Done checks, run by the Stop hook (.claude/settings.json).
# Fast and non-destructive: the cost-sheet regression (stubs Frappe, no bench needed)
# plus a frontend typecheck. Exits non-zero if either fails so the session surfaces it.
set -uo pipefail
cd "$(dirname "$0")/../.." || exit 0

fail=0

echo "▶ cost-sheet regression"
if python3 backend/buildsupply/import_tracking/tests/test_costsheet.py >/tmp/_cs.log 2>&1; then
  echo "  ✅ pass"
else
  echo "  ❌ FAIL"; tail -n 20 /tmp/_cs.log; fail=1
fi

if command -v npx >/dev/null 2>&1 && [ -f frontend/package.json ]; then
  echo "▶ frontend typecheck"
  if (cd frontend && npx tsc --noEmit -p tsconfig.app.json) >/tmp/_tsc.log 2>&1; then
    echo "  ✅ pass"
  else
    echo "  ❌ FAIL"; tail -n 20 /tmp/_tsc.log; fail=1
  fi
else
  echo "▶ frontend typecheck — skipped (npx/frontend not available)"
fi

[ "$fail" -eq 0 ] && echo "Definition of Done: GREEN" || echo "Definition of Done: RED — fix before marking done"
exit "$fail"
