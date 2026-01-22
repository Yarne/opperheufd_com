# Shared Components & Utilities

This directory contains reusable components, styles, and scripts shared across all modules.

## Directory Structure

```
shared/
├── components/      # HTML components (header, footer, etc.)
├── styles/         # Shared CSS files
├── scripts/        # Shared JavaScript utilities
└── README.md       # This file
```

## Components

### Header (`components/header.html`)
Main site header with navigation. Use across all modules.

```html
<script>
  loadPartial("site-header", "../../shared/components/header.html");
</script>
```

### Footer (`components/footer.html`)
Footer with copyright. Use across all modules.

```html
<script>
  loadPartial("site-footer", "../../shared/components/footer.html");
</script>
```

## Styles

### Base Styles (`styles/base.css`)
- CSS custom properties (colors, spacing, transitions)
- Element resets and defaults
- Header, footer, and main layout

### Component Styles (`styles/components.css`)
- `.cards` - Card grid layout
- `.card` - Individual card styling
- `.server-card` - Large info card
- `.btn` - Button styling
- Form elements (label, input, textarea, button)
- Message states (.error, .success)

## Scripts

### Partials (`scripts/partials.js`)
**Functions:**
- `loadPartial(targetId, path)` - Load HTML file and inject into element
- `loadJSON(path)` - Load and parse JSON file

### Cards (`scripts/cards.js`)
**Functions:**
- `buildCard(item, template)` - Create card element from data
- `renderCards(items, containerId, templateId)` - Render array of cards
- `loadAndRenderCards(path, containerId, templateId)` - Load JSON and render cards

**Card Data Format:**
```json
[
  {
    "title": "Card Title",
    "description": "Card description text",
    "href": "https://example.com"
  }
]
```

## Using Shared Components

### In a Module Page

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>My Module</title>
    <!-- Shared styles -->
    <link rel="stylesheet" href="../../shared/styles/base.css" />
    <link rel="stylesheet" href="../../shared/styles/components.css" />
  </head>
  <body>
    <div id="site-header"></div>
    <main>
      <!-- Your content -->
    </main>
    <div id="site-footer"></div>
    
    <!-- Shared scripts -->
    <script src="../../shared/scripts/partials.js"></script>
    <script>
      loadPartial("site-header", "../../shared/components/header.html");
      loadPartial("site-footer", "../../shared/components/footer.html");
    </script>
  </body>
</html>
```

## Guidelines

1. **Keep components generic** - Avoid module-specific styles in shared components
2. **Use CSS custom properties** - Define colors, spacing in `base.css`
3. **Document new utilities** - Add functions to this README
4. **Test across modules** - Changes here affect all modules
5. **Version CSS carefully** - Major changes should be discussed first

## Future Enhancements

- Create component library with pre-built UI modules
- Add shared form validation utilities
- Create theme system with multiple color schemes
- Add accessibility features (ARIA labels, keyboard navigation)
