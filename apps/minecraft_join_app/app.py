import json
import logging
import os
import re
from datetime import datetime, timedelta

import requests

from dotenv import load_dotenv
from flask import Flask, redirect, render_template, request, session, url_for
from authlib.integrations.flask_client import OAuth
from mctools import RCONClient

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("join_app")

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "change-me")

oauth = OAuth(app)
discord = oauth.register(
    name="discord",
    client_id=os.getenv("DISCORD_CLIENT_ID"),
    client_secret=os.getenv("DISCORD_CLIENT_SECRET"),
    access_token_url="https://discord.com/api/oauth2/token",
    authorize_url="https://discord.com/api/oauth2/authorize",
    api_base_url="https://discord.com/api/",
    client_kwargs={"scope": "identify guilds"},
)

MC_NAME_RE = re.compile(r"^[A-Za-z0-9_]{3,16}$")
SUBSCRIPTIONS_PATH = os.path.join(os.path.dirname(__file__), "subscriptions.json")
ADMIN_LOG_PATH = os.path.join(os.path.dirname(__file__), "admin_log.json")


def load_subscriptions():
    if not os.path.exists(SUBSCRIPTIONS_PATH):
        return []
    with open(SUBSCRIPTIONS_PATH, "r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, list):
        return []

    today = datetime.utcnow().date()
    changed = False
    expired_count = 0
    for entry in data:
        end_date_raw = entry.get("end_date")
        if not end_date_raw:
            continue
        try:
            end_date = datetime.strptime(end_date_raw, "%Y-%m-%d").date()
        except ValueError:
            continue
        if entry.get("active") and end_date < today:
            entry["active"] = False
            entry["updated_at"] = datetime.utcnow().isoformat(timespec="seconds")
            changed = True
            expired_count += 1
    if changed:
        save_subscriptions(data)
        append_admin_log("auto-expire", {"expired_count": expired_count})
    return data


def save_subscriptions(subscriptions):
    tmp_path = f"{SUBSCRIPTIONS_PATH}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as handle:
        json.dump(subscriptions, handle, indent=2, sort_keys=True)
    os.replace(tmp_path, SUBSCRIPTIONS_PATH)


def parse_payment_date(raw_date):
    try:
        return datetime.strptime(raw_date, "%Y-%m-%d").date()
    except ValueError:
        return None


def append_admin_log(action, details=None):
    entry = {
        "action": action,
        "details": details or {},
        "ip": request.remote_addr,
        "timestamp": datetime.utcnow().isoformat(timespec="seconds"),
    }
    log_entries = []
    if os.path.exists(ADMIN_LOG_PATH):
        with open(ADMIN_LOG_PATH, "r", encoding="utf-8") as handle:
            data = json.load(handle)
            if isinstance(data, list):
                log_entries = data
    log_entries.append(entry)
    tmp_path = f"{ADMIN_LOG_PATH}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as handle:
        json.dump(log_entries, handle, indent=2, sort_keys=True)
    os.replace(tmp_path, ADMIN_LOG_PATH)


def load_admin_log(limit=50):
    if not os.path.exists(ADMIN_LOG_PATH):
        return []
    with open(ADMIN_LOG_PATH, "r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, list):
        return []
    return list(reversed(data))[:limit]


@app.get("/")
def home():
    return redirect(url_for("join"))


@app.get("/join")
def join():
    redirect_uri = os.getenv("DISCORD_REDIRECT_URI")
    logger.info("OAuth start")
    return discord.authorize_redirect(redirect_uri)


@app.get("/oauth/callback")
def callback():
    token = discord.authorize_access_token()
    session["token"] = token
    logger.info("OAuth callback")

    guild_id = os.getenv("DISCORD_GUILD_ID")
    user = discord.get("users/@me").json()
    user_id = user.get("id")

    bot_token = os.getenv("DISCORD_BOT_TOKEN")
    if not bot_token:
        return render_template(
            "message.html",
            title="Configuration error",
            message="Bot token is not configured.",
        )
    if not user_id:
        return render_template(
            "message.html",
            title="Configuration error",
            message="Discord user ID not available.",
        )

    headers = {"Authorization": f"Bot {bot_token}"}
    url = f"https://discord.com/api/guilds/{guild_id}/members/{user_id}"
    resp = requests.get(url, headers=headers, timeout=10)
    if resp.status_code == 200:
        in_guild = True
        logger.info("Guild membership verified via bot token")
    elif resp.status_code == 404:
        in_guild = False
        logger.info("User not found in guild via bot token")
    else:
        logger.warning("Bot token check failed (status %s)", resp.status_code)
        return render_template(
            "message.html",
            title="Check failed",
            message="Unable to verify Discord membership right now. Try again later.",
        )
    if not in_guild:
        logger.info("User not in guild")
        return render_template(
            "message.html",
            title="Access denied",
            message="You must be in the Discord server to continue.",
        )

    session["verified"] = True
    logger.info("User verified in guild")
    return redirect(url_for("whitelist_form"))


@app.get("/whitelist")
def whitelist_form():
    if not session.get("verified"):
        return redirect(url_for("join"))
    return render_template("whitelist.html", error=None, success=None)


@app.post("/whitelist")
def whitelist_submit():
    if not session.get("verified"):
        return redirect(url_for("join"))

    mc_name = request.form.get("mc_name", "").strip()
    if not MC_NAME_RE.match(mc_name):
        return render_template(
            "whitelist.html",
            error="Enter a valid Minecraft name (3-16 chars, letters/numbers/underscore).",
            success=None,
        )

    subscriptions = load_subscriptions()
    entry = next((item for item in subscriptions if item.get("mc_name") == mc_name), None)
    if not entry:
        entry = {
            "mc_name": mc_name,
            "payment_date": "",
            "duration_days": 0,
            "end_date": "",
            "active": False,
            "pending": True,
            "requested_at": datetime.utcnow().isoformat(timespec="seconds"),
            "updated_at": datetime.utcnow().isoformat(timespec="seconds"),
        }
        subscriptions.append(entry)
        save_subscriptions(subscriptions)
        append_admin_log("pending-request", {"mc_name": mc_name})
        return render_template(
            "whitelist.html",
            error=None,
            success="You're verified. Access will be granted once your subscription is activated.",
        )
    if not entry.get("active"):
        entry["pending"] = True
        entry["requested_at"] = datetime.utcnow().isoformat(timespec="seconds")
        entry["updated_at"] = datetime.utcnow().isoformat(timespec="seconds")
        save_subscriptions(subscriptions)
        append_admin_log("pending-request", {"mc_name": mc_name})
        return render_template(
            "whitelist.html",
            error=None,
            success="You're verified. Access will be granted once your subscription is activated.",
        )

    host = os.getenv("RCON_HOST")
    port = int(os.getenv("RCON_PORT", "25575"))
    password = os.getenv("RCON_PASSWORD")

    logger.info("Whitelisting request for %s", mc_name)
    rcon = RCONClient(host, port=port)
    rcon.login(password)
    rcon.command(f"whitelist add {mc_name}")
    rcon.stop()

    return redirect(url_for("success", mc_name=mc_name))


@app.get("/success")
def success():
    mc_name = request.args.get("mc_name", "")
    return render_template("success.html", mc_name=mc_name)


@app.get("/admin")
def admin_panel():
    is_admin = bool(session.get("admin"))
    subscriptions = load_subscriptions() if is_admin else []
    log_entries = load_admin_log() if is_admin else []
    return render_template(
        "admin.html",
        is_admin=is_admin,
        error=None,
        success=None,
        subscriptions=subscriptions,
        log_entries=log_entries,
        today=datetime.utcnow().date().isoformat(),
    )


@app.post("/admin/login")
def admin_login():
    password = request.form.get("password", "")
    expected = os.getenv("ADMIN_PASSWORD", "")
    if not expected or password != expected:
        append_admin_log("login-failed")
        return render_template(
            "admin.html",
            is_admin=False,
            error="Invalid admin password.",
            success=None,
            subscriptions=[],
            log_entries=[],
            today=datetime.utcnow().date().isoformat(),
        )
    session["admin"] = True
    append_admin_log("login-success")
    return redirect(url_for("admin_panel"))


@app.post("/admin/logout")
def admin_logout():
    session.pop("admin", None)
    append_admin_log("logout")
    return redirect(url_for("admin_panel"))


@app.post("/admin/subscription")
def admin_subscription_upsert():
    if not session.get("admin"):
        return redirect(url_for("admin_panel"))

    mc_name = request.form.get("mc_name", "").strip()
    payment_date_raw = request.form.get("payment_date", "").strip()
    duration_raw = request.form.get("duration_days", "").strip()
    active = request.form.get("active") == "on"

    if not MC_NAME_RE.match(mc_name):
        return render_template(
            "admin.html",
            is_admin=True,
            error="Enter a valid Minecraft name (3-16 chars, letters/numbers/underscore).",
            success=None,
            subscriptions=load_subscriptions(),
            log_entries=load_admin_log(),
            today=datetime.utcnow().date().isoformat(),
        )

    payment_date = parse_payment_date(payment_date_raw)
    if not payment_date:
        return render_template(
            "admin.html",
            is_admin=True,
            error="Payment date must be in YYYY-MM-DD format.",
            success=None,
            subscriptions=load_subscriptions(),
            log_entries=load_admin_log(),
            today=datetime.utcnow().date().isoformat(),
        )

    try:
        duration_days = int(duration_raw)
        if duration_days <= 0:
            raise ValueError
    except ValueError:
        return render_template(
            "admin.html",
            is_admin=True,
            error="Duration must be a positive number of days.",
            success=None,
            subscriptions=load_subscriptions(),
            log_entries=load_admin_log(),
            today=datetime.utcnow().date().isoformat(),
        )

    end_date = payment_date + timedelta(days=duration_days)
    subscriptions = load_subscriptions()
    updated = False
    for entry in subscriptions:
        if entry.get("mc_name") == mc_name:
            entry.update(
                {
                    "mc_name": mc_name,
                    "payment_date": payment_date.isoformat(),
                    "duration_days": duration_days,
                    "end_date": end_date.isoformat(),
                    "active": active,
                    "pending": False,
                    "updated_at": datetime.utcnow().isoformat(timespec="seconds"),
                }
            )
            updated = True
            break

    if not updated:
        subscriptions.append(
            {
                "mc_name": mc_name,
                "payment_date": payment_date.isoformat(),
                "duration_days": duration_days,
                "end_date": end_date.isoformat(),
                "active": active,
                "pending": False,
                "updated_at": datetime.utcnow().isoformat(timespec="seconds"),
            }
        )

    save_subscriptions(subscriptions)
    append_admin_log(
        "subscription-saved",
        {
            "mc_name": mc_name,
            "active": active,
            "duration_days": duration_days,
            "payment_date": payment_date.isoformat(),
        },
    )
    return render_template(
        "admin.html",
        is_admin=True,
        error=None,
        success=f"Subscription saved for {mc_name}.",
        subscriptions=subscriptions,
        log_entries=load_admin_log(),
        today=datetime.utcnow().date().isoformat(),
    )


@app.post("/admin/subscription/<mc_name>/delete")
def admin_subscription_delete(mc_name):
    if not session.get("admin"):
        return redirect(url_for("admin_panel"))
    subscriptions = load_subscriptions()
    filtered = [entry for entry in subscriptions if entry.get("mc_name") != mc_name]
    save_subscriptions(filtered)
    append_admin_log("subscription-deleted", {"mc_name": mc_name})
    return render_template(
        "admin.html",
        is_admin=True,
        error=None,
        success=f"Subscription removed for {mc_name}.",
        subscriptions=filtered,
        log_entries=load_admin_log(),
        today=datetime.utcnow().date().isoformat(),
    )


if __name__ == "__main__":
    app.run(debug=True, threaded=False)
