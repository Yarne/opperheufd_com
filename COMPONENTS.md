# Component Reusability Analysis

This document identifies components, utilities, and patterns that are or could be reused across modules.

## Current Reusable Components

### ✅ Already Shared

#### HTML Components
- **Header** - Used by all modules
  - Path: `shared/components/header.html`
  - Status: ✅ Shared
  - Can be customized per module via template variables in future

- **Footer** - Used by all modules
  - Path: `shared/components/footer.html`
  - Status: ✅ Shared
  - Shows copyright, could add social links, links to hub

#### CSS Components
- **Typography & Layout** (`shared/styles/base.css`)
  - ✅ CSS custom properties (colors, spacing, transitions)
  - ✅ Base element styles
  - ✅ Grid/flexbox utilities
  - Reused by all modules

- **UI Components** (`shared/styles/components.css`)
  - ✅ `.card` system - card grid, individual cards
  - ✅ `.btn` - button styling
  - ✅ `.server-card` - large info card
  - ✅ Form elements (input, textarea, select, label, button)
  - ✅ Message states (.error, .success)

#### JavaScript Utilities
- **Partials Loader** (`shared/scripts/partials.js`)
  - ✅ `loadPartial()` - Load and inject HTML
  - ✅ `loadJSON()` - Load and parse JSON
  - Reused by all modules

- **Card System** (`shared/scripts/cards.js`)
  - ✅ `buildCard()` - Create card from template
  - ✅ `renderCards()` - Render card array
  - ✅ `loadAndRenderCards()` - Load JSON and render
  - Currently used by hub, could be used by minecraft for server cards/stats

## Components Ready for Extraction

### 🟡 Good Candidates for Shared Library

#### Form Validation
**Current State:** Inline in server templates (EJS/HTML)
**Usage:** Minecraft whitelist form + future forms
**Recommendation:** Extract to `shared/scripts/validation.js`

```javascript
// Proposed functions
validateMinecraftName(name) // ✓ exists in app.py regex
validateEmail(email)
validateDate(date)
formatValidationError(errors)
```

**Impact:** Would benefit minecraft app and any future modules with forms

---

#### Message/Notification System
**Current State:** Inline `.error` and `.success` classes
**Usage:** Application shows errors/success messages
**Recommendation:** Create `shared/scripts/notify.js` with toast/alert system

```javascript
// Proposed functions
showNotification(message, type, duration)
showError(message)
showSuccess(message)
```

**Benefits:**
- Consistent notification styling across modules
- Can add animations
- Future modules get notification UX for free

---

#### Date/Time Utilities
**Current State:** In app.py (parse_payment_date, UTC handling)
**Usage:** Minecraft subscription dates + any time-based features
**Recommendation:** Extract to `shared/scripts/date-utils.js`

```javascript
// Proposed functions
formatDate(date, format)           // ISO string to readable
parseDate(dateStr, format)         // String to Date object
calculateDaysRemaining(endDate)
getUTCDate()
```

**Benefits:**
- Consistent date formatting across all modules
- Centralized timezone handling (UTC vs local)

---

#### Authentication Helpers
**Current State:** In the application (OAuth flow, session checks)
**Usage:** Minecraft Discord OAuth + any future authenticated features
**Recommendation:** Create `shared/scripts/auth.js` and `shared/scripts/auth-helpers.py` (Python)

**JavaScript:**
```javascript
// Check if user is authenticated
isAuthenticated()
// Redirect to login
redirectToLogin()
// Get auth token from storage
getAuthToken()
```

**Python:**
```python
# Shared OAuth helpers
verify_discord_token(token)
check_guild_membership(user_id, guild_id)
```

**Benefits:**
- Consistent auth flow across modules
- Easier to add new OAuth providers
- Future modules don't reinvent OAuth

---

#### API Response Formatting
**Current State:** In the application (JSON responses)
**Usage:** Any module with API endpoints
**Recommendation:** Create `shared/scripts/api-response.py` (Python shared utilities)

```python
# Standardized responses
success_response(data, message)
error_response(error_type, message, status_code)
validate_request(data, schema)
```

**Benefits:**
- Consistent API contracts across modules
- Easier error handling on frontend
- Validation reuse

---

## Components Unique to Modules (Not Worth Sharing Yet)

### 🔵 Module-Specific (Single Use)

#### Minecraft-Specific
- RCON client wrapper - Only used by minecraft app
- Subscription state machine - Only minecraft needs this
- Whitelist form UI - Specific to whitelist feature
- Admin panel - Specific to minecraft admin

**Reason:** Too specialized for a single feature. Extract only if adding another minecraft server or similar service.

---

## Future Component Ideas

### 💡 Pre-Emptive Reusable Components

#### Stats/Dashboard Display
If multiple modules need stats cards:

```html
<div class="stats-container">
  <div class="stat-card">
    <div class="stat-value">42</div>
    <div class="stat-label">Players Online</div>
  </div>
</div>
```

#### Modal/Dialog System
For any module needing confirmation dialogs, modals:

```javascript
showModal(title, content, buttons)
showConfirm(message, onConfirm)
```

#### Table/List Components
For displaying data (admin panels, stats, etc.):

```html
<div class="table-container">
  <table><!-- data --></table>
</div>
```

CSS already supports this, just need JS helpers for sorting/filtering.

#### Breadcrumb Navigation
For modules with multiple pages:

```javascript
setBreadcrumbs([
  {label: 'Hub', url: 'https://opperheufd.com'},
  {label: 'Minecraft', url: 'https://mc.opperheufd.com'},
  {label: 'Admin', url: '#'}
])
```

#### Theming System
If wanting consistent dark mode/light mode:

```javascript
setTheme('light' | 'dark')
// Uses CSS variables already set up
```

---

## Implementation Priority

### High Priority (Extract First)
1. **Form Validation** - Reusable across minecraft + future modules
2. **Date Utilities** - Needed for subscription system
3. **Notification System** - Improves UX consistency

### Medium Priority (Extract When Adding Second Module)
1. **Authentication Helpers** - Needed when adding Discord OAuth to another module
2. **API Response Formatting** - Standardizes any API layer

### Low Priority (Nice to Have)
1. **Modal System** - Extract when modules need it
2. **Theming System** - Extract when aesthetic customization needed
3. **Table Components** - Extract when displaying structured data

---

## Extraction Checklist

For each component to extract:

- [ ] Identify all current usages in codebase
- [ ] Create shared file with generic utilities
- [ ] Update all usages to import from shared
- [ ] Add documentation to `shared/README.md`
- [ ] Test in each module it's used
- [ ] Update `ARCHITECTURE.md` with new shared resource

---

## Example: Extracting Form Validation

### Step 1: Create Shared Utility

**File:** `shared/scripts/validation.js`
```javascript
const MC_NAME_RE = /^[A-Za-z0-9_]{3,16}$/;

function validateMinecraftName(name) {
  if (!name) return 'Minecraft name is required';
  if (!MC_NAME_RE.test(name)) {
    return 'Invalid name: 3-16 characters, letters/numbers/_';
  }
  return null; // Valid
}

function formatValidationError(errors) {
  // errors = {field: 'message'}
  return Object.values(errors).join(', ');
}
```

### Step 2: Use in Module

**File:** `modules/mc/apps/minecraft_join_app/templates/whitelist.html`
```html
<script src="/shared/scripts/validation.js"></script>
<script>
  function handleSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('mc_name').value;
    const error = validateMinecraftName(name);
    if (error) {
      // Show error
      return false;
    }
    // Form valid, submit
  }
</script>
```

### Step 3: Use in Future Module

Any new module can import:
```html
<script src="/shared/scripts/validation.js"></script>
<!-- Use validateMinecraftName() or other functions -->
```

---

## Recommended Extractions to Start With

Given the current codebase, I recommend starting with:

1. **Form Validation** (`shared/scripts/validation.js`)
   - Extract `MC_NAME_RE` from app.py
   - Create validation functions for common fields
  - Import in server templates or in browser

2. **Message/Notification System** (`shared/scripts/notify.js`)
   - Enhance `.error` and `.success` styling
   - Add toast notifications for better UX
   - Use in minecraft app and future modules

3. **Documentation**
   - Update `shared/README.md` with new utilities
   - Show usage examples for each module

This provides immediate reusability + sets pattern for future extractions.
