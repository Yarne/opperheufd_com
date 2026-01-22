# Directory Tree & File Reference

## Complete File Structure

```
opperheufd_com/
│
├── 📋 Documentation
│   ├── README.md               ← START HERE: Quick overview
│   ├── ARCHITECTURE.md         ← Technical deep dive
│   ├── MIGRATION.md            ← Deployment guide
│   ├── COMPONENTS.md           ← Reusable components analysis
│   └── STRUCTURE.md            ← This file
│
├── shared/                     ← 🔄 Shared across all modules
│   │
│   ├── components/             ← HTML building blocks
│   │   ├── header.html         ← Main navigation (all modules)
│   │   └── footer.html         ← Footer with copyright
│   │
│   ├── styles/                 ← CSS stylesheets  
│   │   ├── base.css            ← Colors, spacing, layout, typography
│   │   └── components.css      ← Cards, buttons, forms, messages
│   │
│   ├── scripts/                ← JavaScript utilities
│   │   ├── partials.js         ← Load HTML/JSON files
│   │   └── cards.js            ← Render card components
│   │
│   └── README.md               ← Shared utilities documentation
│
├── modules/                    ← 🏗️ Independent project modules
│   │
│   ├── hub/                    ← opperheufd.com (main landing)
│   │   ├── index.html          ← Hub page with project cards
│   │   ├── cards.json          ← Project definitions
│   │   └── README.md           ← Hub documentation
│   │
│   └── mc/                     ← mc.opperheufd.com (Minecraft)
│       │
│       ├── site/               ← Static website
│       │   ├── index.html      ← Minecraft server info page
│       │   └── README.md       ← Site documentation
│       │
│       ├── apps/               ← Backend applications
│       │   └── minecraft_join_app/   ← Flask whitelist app
│       │       ├── app.py
│       │       ├── templates/
│       │       ├── subscriptions.json
│       │       ├── admin_log.json
│       │       ├── passenger_wsgi.py
│       │       ├── requirements.txt
│       │       └── ...
│       │
│       ├── README.md           ← Module overview
│       └── DEPLOYMENT.md       ← Deployment instructions
│
├── 📦 [LEGACY] Old structure (to be removed after testing)
│   ├── site/                   
│   │   ├── index.html
│   │   ├── minecraft.html
│   │   ├── styles.css
│   │   ├── header.txt
│   │   └── footer.txt
│   │
│   └── apps/
│       └── minecraft_join_app/
│
└── 📄 Other files
    ├── .github/copilot-instructions.md
    └── [git config, etc]
```

## File Descriptions

### Documentation Files

| File | Purpose | Audience |
|------|---------|----------|
| README.md | Quick start and overview | Everyone |
| ARCHITECTURE.md | Technical architecture details | Developers |
| MIGRATION.md | How to deploy to production | DevOps/Developers |
| COMPONENTS.md | Analysis of reusable code | Developers |
| STRUCTURE.md | This directory reference | Reference |

### Shared Resources

#### Components
| File | Usage | Content |
|------|-------|---------|
| `shared/components/header.html` | All modules | Navigation header |
| `shared/components/footer.html` | All modules | Footer with copyright |

#### Styles
| File | Purpose | What's Included |
|------|---------|-----------------|
| `shared/styles/base.css` | All modules | CSS variables, base elements, layout |
| `shared/styles/components.css` | All modules | .card, .btn, forms, .error, .success |

#### Scripts
| File | Purpose | Functions |
|------|---------|-----------|
| `shared/scripts/partials.js` | All modules | `loadPartial()`, `loadJSON()` |
| `shared/scripts/cards.js` | Hub + extensible | `buildCard()`, `renderCards()`, `loadAndRenderCards()` |

### Hub Module

Located at `modules/hub/` - serves opperheufd.com

| File | Purpose |
|------|---------|
| `index.html` | Main page with project cards |
| `cards.json` | Project definitions (title, description, href) |
| `README.md` | Hub-specific documentation |

### Minecraft Module

Located at `modules/mc/` - serves mc.opperheufd.com

#### Static Site
| File | Purpose |
|------|---------|
| `site/index.html` | Minecraft server info page |
| `site/README.md` | Site documentation |

#### Flask App
| File | Purpose |
|------|---------|
| `apps/minecraft_join_app/app.py` | Main Flask application |
| `apps/minecraft_join_app/templates/` | HTML templates |
| `apps/minecraft_join_app/subscriptions.json` | Subscription data |
| `apps/minecraft_join_app/admin_log.json` | Audit log |
| `apps/minecraft_join_app/passenger_wsgi.py` | WSGI entry point |

#### Module Docs
| File | Purpose |
|------|---------|
| `README.md` | Module overview |
| `DEPLOYMENT.md` | Deployment instructions |

## Import Paths

### From Hub Module (`modules/hub/index.html`)
```html
<!-- Shared resources (3 levels up) -->
<link rel="stylesheet" href="../../shared/styles/base.css" />
<script src="../../shared/scripts/partials.js"></script>
```

### From Minecraft Site (`modules/mc/site/index.html`)
```html
<!-- Shared resources (4 levels up) -->
<link rel="stylesheet" href="../../../shared/styles/base.css" />
<script src="../../../shared/scripts/partials.js"></script>
```

### In Flask Templates (deployed with absolute paths)
```html
<!-- Shared resources (absolute path) -->
<link rel="stylesheet" href="/shared/styles/base.css" />
<script src="/shared/scripts/partials.js"></script>
```

## How to Add Files

### Add New Module
```bash
mkdir -p modules/new-project/site
touch modules/new-project/site/index.html
touch modules/new-project/README.md
```

Then edit `modules/hub/cards.json` to add the new project.

### Add Shared Component
```bash
touch shared/components/new-component.html
```

Then update `shared/README.md` with documentation.

### Add Shared Utility
```bash
touch shared/scripts/new-utility.js
```

Then document in `shared/README.md` and add to relevant sections of this file.

## Next Steps After Setup

### Phase 1: Testing
- [ ] Run `python3 -m http.server 8000`
- [ ] Visit `http://localhost:8000/modules/hub/`
- [ ] Verify all resources load

### Phase 2: Enhancement  
- [ ] Extract form validation to `shared/scripts/validation.js`
- [ ] Create notification system in `shared/scripts/notify.js`
- [ ] Add date utilities to `shared/scripts/date-utils.js`

### Phase 3: Deployment
- [ ] Deploy hub to opperheufd.com
- [ ] Deploy minecraft site to mc.opperheufd.com
- [ ] Deploy Flask app to mc.opperheufd.com
- [ ] Verify everything works

### Phase 4: Cleanup
- [x] Remove old `site/` directory
- [ ] Remove old `apps/` directory
- [ ] Archive for reference if needed

## File Sizes (Approximate)

| Component | Size | Notes |
|-----------|------|-------|
| `base.css` | 2.5 KB | All base styles + variables |
| `components.css` | 3.5 KB | All component styles |
| `partials.js` | 1 KB | Simple utility functions |
| `cards.js` | 1.5 KB | Card rendering logic |
| `header.html` | 150 B | Navigation |
| `footer.html` | 80 B | Copyright info |
| `hub/index.html` | 1 KB | Hub page |
| `mc/site/index.html` | 800 B | MC info page |

**Total Shared:** ~10 KB (very lightweight!)

## Performance Notes

- All resources use relative paths (no absolute URLs needed locally)
- CSS custom properties for performance (single color change = instant everywhere)
- Minimal HTML - components loaded dynamically
- No build step required - serve directly
- Caching friendly - shared files cached once, used everywhere

---

**Last Updated:** 2026-01-20
**Structure:** Modular Hub + Spokes (v1)
**Ready for:** Testing and Deployment
