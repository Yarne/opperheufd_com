export async function getOAuthToken(code: string): Promise<{ access_token: string }> {
  const response = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID || "",
      client_secret: process.env.DISCORD_CLIENT_SECRET || "",
      code,
      grant_type: "authorization_code",
      redirect_uri: process.env.DISCORD_REDIRECT_URI || "",
    }),
  });

  if (!response.ok) {
    throw new Error(`Discord token exchange failed: ${response.statusText}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data;
}

export async function verifyGuildMembership(
  userId: string,
  guildId: string,
  botToken: string
): Promise<boolean | null> {
  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`,
      {
        headers: { Authorization: `Bot ${botToken}` },
      }
    );

    if (response.status === 200) {
      console.info("Guild membership verified via bot token");
      return true;
    } else if (response.status === 404) {
      console.info("User not found in guild via bot token");
      return false;
    } else {
      console.warn("Bot token check failed (status %s)", response.status);
      return null;
    }
  } catch (error) {
    console.error("Guild membership check error:", error);
    return null;
  }
}
