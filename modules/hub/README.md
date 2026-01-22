# Opperheufd Hub

Main landing page (opperheufd.com) that serves as a hub to all projects and modules.

## Files

- `index.html` - Main hub page with project cards
- `cards.json` - Project cards data

## Adding a New Project Card

Edit `cards.json` and add a new object to the array:

```json
{
  "title": "Project Name",
  "href": "https://subdomain.opperheufd.com",
  "description": "Project description"
}
```

The card will automatically render on the page.

## Deployment

Point `opperheufd.com` to serve files from `modules/hub/`.

## Structure

```
modules/hub/
├── index.html       # Main hub page
├── cards.json       # Project definitions
└── README.md        # This file
```
