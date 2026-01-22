# Migration & Implementation Guide

This guide explains how to transition from the old flat structure to the new modular architecture.

## Phase 1: Current State

**What exists:**
- Old site files in `site/` (index.html, cards.json, minecraft.html, styles.css, header.txt, footer.txt)
- Flask app in `apps/minecraft_join_app/`
- Both serve from root domain

## Phase 2: New Modular Structure

**What we've created:**
- `shared/` - Reusable components and styles
- `modules/hub/` - Main hub at opperheufd.com
- `modules/mc/site/` - Minecraft static site
- New deployment structure ready

## Implementation Steps

### Step 1: Move Flask App (Optional but Recommended)

The Flask app doesn't need to move from `apps/minecraft_join_app/` for it to work, but moving it to `modules/mc/apps/minecraft_join_app/` keeps everything organized.

```bash
# Backup
cp -r apps/minecraft_join_app apps/minecraft_join_app.backup

# Create new location
mkdir -p modules/mc/apps

# Copy to new location
cp -r apps/minecraft_join_app modules/mc/apps/

# Update routes if referencing old paths
# (Usually only needed if loading templates from shared location)
```

### Step 2: Update HTML Templates (Flask App)

If moving the Flask app or want to use shared components, update templates:

**Old approach:** Inline styles
**New approach:** Use shared stylesheet

Update `apps/minecraft_join_app/templates/whitelist.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Minecraft Whitelist</title>
    <!-- Use shared styles (adjust path based on deployment) -->
    <link rel="stylesheet" href="/shared/styles/base.css" />
    <link rel="stylesheet" href="/shared/styles/components.css" />
  </head>
  <body>
    <div id="site-header"></div>
    
    <main>
      <h1>Whitelist Access</h1>
      {% if error %}
        <p class="error">{{ error }}</p>
      {% endif %}
      {% if success %}
        <p class="success">{{ success }}</p>
      {% endif %}
      <form method="post" action="/whitelist">
        <label for="mc_name">Minecraft name</label>
        <input id="mc_name" name="mc_name" required />
        <button type="submit">Whitelist me</button>
      </form>
    </main>

    <div id="site-footer"></div>
    
    <!-- Shared scripts -->
    <script src="/shared/scripts/partials.js"></script>
    <script>
      const headerPath = '/shared/components/header.html';
      const footerPath = '/shared/components/footer.html';
      loadPartial("site-header", headerPath);
      loadPartial("site-footer", footerPath);
    </script>
  </body>
</html>
```

### Step 3: Deployment Strategy

**Option A: Current Server Setup**

Keep `apps/` and new modular structure on same server:

```
/public_html/
├── shared/           # Accessible to all
├── modules/hub/      # opperheufd.com root
├── modules/mc/site/  # mc.opperheufd.com root
└── apps/            # Flask runs here, or in modules/mc/apps/
```

**Option B: New Modular Setup**

Organize everything under modules:

```
/public_html/
├── shared/           # Symlinked or copied for each subdomain
├── modules/
│   ├── hub/         # opperheufd.com root
│   ├── mc/
│   │   ├── site/    # mc.opperheufd.com root
│   │   └── apps/    # Flask runs here
│   └── <more>/
```

### Step 4: cPanel Configuration

#### For Hub (opperheufd.com)

1. In cPanel, go to Addon Domains or main domain
2. Set document root to `/public_html/modules/hub/` (or symlink)
3. Ensure `shared/` is accessible - either:
   - Create symlink: `ln -s /public_html/shared /public_html/modules/hub/../../shared`
   - Or: Copy shared to each module: `cp -r shared modules/hub/`

#### For Minecraft (mc.opperheufd.com)

**Static files:**
1. Create addon domain for `mc.opperheufd.com`
2. Set document root to `/public_html/modules/mc/site/`
3. Ensure `shared/` is accessible

**Flask app:**
1. Create Python app in cPanel for same domain
2. Set application root to `/public_html/modules/mc/apps/minecraft_join_app/`
3. Set startup file to `passenger_wsgi.py`

### Step 5: Testing

**Test locally:**
```bash
# From project root
python3 -m http.server 8000

# Visit: http://localhost:8000/modules/hub/
# Check: Resource paths load correctly
# Check: Shared styles apply
```

**Test on production:**
1. Deploy hub to test subdomain first
2. Verify shared resources load
3. Then deploy minecraft module
4. Test whitelist form and functionality
5. Test old URLs still work (if needed for backcompat)

### Step 6: Clean Up (After Verification)

Once everything works in new structure:

```bash
# Remove old directories (after backup)
rm -rf site/
rm -rf apps/  # Or keep if not moved to modules/mc/

# Update documentation
rm old_docs.md
```

## Path Considerations

### Relative Paths in HTML/CSS

**In hub module:**
```html
<!-- These work from modules/hub/ -->
<script src="../../shared/scripts/partials.js"></script>
<link rel="stylesheet" href="../../shared/styles/base.css" />
```

**In minecraft site:**
```html
<!-- These work from modules/mc/site/ -->
<script src="../../../shared/scripts/partials.js"></script>
<link rel="stylesheet" href="../../../shared/styles/base.css" />
```

### Absolute Paths in Flask Templates

If using Flask, use absolute paths (starting with `/`):

```html
<link rel="stylesheet" href="/shared/styles/base.css" />
<script src="/shared/scripts/partials.js"></script>
```

Then ensure your web server serves `shared/` from root:

```
/public_html/shared/    → http://your-domain.com/shared/
/public_html/modules/   → http://your-domain.com/modules/
```

## Troubleshooting

### Resources (CSS/JS) Not Loading

**Symptoms:** Styled unstyled, scripts not executing

**Solutions:**
1. Check browser DevTools → Network tab
2. Verify correct relative paths for your location
3. Check if symlinks needed: `ls -la shared/`
4. Verify shared/ directory exists in correct location

### Header/Footer Not Loading

**Symptoms:** Empty site-header/site-footer divs

**Solutions:**
1. Check `/shared/scripts/partials.js` is loading
2. Verify path to component files is correct
3. Check browser console for JavaScript errors
4. Verify component files exist: `ls shared/components/`

### Flask App 404s

**Symptoms:** App works but links 404

**Solutions:**
1. Update FLASK_SECRET_KEY and environment variables
2. Verify startup file points to correct location
3. Check cPanel Python app settings
4. Review app.py for hard-coded paths

## Rollback Plan

If issues occur:

1. Keep backup of old `site/` and `apps/` directories
2. Keep DNS pointing to working configuration
3. Revert changes: `cp -r site.backup site/`
4. Restart application in cPanel
5. Fix issues and retry migration

## Timeline

- **Phase 1 (Current):** New structure ready, old structure still active
- **Phase 2:** Test new structure locally and on staging
- **Phase 3:** Deploy modules one at a time (hub first)
- **Phase 4:** Verify all functionality
- **Phase 5:** Remove old directories
