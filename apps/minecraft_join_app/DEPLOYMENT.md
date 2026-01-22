# Deployment Checklist (cPanel + Node.js)

This is a Node.js / Express rewrite of the original Python Flask app. It's compatible with cPanel's Node.js application support.

## Prerequisites

- cPanel with Node.js support (most modern cPanel installations include this)
- A working Minecraft server with RCON enabled
- Discord application (bot + OAuth) configured
- Domain with HTTPS enabled (cPanel AutoSSL)

## Step-by-Step Deployment

### 1. DNS + HTTPS

- Ensure `app.mc.opperheufd.com` (or your subdomain) points to the VPS IP
- Enable HTTPS via cPanel AutoSSL or manually
- Verify SSL certificate is valid

### 2. Discord Application Setup

- Go to [Discord Developer Portal](https://discord.com/developers/applications)
- Create an application or use existing one
- Set OAuth2 → Redirects to: `https://app.mc.opperheufd.com/oauth/callback`
- Create a bot under the application
- Copy bot token (save securely)
- Invite bot to your server with `read:guild_members` intent enabled
- Copy Guild ID from your Discord server (Developer Mode → Copy Server ID)
- Copy Client ID and Client Secret

### 3. Create Node.js Application in cPanel

1. Log in to cPanel
2. Navigate to **Setup Node.js App**
3. Click **Create Application**
4. Configure as follows:
   - **Node.js version**: 18.x or higher
   - **Application root**: `/home/username/public_html/minecraft-app` (or your chosen path)
   - **Application startup file**: `app.js`
   - **Application URL**: Choose your subdomain (e.g., `app.mc.opperheufd.com`)
5. Click **Create**
6. cPanel will create the directory structure and virtual environment

### 4. Deploy Application Code

Using SSH or cPanel file manager, upload the application:

```bash
cd /home/username/public_html/minecraft-app/
# Copy all files from the minecraft_join_app directory except node_modules
```

Or via Git (if cPanel has Git support):

```bash
cd /home/username/public_html/minecraft-app/
git clone <your-repo> .
rm -rf node_modules dist
```

### 5. Install Dependencies

In cPanel, click your application → **Run NPM Install**

Alternatively, via SSH:

```bash
cd /home/username/public_html/minecraft-app/
npm install
npm run build
```

### 6. Configure Environment Variables

1. In cPanel, click your Node.js application
2. Click **Environment Variables**
3. Add each variable (see `.env.example` for the list):
   - `NODE_ENV=production`
   - `SESSION_SECRET=<your-secret-key>`
   - `DISCORD_CLIENT_ID=<from-step-2>`
   - `DISCORD_CLIENT_SECRET=<from-step-2>`
   - `DISCORD_REDIRECT_URI=https://app.mc.opperheufd.com/oauth/callback`
   - `DISCORD_GUILD_ID=<from-step-2>`
   - `DISCORD_BOT_TOKEN=<from-step-2>`
   - `RCON_HOST=<your-minecraft-server-ip>`
   - `RCON_PORT=25575` (or your RCON port)
   - `RCON_PASSWORD=<your-rcon-password>`
   - `ADMIN_PASSWORD=<choose-a-strong-password>`
4. Save and restart application

**Alternative**: If cPanel UI doesn't work, create a `.env` file in the application root with these variables.

### 7. Install RCON Tools (for mcrcon support)

For RCON to work, the `mcrcon` binary must be available on the server.

Via SSH (if you have server access):

```bash
# Download mcrcon
wget https://github.com/Tiiffi/mcrcon/releases/download/v0.0.13/mcrcon-0.0.13-linux-x86-64.tar.gz
tar xf mcrcon-0.0.13-linux-x86-64.tar.gz
cp mcrcon /usr/local/bin/
chmod +x /usr/local/bin/mcrcon
```

If you cannot install `mcrcon`, alternative RCON packages (npm) can be used by modifying [src/services/rconService.ts](src/services/rconService.ts).

### 8. Restart Application

1. In cPanel, go to Setup Node.js App
2. Click your application
3. Click **Restart**
4. Wait for green status indicator

Check application logs via cPanel for any startup errors.

### 9. Test the Application

1. Visit: `https://app.mc.opperheufd.com/join`
2. Complete Discord OAuth flow
3. Enter a test Minecraft name
4. Verify success page appears
5. Log in to admin panel at `/admin` with password set in step 6
6. Test admin functionality: create/edit/delete subscriptions

## Troubleshooting

### Application won't start

- Check Node.js version (must be 18+)
- Check logs in cPanel application page
- Verify all environment variables are set
- Run `npm install` and `npm run build` manually

### Discord OAuth fails

- Verify `DISCORD_REDIRECT_URI` matches cPanel application URL
- Check bot token is valid and has guilds intent enabled
- Verify guild ID is correct
- Check Discord API status at [discord.com/status](https://discord.com/status)

### Whitelist command fails

- Verify RCON is enabled on Minecraft server
- Test RCON connectivity: `mcrcon -H <host> -P <port> -p "<password>" help`
- Check RCON password is correct
- Verify firewall allows connection on RCON port
- Check Minecraft server logs for RCON errors

### Session/login issues

 - Verify `SESSION_SECRET` is set to a long random string
- Check browser cookies are enabled
- Clear browser cache and cookies, retry login

## Database/Data Files

Subscriptions and admin logs are stored as JSON files:

- `subscriptions.json` - Minecraft names, subscription dates, status
- `admin_log.json` - Audit trail of all actions

These are created automatically on first run. Ensure write permissions are correct.

To back up:

```bash
cp subscriptions.json subscriptions.json.bak
cp admin_log.json admin_log.json.bak
```

## Updating the Application

1. Pull latest code via Git or upload files
2. Run `npm install` (if dependencies changed)
3. Run `npm run build`
4. Restart application in cPanel

## Additional Notes

- The application runs on port 5000 by default; cPanel's Passenger will proxy requests
- Session data is stored in memory; if app restarts, users must re-authenticate
- HTTPS is required for Discord OAuth (HTTP will fail in production)
- Admin log retention: all entries are kept indefinitely; consider archiving old logs periodically

For support or issues, refer to the original Flask app [DEPLOYMENT.md](./DEPLOYMENT.md) for conceptual details.
