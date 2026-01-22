# Minecraft Module

This module handles the Minecraft server landing page and whitelist management.

## Module Structure

```
modules/mc/
├── site/                          # Static website
│   ├── index.html                 # Main page
│   └── README.md                  # Site documentation
├── apps/                          # Node.js/Express (TypeScript) applications
│   └── minecraft_join_app/        # Whitelist management app
├── README.md                      # Module documentation
└── DEPLOYMENT.md                  # Deployment guide
```

## Deployment

This module has two parts:

1. **Static Site** (`site/`) - Serves from `mc.opperheufd.com`
2. **Node.js/Express App** (`apps/minecraft_join_app/`) - Serves app routes such as `/join` and admin routes

## Moving from Old Structure

The minecraft module is now located at `modules/mc/`. The application at `modules/mc/apps/minecraft_join_app/` contains the TypeScript/Node.js source and should be deployed as a Node.js app for the `mc.opperheufd.com` subdomain.

## Configuration

See `DEPLOYMENT.md` for deployment instructions.
