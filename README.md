# Opperheufd Modular Architecture - Quick Start

## What Changed?

Your site has been restructured into a **modular hub-and-spoke architecture**:

```
opperheufd.com (hub)
    ↓
    ├→ mc.opperheufd.com (Minecraft module)
    ├→ project2.opperheufd.com (future project)
    └→ project3.opperheufd.com (future project)
```

## New Structure

```
shared/                          ← Reusable components & utilities
├── components/                  ← HTML: header, footer
├── styles/                      ← CSS: base, components
└── scripts/                     ← JS: partials, cards

modules/                         ← Independent projects
├── hub/                         ← Main landing (opperheufd.com)
└── mc/                          ← Minecraft (mc.opperheufd.com)
    ├── site/                    ← Static pages
    └── apps/minecraft_join_app/ ← Flask whitelist app

[OLD] site/, apps/              ← Legacy (can be removed after testing)
```

## Key Features

✅ **Modular** - Each project independent, separate deployments
✅ **Shared Components** - Header, footer, styling used everywhere
✅ **Reusable Code** - Common utilities reduce duplication
✅ **Subdomain-Ready** - Scale to multiple projects easily
✅ **Hub Pattern** - Single entry point (opperheufd.com) with links to all projects

## Files to Review

1. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Complete technical overview
2. **[MIGRATION.md](MIGRATION.md)** - How to deploy the new structure
3. **[COMPONENTS.md](COMPONENTS.md)** - Reusable components analysis
4. **[shared/README.md](shared/README.md)** - Shared utilities documentation

## Quick Deployment

### Local Testing

```bash
# From project root
python3 -m http.server 8000

# Visit:
# - Hub: http://localhost:8000/modules/hub/
# - MC: http://localhost:8000/modules/mc/site/
```

### To Production (cPanel)

1. **Hub (opperheufd.com)**
   - Point document root to `modules/hub/`
   - Ensure `shared/` is accessible

2. **Minecraft (mc.opperheufd.com)**
   - Static site: document root to `modules/mc/site/`
   - Flask app: Python app at `modules/mc/apps/minecraft_join_app/`

See [MIGRATION.md](MIGRATION.md#step-4-cpanel-configuration) for details.

## Adding a New Project

1. Create folder: `modules/project-name/`
2. Create `site/index.html` with shared imports:
   ```html
   <link rel="stylesheet" href="../../shared/styles/base.css" />
   <link rel="stylesheet" href="../../shared/styles/components.css" />
   <script src="../../shared/scripts/partials.js"></script>
   ```
3. Load header/footer:
   ```javascript
   loadPartial("site-header", "../../shared/components/header.html");
   loadPartial("site-footer", "../../shared/components/footer.html");
   ```
4. Add to hub: Edit `modules/hub/cards.json`
5. Done! ✨

## Reusable Components Already Extracted

✅ Header + Footer
✅ Base styling + CSS variables  
✅ Component styles (buttons, forms, cards, messages)
✅ Utilities (HTML/JSON loader, card renderer)

## Recommended Next Extractions

🟡 Form validation library
🟡 Notification/toast system  
🟡 Date utilities
🟡 Authentication helpers

See [COMPONENTS.md](COMPONENTS.md) for details and prioritization.

## Need Help?

- **Deployment questions?** → [MIGRATION.md](MIGRATION.md)
- **Technical architecture?** → [ARCHITECTURE.md](ARCHITECTURE.md)
- **Component reuse?** → [COMPONENTS.md](COMPONENTS.md)
- **Shared utilities?** → [shared/README.md](shared/README.md)

---

**Status:** ✅ New modular structure ready for testing and deployment
