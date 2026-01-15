# Minecraft Join App (Flask)

This app handles Discord login and whitelisting via RCON.

## Local setup

1. `python3 -m venv venv`
2. `source venv/bin/activate`
3. `pip install -r requirements.txt`
4. `cp .env.example .env` and fill values
5. `python app.py`

## cPanel setup (Rocky OS)

1. Create a Python app in cPanel.
2. Set the application root to the `join_app` folder.
3. Set the application startup file to `passenger_wsgi.py`.
4. Create a virtual environment in cPanel and install dependencies:
   - `pip install -r requirements.txt`
5. Add environment variables in cPanel (or upload a `.env` file).

## Discord OAuth notes

- Use the redirect URI you set in the Discord developer portal.
- The user must be in your Discord server (guild) to continue.
- Optional: set `DISCORD_BOT_TOKEN` to verify guild membership via the bot API.

## RCON notes

- `RCON_HOST` should be reachable from the VPS.
- Ensure the RCON port is open on the Minecraft server.
