import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function executeWhitelist(mcName: string): Promise<void> {
  const host = process.env.RCON_HOST;
  const port = parseInt(process.env.RCON_PORT || "25575", 10);
  const password = process.env.RCON_PASSWORD;

  if (!host || !password) {
    throw new Error("RCON credentials not configured");
  }

  // Using mcrcon CLI tool (must be installed on system)
  // Alternatively, we can use a Node.js RCON library
  const command = `mcrcon -H ${host} -P ${port} -p "${password}" "whitelist add ${mcName}"`;

  try {
    const { stdout } = await execAsync(command);
    console.info(`Whitelist command executed: ${stdout}`);
  } catch (error) {
    console.error("RCON command failed:", error);
    throw new Error("Failed to execute whitelist command");
  }
}
