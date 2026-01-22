import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import ejs from "ejs";
import {
  loadSubscriptions,
  saveSubscriptions,
  loadAdminLog,
  appendAdminLog,
  parsePaymentDate,
} from "./services/subscriptionService";
import { verifyGuildMembership, getOAuthToken } from "./services/discordService";
import { executeWhitelist } from "./services/rconService";
import {
  MC_NAME_RE,
  normalizeDate,
  getRemoteAddr,
} from "./utils/helpers";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.engine("html", ejs.renderFile);
app.set("view engine", "html");
app.set("views", path.join(__dirname, "../templates"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-me",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production", httpOnly: true },
  })
);

// Type augmentation for session
declare global {
  namespace Express {
    interface Session {
      verified?: boolean;
      admin?: boolean;
      token?: { access_token: string };
    }
  }
}

interface DiscordUser {
  id: string;
  username: string;
}

// Home route
app.get("/", (req, res) => {
  res.redirect("/join");
});

// Initiate OAuth flow
app.get("/join", (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.DISCORD_REDIRECT_URI || "");
  const scope = encodeURIComponent("identify guilds");

  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;

  console.info("OAuth start");
  res.redirect(discordAuthUrl);
});

// OAuth callback
app.get("/oauth/callback", async (req, res) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      return res.render("message", {
        title: "Error",
        message: "Missing authorization code.",
      });
    }

    const token = await getOAuthToken(code);
    (req.session as any).token = { access_token: token.access_token };

    console.info("OAuth callback");

    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      return res.render("message", {
        title: "Configuration error",
        message: "Bot token is not configured.",
      });
    }

    const user = (await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    }).then((r) => r.json())) as DiscordUser;

    const userId = user?.id;
    if (!userId) {
      return res.render("message", {
        title: "Configuration error",
        message: "Discord user ID not available.",
      });
    }

    const guildId = process.env.DISCORD_GUILD_ID;
    const inGuild = await verifyGuildMembership(userId, guildId!, botToken);

    if (inGuild === null) {
      console.warn("Bot token check failed");
      return res.render("message", {
        title: "Check failed",
        message:
          "Unable to verify Discord membership right now. Try again later.",
      });
    }

    if (!inGuild) {
      console.info("User not in guild");
      return res.render("message", {
        title: "Access denied",
        message: "You must be in the Discord server to continue.",
      });
    }

    (req.session as any).verified = true;
    console.info("User verified in guild");
    res.redirect("/whitelist");
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.render("message", {
      title: "Error",
      message: "An error occurred during authentication.",
    });
  }
});

// Whitelist form
app.get("/whitelist", (req, res) => {
  if (!(req.session as any).verified) {
    return res.redirect("/join");
  }
  res.render("whitelist", { error: null, success: null });
});

// Whitelist submission
app.post("/whitelist", async (req, res) => {
  if (!(req.session as any).verified) {
    return res.redirect("/join");
  }

  const mcName = (req.body.mc_name || "").trim();

  if (!MC_NAME_RE.test(mcName)) {
    return res.render("whitelist", {
      error:
        "Enter a valid Minecraft name (3-16 chars, letters/numbers/underscore).",
      success: null,
    });
  }

  try {
    const subscriptions = await loadSubscriptions();
    let entry = subscriptions.find((item) => item.mc_name === mcName);

    const now = new Date().toISOString();

    if (!entry) {
      entry = {
        mc_name: mcName,
        payment_date: "",
        duration_days: 0,
        end_date: "",
        active: false,
        pending: true,
        requested_at: now,
        updated_at: now,
      };
      subscriptions.push(entry);
      await saveSubscriptions(subscriptions);
      await appendAdminLog("pending-request", { mc_name: mcName }, req);

      return res.render("whitelist", {
        error: null,
        success:
          "You're verified. Access will be granted once your subscription is activated.",
      });
    }

    if (!entry.active) {
      entry.pending = true;
      entry.requested_at = now;
      entry.updated_at = now;
      await saveSubscriptions(subscriptions);
      await appendAdminLog("pending-request", { mc_name: mcName }, req);

      return res.render("whitelist", {
        error: null,
        success:
          "You're verified. Access will be granted once your subscription is activated.",
      });
    }

    console.info("Whitelisting request for %s", mcName);
    await executeWhitelist(mcName);

    res.redirect(`/success?mc_name=${encodeURIComponent(mcName)}`);
  } catch (error) {
    console.error("Whitelist submission error:", error);
    res.render("whitelist", {
      error: "An error occurred while processing your request.",
      success: null,
    });
  }
});

// Success page
app.get("/success", (req, res) => {
  const mcName = (req.query.mc_name || "") as string;
  res.render("success", { mc_name: mcName });
});

// Admin panel
app.get("/admin", async (req, res) => {
  const isAdmin = !!(req.session as any).admin;
  const subscriptions = isAdmin ? await loadSubscriptions() : [];
  const logEntries = isAdmin ? await loadAdminLog() : [];
  const today = new Date().toISOString().split("T")[0];

  res.render("admin", {
    is_admin: isAdmin,
    error: null,
    success: null,
    subscriptions,
    log_entries: logEntries,
    today,
  });
});

// Admin login
app.post("/admin/login", async (req, res) => {
  const password = req.body.password || "";
  const expected = process.env.ADMIN_PASSWORD || "";

  if (!expected || password !== expected) {
    await appendAdminLog("login-failed", {}, req);
    const today = new Date().toISOString().split("T")[0];

    return res.render("admin", {
      is_admin: false,
      error: "Invalid admin password.",
      success: null,
      subscriptions: [],
      log_entries: [],
      today,
    });
  }

  (req.session as any).admin = true;
  await appendAdminLog("login-success", {}, req);
  res.redirect("/admin");
});

// Admin logout
app.post("/admin/logout", async (req, res) => {
  (req.session as any).admin = false;
  await appendAdminLog("logout", {}, req);
  res.redirect("/admin");
});

// Admin subscription upsert
app.post("/admin/subscription", async (req, res) => {
  if (!(req.session as any).admin) {
    return res.redirect("/admin");
  }

  const mcName = (req.body.mc_name || "").trim();
  const paymentDateRaw = (req.body.payment_date || "").trim();
  const durationRaw = (req.body.duration_days || "").trim();
  const active = req.body.active === "on";

  const today = new Date().toISOString().split("T")[0];

  if (!MC_NAME_RE.test(mcName)) {
    const subscriptions = await loadSubscriptions();
    const logEntries = await loadAdminLog();
    return res.render("admin", {
      is_admin: true,
      error:
        "Enter a valid Minecraft name (3-16 chars, letters/numbers/underscore).",
      success: null,
      subscriptions,
      log_entries: logEntries,
      today,
    });
  }

  const paymentDate = parsePaymentDate(paymentDateRaw);
  if (!paymentDate) {
    const subscriptions = await loadSubscriptions();
    const logEntries = await loadAdminLog();
    return res.render("admin", {
      is_admin: true,
      error: "Payment date must be in YYYY-MM-DD format.",
      success: null,
      subscriptions,
      log_entries: logEntries,
      today,
    });
  }

  let durationDays: number;
  try {
    durationDays = parseInt(durationRaw, 10);
    if (durationDays <= 0) throw new Error();
  } catch {
    const subscriptions = await loadSubscriptions();
    const logEntries = await loadAdminLog();
    return res.render("admin", {
      is_admin: true,
      error: "Duration must be a positive number of days.",
      success: null,
      subscriptions,
      log_entries: logEntries,
      today,
    });
  }

  const endDate = new Date(paymentDate);
  endDate.setDate(endDate.getDate() + durationDays);
  const endDateStr = endDate.toISOString().split("T")[0];

  try {
    const subscriptions = await loadSubscriptions();
    let updated = false;

    for (const entry of subscriptions) {
      if (entry.mc_name === mcName) {
        entry.mc_name = mcName;
        entry.payment_date = normalizeDate(paymentDate);
        entry.duration_days = durationDays;
        entry.end_date = endDateStr;
        entry.active = active;
        entry.pending = false;
        entry.updated_at = new Date().toISOString();
        updated = true;
        break;
      }
    }

    if (!updated) {
      subscriptions.push({
        mc_name: mcName,
        payment_date: normalizeDate(paymentDate),
        duration_days: durationDays,
        end_date: endDateStr,
        active,
        pending: false,
        requested_at: "",
        updated_at: new Date().toISOString(),
      });
    }

    await saveSubscriptions(subscriptions);
    await appendAdminLog(
      "subscription-saved",
      {
        mc_name: mcName,
        active,
        duration_days: durationDays,
        payment_date: normalizeDate(paymentDate),
      },
      req
    );

    const updatedSubscriptions = await loadSubscriptions();
    const logEntries = await loadAdminLog();
    res.render("admin", {
      is_admin: true,
      error: null,
      success: `Subscription saved for ${mcName}.`,
      subscriptions: updatedSubscriptions,
      log_entries: logEntries,
      today,
    });
  } catch (error) {
    console.error("Admin subscription save error:", error);
    const subscriptions = await loadSubscriptions();
    const logEntries = await loadAdminLog();
    res.render("admin", {
      is_admin: true,
      error: "An error occurred while saving the subscription.",
      success: null,
      subscriptions,
      log_entries: logEntries,
      today,
    });
  }
});

// Admin subscription delete
app.post("/admin/subscription/:mcName/delete", async (req, res) => {
  if (!(req.session as any).admin) {
    return res.redirect("/admin");
  }

  const mcName = req.params.mcName;
  const today = new Date().toISOString().split("T")[0];

  try {
    const subscriptions = await loadSubscriptions();
    const filtered = subscriptions.filter((entry) => entry.mc_name !== mcName);
    await saveSubscriptions(filtered);
    await appendAdminLog("subscription-deleted", { mc_name: mcName }, req);

    const logEntries = await loadAdminLog();
    res.render("admin", {
      is_admin: true,
      error: null,
      success: `Subscription removed for ${mcName}.`,
      subscriptions: filtered,
      log_entries: logEntries,
      today,
    });
  } catch (error) {
    console.error("Admin subscription delete error:", error);
    const subscriptions = await loadSubscriptions();
    const logEntries = await loadAdminLog();
    res.render("admin", {
      is_admin: true,
      error: "An error occurred while deleting the subscription.",
      success: null,
      subscriptions,
      log_entries: logEntries,
      today,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
