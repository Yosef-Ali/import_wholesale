---
name: react-feature
description: Build or extend a feature in the React SPA (frontend/) — a page, a data hook, types, or a detail/new drawer. Use when adding UI that reads or writes ERPNext data. Captures the page + TanStack Query hook + types + drawer + design-token pattern this app uses.
---

# Adding a React feature (frontend/)

Stack: React 19 + TypeScript + Vite 7 + Tailwind v4 + TanStack Query v5 + Zustand +
react-router 7, lucide-react icons. Entry `src/main.tsx` → `src/App.tsx`.

## Where things go

```
src/pages/<Feature>/index.tsx              # list/page
src/pages/<Feature>/<Thing>DetailDrawer.tsx
src/pages/<Feature>/New<Thing>Drawer.tsx
src/api/hooks/use<Thing>.ts                # TanStack Query hooks
src/api/types.ts                           # shared interfaces (add here, don't inline)
src/api/client.ts                          # REST client (getList/getDoc/createDoc/updateDoc)
src/stores/                                # Zustand (authStore, toastStore → `toast`)
src/utils/                                 # fmtETB, erpnextUrl, printViewUrl, pdfDownloadUrl, costsheet
```

## Data layer pattern

Use TanStack Query hooks, never fetch in components:

```ts
export function useThing(name: string | null) {
  return useQuery<Thing>({
    queryKey: ['thing', name],
    queryFn: () => getDoc<Thing>('Thing Doctype', name!),
    enabled: !!name,
  });
}
export function useUpdateThing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Record<string, unknown> }) =>
      updateDoc<Thing>('Thing Doctype', name, data),
    onSuccess: (_d, { name }) => {
      qc.invalidateQueries({ queryKey: ['things'] });
      qc.invalidateQueries({ queryKey: ['thing', name] });
    },
  });
}
```

Child tables (e.g. `charges`, `item_allocation`) are sent as arrays inside the update `data`;
Frappe persists them. Mirror any backend calculation as a display-only TS helper in
`src/utils/` (see `costsheet.ts`) so the form previews instantly — keep it in sync with Python.

## UI conventions

- Style with Tailwind utilities + CSS-variable tokens: `var(--primary)` (#2563EB), `--card`,
  `--border`, `--muted-foreground`, status colors. **Don't hardcode hex.**
- Currency: always `fmtETB(value)`; use `font-mono` on numeric cells.
- Feedback via the toast store: `toast.success(...)` / `toast.error(...)`.
- Icons from `lucide-react`. Links into ERPNext via `erpnextUrl(...)`; print/PDF via
  `printViewUrl` / `pdfDownloadUrl`.
- Drawers: fixed right slide-over with an overlay; tabs via local `useState`; an edit mode
  toggle that swaps read-only `Stat` displays for inputs (see `ShipmentDetailDrawer.tsx`).

## Definition of done

`npx tsc --noEmit -p tsconfig.app.json` passes and `npm run lint` is clean (run inside
`frontend/`). New types in `types.ts`; new data access as a hook. See `CLAUDE.md`.
