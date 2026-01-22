# Opperheufd Modular Architecture

This repository follows a modular architecture with shared components and independent project modules.

## Project Structure

```
opperheufd_com/
├── shared/                      # Shared components, styles, and scripts
│   ├── components/              # Reusable HTML components
│   │   ├── header.html
│   │   └── footer.html
│   ├── styles/                  # Shared CSS
│   │   ├── base.css            # Base styles and CSS variables
│   │   └── components.css       # Component styles
│   ├── scripts/                 # Shared JavaScript utilities
│   │   ├── partials.js         # HTML/JSON loading utilities
│   │   └── cards.js            # Card rendering system
│   └── README.md               # Shared components documentation
│
├── modules/                     # Independent project modules
│   ├── hub/                     # Main landing page (opperheufd.com)
│   │   ├── index.html
│   │   ├── cards.json
│   │   └── README.md
│   │
│   └── mc/                      # Minecraft module (mc.opperheufd.com)
│       ├── site/               # Static website
│       │   ├── index.html
│       │   └── README.md
│       ├── apps/               # Node.js / Express (TypeScript) applications
│       │   └── minecraft_join_app/
│       ├── README.md
│       └── DEPLOYMENT.md
│
├── apps/                        # [LEGACY] Old app directory (to be removed)
│   └── minecraft_join_app/      # Being moved to modules/mc/apps/
│
└── site/                        # [LEGACY] Old site directory (to be removed)
    └── [old files]
```

## Architecture Principles

### 1. Modularity
- Each project lives in `modules/<name>/`
- Each module is independent and self-contained
- Modules can be deployed separately to different subdomains

### 2. Shared Resources
- Common UI patterns in `shared/components/`
- Reusable styles in `shared/styles/`
- Utility functions in `shared/scripts/`
- All modules import these resources using relative paths

### 3. Hub Pattern
- `modules/hub/` serves as the main entry point (opperheufd.com)
- Hub displays cards linking to all available modules
- Hub cards are defined in `modules/hub/cards.json`

## Module Guidelines

### Creating a New Module

1. Create folder: `modules/<module-name>/`
2. Create structure:
   ```
   modules/<module-name>/
   ├── site/                    # If it has a static site
   │   └── index.html
   ├── apps/                    # If it has backend apps
   │   └── <app-name>/
   ├── README.md               # Module documentation
   └── DEPLOYMENT.md           # Deployment instructions
   ```

3. Import shared components:
   ```html
   <link rel="stylesheet" href="../../shared/styles/base.css" />
   <link rel="stylesheet" href="../../shared/styles/components.css" />
   <script src="../../shared/scripts/partials.js"></script>
   ```

4. Add module to hub:
   - Edit `modules/hub/cards.json`
   - Add card entry with title, description, and href to module URL

### Shared Component Usage

**Load Header & Footer:**
```html
<div id="site-header"></div>
<div id="site-footer"></div>

<script src="../../shared/scripts/partials.js"></script>
<script>
  loadPartial("site-header", "../../shared/components/header.html");
  loadPartial("site-footer", "../../shared/components/footer.html");
</script>
```

**Use Card System:**
```html
<template id="card-template">
  <article class="card">
    <h3 class="card-title"></h3>
    <p class="card-description"></p>
  </article>
</template>
<div id="cards"></div>

<script src="../../shared/scripts/cards.js"></script>
<script>
  loadAndRenderCards("cards.json");
</script>
```

## Deployment

### Hub (opperheufd.com)
- Serve files from `modules/hub/`
- Requires: `index.html`, `cards.json`, access to `shared/` for resources

### Modules (*.opperheufd.com)
- Each module deployed to its own subdomain
- Example: Minecraft module → `mc.opperheufd.com`
- Serves from `modules/<name>/site/` or `modules/<name>/apps/` depending on module type

### cPanel Setup

For each module:

1. **Static Site Module**
   - Create addon domain for subdomain
   - Point document root to `modules/<name>/site/`
   - Ensure `shared/` directory is accessible (symlink or shared hosting)

2. **Node.js / Express App Module**
  - Create Node.js application in cPanel (or use your Node hosting)
  - Set application root to `modules/<name>/apps/<app-name>/`
  - Set startup file to the compiled entry (e.g. `app.js`) or use the provided startup command
  - Install dependencies with `npm install` and run `npm run build` if needed

See individual module `DEPLOYMENT.md` files for specific instructions.

## Reusable Components Analysis

### Components Across Modules

**Header & Footer** - Used by all modules
- Shared in `shared/components/`
- Dynamically loaded via `loadPartial()`

**Button Styling** - Used by all modules
- `.btn` class in `shared/styles/components.css`
- Used for CTAs (whitelist, join, etc.)

**Form Components** - Used by Minecraft + future modules
- Form styling in `shared/styles/components.css`
- Can be extended for validation utilities

**Card System** - Used by hub + could be reused
- Card components in `shared/scripts/cards.js`
- Minecraft module could display cards for servers/stats

**Message States** - Used by server-side apps
- `.error`, `.success` styles in `shared/styles/components.css`
- Can be used consistently across all modules

### Potential Shared Utilities

**To Create:**
1. Form validation library (`shared/scripts/validation.js`)
2. Authentication helper for Discord OAuth (`shared/scripts/auth.js`)
3. Notification/toast system (`shared/scripts/notify.js`)
4. Date/time formatting utilities (`shared/scripts/date-utils.js`)

## Migration from Old Structure

### Old Structure
```
site/
  ├── index.html
  ├── cards.json
  ├── minecraft.html
  ├── styles.css
  ├── header.txt
  └── footer.txt

apps/
  └── minecraft_join_app/
```

### New Structure
```
modules/hub/
  ├── index.html
  ├── cards.json

modules/mc/
  ├── site/
  │   └── index.html
  └── apps/
      └── minecraft_join_app/

shared/
  ├── components/
  │   ├── header.html
  │   └── footer.html
  ├── styles/
  │   ├── base.css
  │   └── components.css
  └── scripts/
      ├── partials.js
      └── cards.js
```

**Old files can be removed after deployment verification.**

## Next Steps

1. ✅ Create shared components library
2. ✅ Create hub module
3. ✅ Create minecraft module structure
4. 📋 Move application to `modules/mc/apps/`
5. 📋 Update the app to use shared components in templates
6. 📋 Test all modules locally
7. 📋 Deploy to subdomains on cPanel
8. ✅ Remove old `site/` directory (completed)
9. 📋 Create deployment documentation per module
10. 📋 Set up symlinks for shared resources if needed

## Features for Future Enhancement

- **Component Library** - Create reusable UI component system
- **Theme System** - Support multiple color themes via CSS variables
- **Module Registry** - Auto-discovery of modules
- **Analytics** - Shared tracking across modules
- **Error Handling** - Centralized error page template
- **Accessibility** - ARIA labels, keyboard navigation helpers
- **Performance** - Resource optimization, caching strategies
