# Popout Project Journal

## 2026-02-17: Initial Popout Implementation

### Summary

Implemented tile popout functionality with URL-First architecture for the home page domain cards.

### What Was Built

1. **TilePopoutComponent** (`src/app/features/tile-popout/`)
   - New component that renders a domain tile in a separate browser window
   - Receives tile ID via route param, text via URL query param
   - Uses `UrlStateService` for URL-First state management
   - Broadcasts changes to main window via `PopOutContextService`

2. **HomeComponent Updates** (`src/app/features/home/`)
   - Converted static HTML cards to data-driven `*ngFor` loop
   - Added click handlers to open tiles in popout windows
   - Shows placeholder when tile is popped out
   - Listens for `URL_PARAMS_CHANGED` messages to sync input text from popouts
   - Broadcasts `URL_PARAMS_SYNC` when local input changes while popout is open

3. **AppComponent Updates** (`src/app/app.component.*`)
   - Added `isPopout` detection based on `/panel/` route prefix
   - Conditionally hides header/footer in popout windows

4. **Routing** (`src/app/app-routing.module.ts`)
   - Added route: `panel/:gridId/:panelId/:type` for popout windows

### URL-First Pattern

The implementation follows the URL-First architecture from the vvroom framework:
- URL query params are the source of truth
- `UrlStateService.watchParams()` reads state
- `UrlStateService.setParam()` writes state
- `BroadcastChannel` API syncs state between windows
- Debounced input changes (300ms) prevent excessive updates

### Key Files Created

- `src/app/features/tile-popout/tile-popout.component.ts`
- `src/app/features/tile-popout/tile-popout.component.html`
- `src/app/features/tile-popout/tile-popout.component.scss`

### Key Files Modified

- `src/app/features/home/home.component.ts`
- `src/app/features/home/home.component.html`
- `src/app/features/home/home.component.scss`
- `src/app/app.component.ts`
- `src/app/app.component.html`
- `src/app/app-routing.module.ts`
- `src/app/app.module.ts`
- `prompt.md` (added URL-First documentation)

### Testing Notes

- Dev server: `npm run dev:server` (port 4208)
- Click any tile card to open popout
- Type in either input field - changes sync bidirectionally
- Close popout - tile reappears on home page
