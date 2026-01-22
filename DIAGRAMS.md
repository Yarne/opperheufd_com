# Architecture Diagrams

Visual representations of the modular architecture.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  OPPERHEUFD ECOSYSTEM                   │
└─────────────────────────────────────────────────────────┘

                         📍 opperheufd.com
                         (Hub Landing Page)
                                |
                    ┌───────────┼───────────┐
                    |           |           |
              🎮 Minecraft   Project 2   Project 3
           mc.opperheufd    (future)     (future)
                    |
        ┌───────────┴───────────┐
        |                       |
    Static Site            Node.js App
  (Info Page)          (Whitelist Mgmt)
        |                       |
    mc.opperheufd.com      /join /admin
```

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                  BROWSER REQUEST                        │
└─────────────────────────────────────────────────────────┘
                           |
                           v
        ┌────────────────────────────────────┐
        │  Load index.html                   │
        │  (with relative paths)             │
        └────────────────────────────────────┘
                           |
        ┌──────────────────┼──────────────────┐
        |                  |                  |
        v                  v                  v
   ┌────────────┐    ┌──────────┐    ┌──────────────┐
   │ Load CSS   │    │ Load JS  │    │ Load HTML    │
   ├────────────┤    ├──────────┤    ├──────────────┤
   │ base.css   │    │ partials │    │ header.html  │
   │ components │    │ cards    │    │ footer.html  │
   └────────────┘    └──────────┘    └──────────────┘
        |                  |                  |
        └──────────────────┼──────────────────┘
                           |
                           v
        ┌────────────────────────────────────┐
        │  Load Module-Specific Data         │
        ├────────────────────────────────────┤
        │  Hub: cards.json (projects)        │
        │  MC: (static content in HTML)      │
        └────────────────────────────────────┘
                           |
                           v
        ┌────────────────────────────────────┐
        │       RENDER PAGE                  │
        ├────────────────────────────────────┤
        │  Header + Content + Footer         │
        │  All styled via shared CSS         │
        └────────────────────────────────────┘
```

## Module Dependency Graph

```
All Modules
    ↓
    ├─ Depends on: shared/components/header.html
    ├─ Depends on: shared/components/footer.html
    ├─ Depends on: shared/styles/base.css
    ├─ Depends on: shared/styles/components.css
    └─ Depends on: shared/scripts/partials.js

Hub Module
    └─ Additionally depends on: shared/scripts/cards.js

Minecraft Module
    └─ No additional dependencies
    (Static HTML + Node.js app handled separately)
```

## File Import Flow

### Hub Module Path Resolution

```
modules/hub/index.html (current location)
    |
    ├─ CSS: ../../shared/styles/base.css
    ├─ CSS: ../../shared/styles/components.css
    ├─ JS: ../../shared/scripts/partials.js
    ├─ JS: ../../shared/scripts/cards.js
    ├─ Component: ../../shared/components/header.html
    ├─ Component: ../../shared/components/footer.html
    └─ Data: ./cards.json
```

### Minecraft Site Path Resolution

```
modules/mc/site/index.html (current location)
    |
    ├─ CSS: ../../../shared/styles/base.css
    ├─ CSS: ../../../shared/styles/components.css
    ├─ JS: ../../../shared/scripts/partials.js
    ├─ Component: ../../../shared/components/header.html
    └─ Component: ../../../shared/components/footer.html
```

## Deployment Architecture

```
┌────────────────────────────────────────────────────────┐
│              PRODUCTION DEPLOYMENT                     │
└────────────────────────────────────────────────────────┘

┌────────────────────┐
│  /public_html/     │  (cPanel root)
│                    │
├─ shared/           │  ← Accessible to all modules
│  ├─ components/    │     (symlink or duplicate)
│  ├─ styles/        │
│  └─ scripts/       │
│                    │
├─ modules/hub/      │  ← opperheufd.com document root
│  ├─ index.html     │
│  └─ cards.json     │
│                    │
├─ modules/mc/site/  │  ← mc.opperheufd.com doc root
│  └─ index.html     │
│                    │
└─ modules/mc/apps/  │  ← Node.js app
    └─ node-app/      │     (Node.js app in cPanel)
      ├─ app.py      │
      └─ ...         │
```

## Component Hierarchy

```
┌────────────────────────────────────────────────────────┐
│                 SHARED COMPONENTS                      │
└────────────────────────────────────────────────────────┘
                           |
        ┌──────────────────┼──────────────────┐
        |                  |                  |
    STRUCTURE          STYLING            BEHAVIOR
        |                  |                  |
        v                  v                  v
    ┌────────┐        ┌───────────┐    ┌──────────┐
    │Header  │        │base.css   │    │partials  │
    │Footer  │        │colors     │    │(loading) │
    │Layout  │        │spacing    │    │          │
    └────────┘        │typography │    │cards     │
                      └───────────┘    │(rendering)
                                       └──────────┘
                           |
        ┌──────────────────┼──────────────────┐
        |                  |                  |
       HUB            MINECRAFT          FUTURE
     Module           Module            Modules
```

## CSS Variable Cascade

```
shared/styles/base.css
    ↓ (defines)
:root CSS variables
    ├─ --color-primary: #0050b3
    ├─ --color-text: #1b1b1b
    ├─ --spacing-md: 16px
    ├─ --radius-md: 6px
    └─ ... (20+ variables)
    ↓ (used by)
shared/styles/components.css
    ├─ .button { background: var(--color-primary) }
    ├─ .card { padding: var(--spacing-md) }
    ├─ .form input { color: var(--color-text) }
    └─ ... (component styles)
    ↓ (inherited by)
All Modules
    └─ Automatically get consistent theme
```

## Module Addition Flow

```
User creates new module
        ↓
Create modules/project-name/
        ↓
├─ Create site/index.html
├─ Copy shared imports
│   <link href="../../shared/styles/base.css" />
│   <script src="../../shared/scripts/partials.js" />
│
└─ Load components
    loadPartial("site-header", "../../shared/components/header.html");
        ↓
Edit modules/hub/cards.json
    Add: {
      "title": "Project Name",
      "href": "https://project.opperheufd.com",
      "description": "..."
    }
        ↓
Hub automatically renders new project card
        ↓
✅ Module live!
```

## Reusable Component Extraction Pattern

```
Original Code (Duplicated)
    ├─ Module A: function validateName() { ... }
    ├─ Module B: function validateName() { ... }
    └─ Module C: needs same function
        ↓ (Extract)
    shared/scripts/validation.js
        ├─ function validateName() { ... }
        └─ SINGLE authoritative version
        ↓ (Import)
    All modules use: <script src="/shared/scripts/validation.js"></script>
        ↓
✅ DRY principle achieved
✅ Bug fixes in one place
✅ Consistent validation everywhere
```

## Request Timeline

```
0ms  ┌─ User visits hub
     └─ Browser requests index.html

50ms ┌─ Parse HTML
     ├─ Request CSS files (base.css, components.css)
     ├─ Request JS files (partials.js, cards.js)
     └─ Request component files (header.html, footer.html)

100ms┌─ Receive CSS files
     ├─ Apply styles
     ├─ Parse JS
     └─ Execute initialization

150ms┌─ Load HTML components
     ├─ Insert header.html
     ├─ Insert footer.html
     ├─ Request cards.json
     └─ Load

200ms┌─ Render cards
     ├─ For each card in JSON:
     │  ├─ Clone template
     │  ├─ Fill data
     │  └─ Insert to DOM
     └─ Apply styles

250ms┌─ Complete
     └─ Page fully interactive

────────────────────────────────────────
Total: ~250ms (highly optimized!)
```

## Scale Visualization

### Current Scale
```
   Hub (1 module)
    ├─ Card 1: Minecraft ✓
    ├─ Card 2: Empty
    └─ Card 3: Empty
    
   Minecraft Module ✓
    ├─ Site
    └─ App
    
   Shared (1x used by all)
    └─ Resources
```

### Potential Scale
```
   Hub (scalable)
    ├─ Card 1: Minecraft ✓
    ├─ Card 2: Blog
    ├─ Card 3: Portfolio
    ├─ Card 4: Analytics
    ├─ Card 5: Admin Panel
    ├─ Card 6: API Docs
    └─ Card N: ??? (unlimited)
    
   Each Module (independent)
    ├─ Minecraft ✓
    ├─ Blog (future)
    ├─ Portfolio (future)
    ├─ Analytics (future)
    └─ ProjectN (future)
    
   Shared (scales with modules)
    ├─ Components (extensible)
    ├─ Styles (themes possible)
    ├─ Scripts (utilities accumulate)
    └─ All benefits multiply with each module
```

## Benefits Visualization

```
WITHOUT Modularity              WITH Modularity
───────────────────            ─────────────────

Header Code
├─ Module A: copy              └─ shared/
├─ Module B: copy              Module A, B, C all use
├─ Module C: copy              
└─ Module D needs it?          Any changes:
                               ✓ Update once
Update header:                 ✓ Affects all
✗ Change 4 places              ✓ Consistent
✗ Risk inconsistency           
✗ Bugs multiply                Bugs:
                               ✓ Fix once
Shared Utils                   ✓ Fixes everywhere
├─ Validate: Copy/paste        ✓ Tested once
├─ Format Date: Copy/paste     
├─ Show Error: Copy/paste      New Module:
│                              ✓ Start faster
New Module:                    ✓ Use all utilities
✗ Rewrite everything           ✓ Get free updates
✗ Risk missing pieces          
✗ Time-consuming               Maintenance:
                               ✓ Simple
Maintenance:                   ✓ Scalable
✗ Complex                      ✓ Clear
✗ Hard to scale                
✗ Error-prone                  
```

---

**Ready to understand the structure? Read ARCHITECTURE.md**  
**Want to deploy? See MIGRATION.md**  
**Need technical details? Check TREE.md**
