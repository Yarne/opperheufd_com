# AI Coding Agent Instructions

## Project Overview

**Opperheufd** is a multi-component web presence consisting of:

1. **Static Site** (`site/`) - HTML/CSS landing page with dynamic card-based navigation
2. **Minecraft Join App** (`apps/minecraft_join_app/`) - Flask web app handling Discord OAuth + Minecraft whitelist via RCON

The codebase uses a flat two-tier structure: shared website frontend + specialized apps.

## Architecture Patterns

### Flask App Structure (`apps/minecraft_join_app/`)

**Data Persistence**: JSON files (not database)
- `subscriptions.json` - Core data: Minecraft names mapped to subscription states, payment dates, end dates, active status
- `admin_log.json` - Audit trail: login attempts, subscription changes, RCON operations with IP + timestamp

**Critical Pattern**: Use atomic writes via temporary files:
```python
tmp_path = f"{SUBSCRIPTIONS_PATH}.tmp"
with open(tmp_path, "w") as handle:
    json.dump(data, handle, indent=2, sort_keys=True)
os.replace(tmp_path, SUBSCRIPTIONS_PATH)
```
This prevents corruption on crashes. Always follow this pattern for subscriptions/logs.

### Authentication & Authorization Flow

1. **OAuth**: User → `/join` → Discord → `/oauth/callback` → Guild membership verified via bot token
2. **Session**: Stores `verified` (bool) after guild check, `admin` (bool) after password authentication
3. **Restrictions**: Whitelist form requires `session["verified"]`; admin routes require `session["admin"]`

### Subscription Lifecycle

- **Pending**: User requests whitelist → entry marked `pending=True`, `active=False`. Admin must explicitly activate.
- **Active**: Admin activates in `/admin` → sets `active=True`, `pending=False`, `end_date` calculated as `payment_date + duration_days`. Only then can RCON be triggered.
- **RCON Trigger**: When whitelist form submitted AND entry is `active` AND entry is NOT `pending`, execute `whitelist add <mc_name>` via RCON. This happens inline in the POST handler; if RCON fails (host down, auth error), exception bubbles up to Flask error handler.
- **Auto-Expire**: `load_subscriptions()` runs on every load, checks if `active=True` AND `end_date < today` (UTC comparison). Auto-flips to `active=False` and logs "auto-expire" action.
- **Reactivation**: If user re-requests after expiry, `pending=True` flag is set again (awaits admin re-activation).

## Deployment Context

**Production**: cPanel + Rocky OS VPS
- Startup file: `passenger_wsgi.py` (WSGI entry point)
- Python app created in cPanel with venv
- Environment variables configured in cPanel or `.env` file

**Required Env Vars** (see `DEPLOYMENT.md`):
- `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`, `DISCORD_GUILD_ID`, `DISCORD_BOT_TOKEN`
- `RCON_HOST`, `RCON_PORT` (default 25575), `RCON_PASSWORD`
- `ADMIN_PASSWORD`, `FLASK_SECRET_KEY`

### Step-by-Step Deployment (cPanel + Rocky OS)

1. **DNS & HTTPS Setup**
   - Point subdomain (e.g., `app.mc.opperheufd.com`) to VPS IP
   - Enable HTTPS via cPanel AutoSSL

2. **Create Python App in cPanel**
   - Go to "Python" in cPanel
   - Click "Create Application"
   - Set application root to `minecraft_join_app/` directory
   - Set startup file to `passenger_wsgi.py`
   - Note: cPanel creates venv automatically

3. **Install Dependencies**
   - SSH into VPS or use cPanel terminal
   - Navigate to `minecraft_join_app/`
   - Run: `pip install -r requirements.txt`

4. **Configure Environment Variables**
   - Option A (cPanel): Click app → "Environment Variables" → add each variable
   - Option B (file): Create `.env` in `minecraft_join_app/` with key=value pairs (cPanel will read it)
   - Verify `DISCORD_BOT_TOKEN`, `RCON_PASSWORD`, `ADMIN_PASSWORD` are set

5. **Discord Bot Setup**
   - In Discord Developer Portal, set OAuth redirect URI to `https://your-domain.com/oauth/callback`
   - Invite bot to server with "Read Members" permission
   - Verify bot token works (test with `curl` if needed)

6. **Test RCON Connection**
   - From VPS terminal: `python3 -c "from mctools import RCONClient; c = RCONClient(os.getenv('RCON_HOST'), port=int(os.getenv('RCON_PORT', 25575))); c.login(os.getenv('RCON_PASSWORD')); print(c.command('help'))"`
   - If connection fails, check firewall/port settings on Minecraft server

7. **Restart Application**
   - cPanel auto-restarts on code changes
   - Manual restart: cPanel → Python app → "Restart"
   - Check error logs: `tail -f $HOME/logs/error_log`

## Code Patterns & Conventions

### Logging
Use the configured logger: `logger.info()`, `logger.warning()` (matches app.py pattern). Logs help diagnose OAuth/RCON issues.

### Input Validation
Minecraft names: `^[A-Za-z0-9_]{3,16}$` (stored in `MC_NAME_RE`). Payment dates: `YYYY-MM-DD` format parsed via `parse_payment_date()`.

### Timestamps
Always use `datetime.utcnow()` (not local time) with ISO format: `isoformat(timespec="seconds")`. Enables consistent audit logs and date comparisons.

### Date Handling
End dates stored as `YYYY-MM-DD` strings. Comparisons use `.date()` objects, not strings. See `load_subscriptions()` for expiry logic.

### Admin Log Entries
Always include: `action`, `details` (dict), `ip` (`request.remote_addr`), `timestamp`. Example:
```python
append_admin_log("subscription-saved", {"mc_name": mc_name, "active": active, ...})
```

### Discord API Error Handling

The `/oauth/callback` route handles three error states:
- **Bot token missing**: Returns error message template (configuration error)
- **User ID unavailable**: Returns error message template (Discord API error)
- **Guild check fails** (status != 200 and != 404): Returns error + logs warning (network/permission issue). User should retry later.
- **User not in guild** (status 404): Logs info, returns access denied. User must join Discord server first.

Always verify `DISCORD_BOT_TOKEN` is set before checking guild membership; the bot must have guild members intent enabled.

## Error Handling & Monitoring

### Logging Pattern
Use `logger.info()` for successful operations (OAuth complete, subscription saved), `logger.warning()` for non-fatal issues (bot token check fails). Logs appear in cPanel error log or console in dev.

### RCON Failure Handling
If `RCONClient` connection fails (host unreachable, auth error), exception is NOT caught in `whitelist_submit()`. The Flask error handler will return 500. Consider wrapping in try/except to return user-friendly message.

### Admin Log as Audit Trail
Every login attempt (success/fail), subscription change, deletion is logged. Review `admin_log.json` to debug unexpected state (e.g., who activated a subscription at what time from what IP).

### Data Integrity
Subscriptions and logs use atomic temp-file writes. If process crashes during write, original file remains intact. **Do not** edit JSON files directly in production; always use app routes to ensure consistency.

## Common Tasks

- **Add Feature**: Modify `app.py` route, update admin log in action, test via Flask dev server
- **Fix Subscription Bug**: Check `load_subscriptions()` expiry logic + date parsing in `parse_payment_date()`
- **Debug RCON**: Verify `RCON_HOST`/port reachable; check logs for connection errors; test locally with `python -m mctools`
- **Template Changes**: Edit `.html` in `templates/`; rendered with `render_template()` + Jinja2

## Testing Locally

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Fill Discord/RCON credentials
python app.py
```

Navigate: `http://localhost:5000/join` (Discord OAuth flow) → `/whitelist` → `/admin` (password protected).

## Static Site (`site/`)

Simple ES6 architecture with client-side templating:
- **Dynamic Partials**: `index.html` async-fetches `header.txt` + `footer.txt` at load time, injects into `#site-header` / `#site-footer`. Enables site-wide header/footer updates without rebuilding.
- **Card System**: Loads `cards.json` (array of `{title, description, href}` objects), clones `#card-template`, populates via `buildCard()` helper, renders to `#cards` container. Extensible: add card to JSON, no HTML changes needed.
- **Styling**: `styles.css` - no framework, minimal (~150 lines). Direct inline styles in templates where needed (e.g., forms in `whitelist.html`).
- **No Build Step**: All files served directly. Card definitions are JSON; templates are Jinja2 (Flask) or plain HTML.

**Adding a New Page**: Create `.html` file in `site/`, link from `cards.json` with `href`, or create new route in Flask app. Static HTML pages load header/footer dynamically via same `loadPartial()` pattern.

## Key Files & Responsibilities

| File | Purpose |
|------|---------|
| [apps/minecraft_join_app/app.py](apps/minecraft_join_app/app.py) | All Flask routes, OAuth, RCON, subscriptions logic |
| [apps/minecraft_join_app/subscriptions.json](apps/minecraft_join_app/subscriptions.json) | Persistent subscription data |
| [apps/minecraft_join_app/admin_log.json](apps/minecraft_join_app/admin_log.json) | Audit trail |
| [apps/minecraft_join_app/passenger_wsgi.py](apps/minecraft_join_app/passenger_wsgi.py) | WSGI entry point for cPanel |
| [site/index.html](site/index.html) | Main landing page; loads partials + cards |
| [site/cards.json](site/cards.json) | Card definitions (title, description, href) |
