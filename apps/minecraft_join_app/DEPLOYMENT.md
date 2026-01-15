# Deployment Checklist (cPanel + VPS)

## DNS + HTTPS

- `app.mc.opperheufd.com` points to the VPS IP
- HTTPS enabled (AutoSSL in cPanel)

## Discord App

- Redirect URI set to `https://app.mc.opperheufd.com/oauth/callback`
- Bot is added to the Discord server
- Bot has permission to read members (Guild Members intent if required)

## cPanel Python App

- Application root: `minecraft_join_app`
- Startup file: `passenger_wsgi.py`
- Entry point: `application`
- Virtual environment created
- Dependencies installed: `pip install -r requirements.txt`

## Environment Variables

Set these in cPanel (or `.env` if allowed):

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI`
- `DISCORD_GUILD_ID`
- `DISCORD_BOT_TOKEN`
- `RCON_HOST`
- `RCON_PORT`
- `RCON_PASSWORD`
- `FLASK_SECRET_KEY`

## RCON

- RCON enabled on the Minecraft server
- RCON port open to the VPS
- Credentials verified

## Smoke Test

- Visit `https://app.mc.opperheufd.com/join`
- Login with Discord
- Enter a valid Minecraft name
- Verify whitelist success page
