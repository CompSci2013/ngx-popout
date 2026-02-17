# Popout Project

## Overview

Popout is a minimal Angular application derived from the vvroom project. It contains only the home page with domain selection cards, while preserving the full `framework/` and `domain-config/` directories for future development.

## Project Origin

This project was created by copying `~/projects/vvroom/` and removing the Discover page functionality. The following components were intentionally excluded:

- `src/app/features/discover/` - Main discovery interface
- `src/app/features/panel-popout/` - Pop-out window renderer
- `src/app/features/popout/` - Legacy pop-out component
- `src/app/features/automobile/` - Automobile wrapper component
- `e2e/` - End-to-end tests

## Current State

The home page displays five domain cards (Automobiles, Agriculture, Physics, Chemistry, Mathematics), each with a text input control beneath it. Clicking a card opens it in a popout window, leaving a placeholder on the home page.

### Popout Functionality

- Click a tile card → opens in a new browser window at `/panel/home/{tileId}/tile?text={inputText}`
- Popout windows have no header/footer (detected via `/panel/` route prefix)
- Text input syncs bidirectionally between home page and popout via URL-First pattern
- Closing the popout restores the tile on the home page

### Key Files Modified from vvroom

| File | Changes |
|------|---------|
| `app-routing.module.ts` | Removed Discover and panel-popout routes |
| `app.module.ts` | Removed Discover-related component declarations |
| `app.component.ts` | Removed pop-out detection logic |
| `app.component.html` | Removed Discover nav link |
| `home.component.html` | Made all domain cards disabled, added text inputs |
| `angular.json` | Renamed project from "vvroom" to "popout" |
| `package.json` | Renamed from "vvroom" to "popout" |

### Preserved Directories

- `src/app/framework/` - Full framework with components, services, models, adapters
- `src/app/domain-config/` - Automobile domain configuration

## URL-First Architecture

The application follows the **URL-First** pattern where the URL is the single source of truth for application state.

### Core Principle

All application state that needs to be shared or persisted is encoded in URL query parameters. Components read state from the URL and write changes back to the URL. This enables:

- Shareable/bookmarkable application states
- Browser back/forward navigation
- Cross-window state synchronization

### Key Services

| Service | Purpose |
|---------|---------|
| `UrlStateService` | Bidirectional sync between app state and URL query params |
| `PopOutManagerService` | Opens/tracks popout windows, broadcasts state via BroadcastChannel |
| `PopOutContextService` | Detects popout context, handles cross-window messaging |

### Cross-Window Communication

Uses `BroadcastChannel` API for efficient messaging between windows:

```typescript
// Message types (PopOutMessageType enum)
URL_PARAMS_CHANGED  // Popout → Main: "I changed the URL params"
URL_PARAMS_SYNC     // Main → Popout: "Here are the current params"
PANEL_READY         // Popout → Main: "I'm initialized"
CLOSE_POPOUT        // Main → Popout: "Please close"
STATE_UPDATE        // Main → Popout: "Here's the full state"
```

### URL-First Flow Example

1. User types in home page input → stored in component state
2. User clicks tile → `PopOutManagerService.openPopOut()` opens window with `?text=value`
3. Popout reads text from URL via `UrlStateService.watchParams()`
4. User edits text in popout → debounced update to URL via `UrlStateService.setParam()`
5. Popout broadcasts `URL_PARAMS_CHANGED` to main window
6. Main window receives message → updates its input field
7. If main window input changes while popout is open → broadcasts `URL_PARAMS_SYNC`

### Implementation Pattern

```typescript
// Reading from URL (source of truth)
this.urlState.watchParams()
  .pipe(takeUntil(this.destroy$))
  .subscribe(params => {
    this.inputText = params['text'] || '';
  });

// Writing to URL (updates source of truth)
this.urlState.setParam('text', newValue, true);

// Broadcasting to other windows
this.popOutContext.sendMessage({
  type: PopOutMessageType.URL_PARAMS_CHANGED,
  payload: { params: { text: newValue } }
});
```

## Development

```bash
# Install dependencies
npm install

# Start dev server (port 4208)
npm run dev:server

# Build for production
npm run build
```

The dev server runs on `http://0.0.0.0:4208`.

## GitLab Integration

### Repository Location

- **Group**: halo (namespace_id: 7)
- **Project**: popout
- **URL**: http://gitlab.minilab/halo/popout

### Access

Users with access to the popout repository:
- odin (Owner, access_level: 50)
- walter (Maintainer, access_level: 40)
- jerry (Maintainer, access_level: 40)

### GitLab API Authentication

The GitLab instance at `gitlab.minilab` uses Personal Access Token (PAT) authentication.

**Token Configuration:**
- Environment variable: `GITLAB_TOKEN` (stored in `~/.bashrc`)
- Authenticated user: `lab-agent` (admin account)
- Load before use: `source ~/.bashrc`

**API Pattern:**
```bash
# All API calls use PRIVATE-TOKEN header
curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "http://gitlab.minilab/api/v4/projects"
```

**Git Remote Authentication:**
```bash
# Embed token in URL for git operations
git remote set-url origin "http://lab-agent:${GITLAB_TOKEN}@gitlab.minilab/halo/popout.git"
```

### Common GitLab API Operations

```bash
# Verify token
curl -s -H "PRIVATE-TOKEN: $GITLAB_TOKEN" "http://gitlab.minilab/api/v4/user"

# List projects in halo group
curl -s -H "PRIVATE-TOKEN: $GITLAB_TOKEN" "http://gitlab.minilab/api/v4/groups/7/projects"

# Get project details (URL-encode slashes as %2F)
curl -s -H "PRIVATE-TOKEN: $GITLAB_TOKEN" "http://gitlab.minilab/api/v4/projects/halo%2Fpopout"

# List group members
curl -s -H "PRIVATE-TOKEN: $GITLAB_TOKEN" "http://gitlab.minilab/api/v4/groups/7/members"

# Add user to group (user_id, access_level: 30=Developer, 40=Maintainer, 50=Owner)
curl -s -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --request POST \
  --data "user_id=18&access_level=40" \
  "http://gitlab.minilab/api/v4/groups/7/members"
```

### Important GitLab Gotchas

1. **Use HTTP, not HTTPS** for internal API: `http://gitlab.minilab`
2. **URL-encode slashes** in project paths: `halo/popout` → `halo%2Fpopout`
3. **Save API responses to file** before parsing (jq piping can fail silently)
4. **Use pagination** for large results: `?per_page=100`

### Known Group IDs

| Group | ID |
|-------|-----|
| halo | 7 |
| archive | 89 |
| games | 90 |
| llm | 91 |
| forge | 103 |

## Technology Stack

- Angular 13.3
- PrimeNG 13.4.1
- RxJS 7.5
- TypeScript 4.6
- Plotly.js (for charts in framework)
- SCSS for styling

## Project Structure

```
src/
├── app/
│   ├── app.component.*          # Root component (header, footer, router-outlet)
│   ├── app.module.ts            # Root module
│   ├── app-routing.module.ts    # Routes (home, panel/:gridId/:panelId/:type)
│   ├── primeng.module.ts        # PrimeNG imports
│   ├── domain-config/           # Domain configurations
│   │   └── automobile/          # Automobile domain (models, configs, adapters)
│   ├── features/
│   │   ├── home/                # Home page component
│   │   └── tile-popout/         # Popout window component for tiles
│   └── framework/               # Reusable framework
│       ├── adapters/            # Generic API and URL mappers
│       ├── components/          # Reusable UI components
│       ├── models/              # TypeScript interfaces (incl. popout.interface.ts)
│       ├── services/            # Core services (incl. url-state, popout-manager, popout-context)
│       ├── tokens/              # Injection tokens
│       └── utils/               # Utility functions
├── assets/
├── environments/
├── types/
│   └── plotly.d.ts              # Plotly type declarations
├── index.html
├── main.ts
├── polyfills.ts
└── styles.scss
```
