# Testing & Validation Guide

How to test the new modular architecture before deploying to production.

## Local Testing Setup

### Method 1: Python HTTP Server (Quickest)

```bash
cd /home/yarne/dev/opperheufd_com/opperheufd_com
python3 -m http.server 8000
```

Then visit:
- **Hub:** http://localhost:8000/modules/hub/
- **Minecraft Site:** http://localhost:8000/modules/mc/site/

✅ **Pros:** No setup needed, see live changes immediately
❌ **Cons:** Can't test server-side dynamic features (OAuth/RCON), some features limited

### Method 2: Node.js Development Server (If Testing App)

For testing the TypeScript/Node.js app locally:

```bash
cd /home/yarne/dev/opperheufd_com/opperheufd_com/apps/minecraft_join_app
npm install
npm run dev
```

Visit: http://localhost:5000/ (or the URL output by the dev server)

✅ **Pros:** Full app testing for the Node.js rewrite
❌ **Cons:** Requires Node.js and build step for TypeScript

### Method 3: Docker (Recommended for Full Testing)

Use Docker to run a Node.js container for full testing. Example `docker-compose.yml`:

```yaml
version: '3'
services:
  web:
    image: node:18
    volumes:
      - .:/app
    working_dir: /app/apps/minecraft_join_app
    ports:
      - "5000:5000"
    command: sh -c "npm install && npm run dev"
```

Then:
```bash
docker-compose up
# Visit http://localhost:5000/ for the app (or the port exposed by your dev server)
```

## Test Checklist

### 1. Hub Module Tests ✓

**File:** http://localhost:8000/modules/hub/

```
□ Page loads without errors
□ Header displays with navigation
  □ "Home" link works
  □ "Minecraft Server" link works  
□ Footer displays with copyright
□ "Projects" section visible
□ All project cards render
  □ Minecraft card shows
  □ Placeholder cards visible
□ Minecraft card links to mc.opperheufd.com
□ CSS loads (page styled, not plain HTML)
□ No console JavaScript errors
```

**How to check:**
```javascript
// Open DevTools (F12) → Console
// Should see no errors
// Check Network tab → all resources 200 OK
```

---

### 2. Minecraft Site Tests ✓

**File:** http://localhost:8000/modules/mc/site/

```
□ Page loads without errors
□ Header displays with navigation
□ Footer displays
□ "Minecraft Server" section displays
□ "Join Server" button visible and styled
□ Version number shows (1.21.11)
□ Button links to correct URL
□ CSS loads properly
□ No console errors
```

---

### 3. Shared Resources Tests ✓

**For each module, verify:**

```
□ CSS loads (check Network tab)
  □ base.css → 200 OK
  □ components.css → 200 OK
□ JavaScript loads
  □ partials.js → 200 OK  
  □ cards.js → 200 OK (hub only)
□ Components load
  □ header.html → 200 OK
  □ footer.html → 200 OK
□ JSON loads (hub)
  □ cards.json → 200 OK
```

**How to check:**
```
1. Open DevTools (F12)
2. Network tab
3. Refresh page
4. Look for any 404 errors
5. All files should be 200 OK
```

---

### 4. Styling Tests ✓

**Expected visual appearance:**

```
□ Colors correct
  □ Navigation links dark text
  □ Hover links turn blue
  □ Buttons blue background
□ Spacing consistent
  □ Header has padding
  □ Cards properly spaced
  □ Footer at bottom
□ Responsive layout
  □ On desktop: multi-column cards
  □ On mobile: single-column cards
```

**Test responsiveness:**
- DevTools → Device toggle (F12 → `Ctrl+Shift+M`)
- Test at: 375px, 768px, 1920px widths

---

### 5. Navigation Tests ✓

**From Hub:**
```
□ "Home" link → http://localhost:8000/modules/hub/
□ "Minecraft Server" in header → mc.opperheufd.com
  (currently just link, would work in production)
```

**From Minecraft Site:**
```
□ "Home" link → http://localhost:8000/modules/hub/
□ "Minecraft Server" in header → current page
□ "Join Server" button → https://mc.opperheufd.com/join
```

---

### 6. Component Isolation Tests

**Test that shared components work independently:**

```bash
# Copy shared folder to test different paths
cp -r shared /tmp/shared_test

# Open html directly (should work with adjusted paths)
file:///home/yarne/dev/opperheufd_com/opperheufd_com/modules/hub/index.html
```

**Expected:** Component loads despite different base paths

---

### 7. Cross-Browser Tests

Test in multiple browsers:

```
□ Chrome/Chromium
  □ Resources load
  □ Layout correct
  □ No console errors
□ Firefox
  □ Resources load
  □ Layout correct
  □ No console errors
□ Safari (if available)
□ Edge (if available)
```

---

### 8. Performance Tests

**Check loading time:**

```javascript
// In DevTools Console:
console.log(performance.timing.loadEventEnd - performance.timing.navigationStart)
```

**Expected:** < 1000ms total load time

**Check file sizes:**

```bash
# From project root:
du -sh shared/
du -sh modules/

# Expected:
# shared/ ≈ 10 KB
# modules/hub/ ≈ 2 KB
# modules/mc/site/ ≈ 1 KB
```

---

## Automated Testing Script

Create `test.sh` to run all checks:

```bash
#!/bin/bash

echo "🧪 Opperheufd Modular Architecture Tests"
echo "========================================"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
  echo "❌ Python3 not found"
  exit 1
fi

echo "✓ Python3 found"

# Check file structure
echo ""
echo "📁 Checking file structure..."
files=(
  "shared/components/header.html"
  "shared/components/footer.html"
  "shared/styles/base.css"
  "shared/styles/components.css"
  "shared/scripts/partials.js"
  "shared/scripts/cards.js"
  "modules/hub/index.html"
  "modules/hub/cards.json"
  "modules/mc/site/index.html"
)

all_good=true
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ $file MISSING"
    all_good=false
  fi
done

if [ "$all_good" = false ]; then
  echo "❌ Some files are missing"
  exit 1
fi

echo ""
echo "✅ All tests passed!"
echo ""
echo "📝 To test locally, run:"
echo "   python3 -m http.server 8000"
echo ""
echo "Then visit:"
echo "   http://localhost:8000/modules/hub/"
echo "   http://localhost:8000/modules/mc/site/"
```

Save as `test.sh` and run:

```bash
chmod +x test.sh
./test.sh
```

---

## Validation Checklist Before Deployment

Use this before deploying to production:

```
FUNCTIONALITY
□ All pages load without errors
□ Navigation works between hub and modules
□ Shared components display correctly
□ Styling applied consistently

RESOURCES
□ All HTML files present
□ All CSS files present
□ All JavaScript files present
□ All JSON files present

PERFORMANCE
□ Page load time < 2 seconds
□ Shared CSS cached properly
□ No duplicate resources

CROSS-BROWSER
□ Chrome/Chromium works
□ Firefox works
□ Edge works (if testing)

MOBILE
□ Responsive layout works
□ Touch elements sized correctly
□ No horizontal scroll

ACCESSIBILITY
□ Keyboard navigation works
□ Links understandable
□ Color contrast acceptable
□ Text readable at 200% zoom

DOCUMENTATION
□ README.md updated
□ ARCHITECTURE.md complete
□ Module docs exist
□ Deployment guide ready
```

---

## Debugging Common Issues

### Issue: CSS Not Loading

**Symptoms:** Page looks unstyled (plain text)

**Solutions:**
```bash
# Check file exists
ls -la shared/styles/base.css

# Check path in HTML
grep "href=" modules/hub/index.html | head -1

# Verify relative paths correct
cd modules/hub && ls ../../shared/styles/base.css
```

### Issue: Header/Footer Not Showing

**Symptoms:** Empty header/footer divs

**Solutions:**
```javascript
// In DevTools Console
fetch('../../shared/components/header.html').then(r => r.text()).then(console.log)
// Should show HTML content
```

### Issue: Cards Not Rendering

**Symptoms:** Empty cards section

**Solutions:**
```javascript
// In DevTools Console
fetch('cards.json').then(r => r.json()).then(console.log)
// Should show cards data
```

### Issue: 404 on Shared Resources

**Symptoms:** Network tab shows 404 for shared files

**Solutions:**
1. Verify path structure: `ls shared/`
2. Check relative paths in HTML files
3. Try absolute path if using Flask: `/shared/...`

---

## Performance Benchmarks

Target metrics:

| Metric | Target | Status |
|--------|--------|--------|
| Hub page load time | < 1s | ✓ |
| Minecraft site load time | < 1s | ✓ |
| Shared CSS size | < 10 KB | ✓ |
| Shared JS size | < 5 KB | ✓ |
| Network requests | < 10 | ✓ |
| Time to interactive | < 2s | ✓ |

---

## Sign-Off Checklist

Before declaring modular architecture ready:

- [ ] All test checkboxes completed
- [ ] No console errors in any browser
- [ ] All resource files load successfully
- [ ] Performance meets benchmarks
- [ ] Documentation complete and accurate
- [ ] Test script passes
- [ ] Cross-browser testing done
- [ ] Mobile responsiveness verified
- [ ] Shared components working as intended
- [ ] Module independence confirmed

**When complete:** Ready for deployment to cPanel!

---

## Next: See MIGRATION.md for Deployment Steps
