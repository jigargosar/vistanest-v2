---
estimated_steps: 8
estimated_files: 4
skills_used: []
---

# T03: Add JSON export button and run full slice verification

Add an `exportJson` function to `persistence.ts` that creates a JSON Blob from `getSnapshot(state)` and triggers a browser download. Wire it to an Export button in the Topbar. Write a unit test for the export function.

This task delivers R008 (JSON export).

The export button should:
- Be placed in the Topbar next to the help button
- Use a download icon or text label
- Call `getSnapshot(state)` → JSON.stringify → Blob → URL.createObjectURL → click hidden anchor
- File name: `vistanest-export-{ISO date}.json`

Final verification: run full test suite and typecheck to confirm all existing + new tests pass.

## Inputs

- ``src/core/persistence.ts` — add exportJson function here`
- ``src/ui/Topbar.tsx` — add Export button`
- ``src/ui/context.ts` — useAppState hook for accessing state in Topbar`
- ``src/core/model.ts` — AppState type for getSnapshot`

## Expected Output

- ``src/core/persistence.ts` — exportJson function added`
- ``src/core/persistence.test.ts` — test for exportJson producing valid JSON matching snapshot structure`
- ``src/ui/Topbar.tsx` — Export button wired to exportJson via context`

## Verification

pnpm test && pnpm typecheck
