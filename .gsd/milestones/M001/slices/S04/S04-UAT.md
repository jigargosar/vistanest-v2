# S04: Persistence + Export — UAT

**Milestone:** M001
**Written:** 2026-03-26T03:39:07.918Z

# S04: Persistence + Export — UAT

**Milestone:** M001
**Written:** 2026-03-26

## UAT Type

- UAT mode: mixed (artifact-driven + live-runtime)
- Why this mode is sufficient: Persistence and export are verified via unit tests (artifact-driven) but data-survives-refresh and Export button require live browser interaction to fully prove.

## Preconditions

- `pnpm dev` running at localhost:5173
- Browser with IndexedDB support (any modern browser)
- Fresh browser profile or cleared IndexedDB for VistaNest (to test first-run seed)

## Smoke Test

Open `http://localhost:5173` in the browser. The app should load within 1-2 seconds, showing a demo outline with "🌲 Welcome to VistaNest" and keyboard shortcut hints. This confirms IDB load + demo seed + rendering all work together.

## Test Cases

### 1. First-Run Demo Seed

1. Clear IndexedDB for the VistaNest domain (DevTools → Application → Storage → Clear site data)
2. Reload the page
3. **Expected:** A multi-level welcome outline appears with items like "🌲 Welcome to VistaNest", keyboard shortcut hints, and "✏️ Try it out" section.

### 2. Data Survives Page Refresh

1. Add a new item: press `o`, type "Persistence test item", press `Esc`
2. Wait at least 3 seconds (auto-save debounce is 2s)
3. Reload the page (F5)
4. **Expected:** "Persistence test item" is present in the outline with all other items preserved.

### 3. Multiple Edits Persist

1. Create 3 new items with distinct content
2. Indent one (Tab), mark one complete (x)
3. Wait 3 seconds, reload
4. **Expected:** All 3 items present with correct content, indentation, and completion state.

### 4. JSON Export Download

1. Click the Export button (download icon) in the top bar
2. **Expected:** A file downloads named `vistanest-export-YYYY-MM-DD.json`
3. Open the file — valid JSON with `$modelType`, `items` object, `title` field.

### 5. Export Button Location

1. Look at the top bar
2. **Expected:** Export button visible next to Help (?), has download arrow icon and "Export" label, matches dark theme.

### 6. Loading State

1. Set network throttling to Slow 3G, reload
2. **Expected:** "Loading…" with pulsing animation appears briefly before outline renders.

## Edge Cases

### IDB Load Error Fallback

1. Run `indexedDB.deleteDatabase('vistanest')` in console, reload
2. **Expected:** App falls back to demo seed. console.warn in DevTools, no user-facing error.

### Undo History Cleared After Load

1. Clear IDB, reload to get demo seed
2. Press `u` (undo)
3. **Expected:** Nothing happens — demo seed operations are not undoable.

## Failure Signals

- Page shows "Loading…" forever — bootstrap stuck
- Data missing after reload — auto-save not firing
- Export produces empty/malformed JSON
- Export button missing from Topbar
- console.warn messages about save/load failures

## Not Proven By This UAT

- Import functionality (does not exist)
- Performance with large datasets
- Cross-browser IDB compatibility
- Auto-save visual indicator (none exists)

## Notes for Tester

- Wait at least 3 seconds after last edit before reloading to verify persistence (2s debounce).
- Export triggers immediate download — no confirmation dialog.
- Test in normal browser window, not incognito (IDB may be restricted).
