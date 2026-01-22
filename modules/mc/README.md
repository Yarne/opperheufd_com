# Minecraft Module

This module handles the Minecraft server landing page and whitelist management.

## Module Structure

```
modules/mc/
├── site/                          # Static website
│   ├── index.html                 # Main page
│   └── README.md                  # Site documentation
├── apps/                          # Flask applications
│   └── minecraft_join_app/        # Whitelist management app
├── README.md                      # Module documentation
└── DEPLOYMENT.md                  # Deployment guide
```

## Deployment

This module has two parts:

1. **Static Site** (`site/`) - Serves from `mc.opperheufd.com`
2. **Flask App** (`apps/minecraft_join_app/`) - Serves from `mc.opperheufd.com/join` and related routes

## Moving from Old Structure

The minecraft module is now located at `modules/mc/`. The Flask app at `modules/mc/apps/minecraft_join_app/` should be deployed as the Python app for the `mc.opperheufd.com` subdomain.

## Configuration

See `DEPLOYMENT.md` for deployment instructions.
