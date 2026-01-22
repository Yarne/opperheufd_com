# Minecraft Join App

**TypeScript/Express.js Edition**: Now running on Node.js for better cPanel compatibility.

## Quick Links

- **Getting Started**: [QUICKSTART.md](./QUICKSTART.md) - Get running in 5 minutes
- **cPanel Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md) - Production setup
- **Migration Guide**: [MIGRATION.md](./MIGRATION.md) - Details about the Flask → Node.js rewrite

## What This App Does

- 🔐 Discord OAuth authentication
- ✅ Minecraft whitelist via RCON
- 📊 Subscription management (JSON-based)
- 🛡️ Admin panel with audit logging
- ⚡ Auto-expiring subscriptions

## Get Started

### Local Development

```bash
npm install
npm run build
cp .env.example .env
# Edit .env with your Discord/RCON credentials
npm run dev
```

Visit `http://localhost:5000/join`

### Production (cPanel)

1. Create Node.js app in cPanel (v18+)
2. Set startup file to `app.js`
3. Install dependencies: `npm install`
4. Build: `npm run build`
5. Set environment variables in cPanel
6. Restart application

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## Why TypeScript?

Your provider doesn't support Python apps. TypeScript/Node.js:
- Runs on any cPanel with Node.js support (more common than Python)
- Uses same data files (no migration needed)
- Maintains 100% feature compatibility
- Better concurrent request handling

## File Structure

```
src/          - TypeScript source
templates/    - EJS HTML templates
dist/         - Compiled JavaScript (generated)
package.json  - Dependencies
tsconfig.json - TypeScript config
```

## Key Files

- [src/app.ts](./src/app.ts) - Main Express application
- [src/services/](./src/services/) - Business logic (OAuth, RCON, subscriptions)
- [templates/](./templates/) - HTML templates (EJS)
- [.env.example](./.env.example) - Environment variables template

## Documentation by Topic

| Topic | Link |
|-------|------|
| Quick setup | [QUICKSTART.md](./QUICKSTART.md) |
| cPanel deployment | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| Rewrite details | [MIGRATION.md](./MIGRATION.md) |

## Support

- **Deployment help**: See [DEPLOYMENT_NODEJS.md](./DEPLOYMENT_NODEJS.md)
- **Feature questions**: See [README_TYPESCRIPT.md](./README_TYPESCRIPT.md)
- **cPanel issues**: Contact your hosting provider for Node.js support
- **Discord/RCON**: Verify credentials and connectivity

## Data Files

Both Flask and Node.js versions use the same JSON format:

- `subscriptions.json` - User subscriptions and status
- `admin_log.json` - Audit trail of all actions

No conversion needed when upgrading. Old data works as-is.

---

**Made with ❤️ for Minecraft server management**

