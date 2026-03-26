---
estimated_steps: 12
estimated_files: 2
skills_used: []
---

# T03: Style item rows, content area, and edit input with design spec theme

Apply the full design theme to OutlineItemRow.tsx and OutlineView.tsx. This is the highest-touch visual task — most design detail lives in item rendering.

**OutlineView.tsx**: Replace font-mono text-sm with body font (font-body), proper text size (text-base / 16px). Wrap items in a centered max-w-[900px] container with appropriate horizontal padding.

**OutlineItemRow.tsx changes**:
- Indent: change from `depth * 24` to `depth * 26` per design spec
- Row height: add min-h-[36px] for 36px minimum height
- Selection highlight: replace bg-white/10 with amber left border (border-l-2 border-amber) + subtle amber background (bg-amber/5 or similar) when isCursor is true
- Collapse chevrons: replace text ▶/▼ with proper SVG chevron icons (inline SVG, right-pointing and down-pointing), sized to match checkboxes
- Checkboxes: replace ☑/☐ text with styled checkbox elements — amber fill when completed, muted border when unchecked
- Edit input: add amber border + glow effect (border-amber + ring/box-shadow with amber color) instead of bare outline-none. Same font as body text.
- Completed items: line-through with reduced opacity (already exists, verify it uses theme colors)
- Empty state text: use theme text-secondary color

All changes are CSS/className only — no behavioral changes. The data-testid='inline-edit-input' attribute and all event handlers must remain untouched to keep existing tests passing.

## Inputs

- ``src/ui/OutlineItemRow.tsx` — existing functional component to restyle`
- ``src/ui/OutlineView.tsx` — existing list container to restyle`
- ``src/global.css` — design tokens from T01`

## Expected Output

- ``src/ui/OutlineItemRow.tsx` — fully themed item rows with amber selection, styled chevrons/checkboxes, edit glow`
- ``src/ui/OutlineView.tsx` — centered ~900px content area with body font`

## Verification

pnpm typecheck && pnpm test
