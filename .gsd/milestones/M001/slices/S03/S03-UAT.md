# S03: Visual Design + Layout — UAT

**Milestone:** M001
**Written:** 2026-03-26T03:20:45.400Z

# S03: Visual Design + Layout — UAT

**Milestone:** M001
**Written:** 2026-03-26

## UAT Type

- UAT mode: mixed (artifact-driven + live-runtime)
- Why this mode is sufficient: Design/visual changes are best verified visually in a running app, but automated tests confirm no behavioral regressions.

## Preconditions

- `pnpm dev` running (Vite dev server at localhost:5173)
- Browser with dev tools available
- No cached/stale CSS — hard refresh if needed

## Smoke Test

Open the app in a browser. Dark background (#0c0c0e), amber-accented topbar at top, status bar at bottom, styled outline items in center. If any are missing or page is white, the slice is broken.

## Test Cases

### 1. Design Tokens Applied
1. Open the app in browser
2. Inspect root element background → **Expected:** #0c0c0e dark
3. Inspect item text font → **Expected:** IBM Plex Sans
4. Inspect topbar logo → **Expected:** Space Grotesk, amber #e5a832

### 2. Three-Zone Layout
1. Scroll content area → **Expected:** Topbar and status bar stay fixed
2. Content scrolls between bars without overlap
3. Narrow browser window → **Expected:** Content stays centered

### 3. Topbar Elements
1. Logo "VistaNest" in amber Space Grotesk
2. Search input with "/" hint — non-functional
3. Disabled Due/Tags/Lists nav links
4. Help button and avatar circle on right

### 4. Status Bar — Mode
1. No edit mode → **Expected:** "NAVIGATE"
2. Enter to edit → **Expected:** "EDIT"
3. Escape → **Expected:** "NAVIGATE"

### 5. Status Bar — Counts
1. Observe counts → **Expected:** total and completed shown
2. Space to toggle complete → **Expected:** count updates
3. Backspace on empty to archive → **Expected:** total decreases

### 6. Item Selection
1. j/k to move cursor → **Expected:** amber left border + tint on selected item
2. No layout shift when selection changes

### 7. SVG Chevrons
1. Parent with children → **Expected:** SVG down chevron (not ▼)
2. h to collapse → **Expected:** SVG right chevron (not ▶)

### 8. Checkbox Styling
1. Uncompleted item → **Expected:** styled checkbox outline (not ☐)
2. Space to complete → **Expected:** amber filled checkbox, line-through text

### 9. Edit Input
1. Enter to edit → **Expected:** amber border + glow, body font, data-testid present

### 10. Centered 900px Layout
1. Wide window → **Expected:** content centered, max ~900px, padding on sides

## Edge Cases

### Empty state
1. Archive all items → **Expected:** muted secondary text, not bright white

### Scroll with many items
1. 20+ items → **Expected:** bars fixed, content scrolls smoothly

## Failure Signals
- White background instead of dark
- System font instead of IBM Plex Sans
- Missing topbar or status bar
- Content overlapping fixed bars
- Text triangles or text checkboxes instead of SVG
- Layout shift on cursor movement

## Not Proven By This UAT
- Topbar search functionality
- Nav link functionality
- Persistence of visual preferences
- Accessibility compliance audit

## Notes for Tester
- Seeded data provides enough items for most scenarios
- Font loading may take a moment on first visit
- Topbar and status bar at z-20 — anything rendering above them is a bug
