import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { Request } from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SUBSCRIPTIONS_PATH = path.join(__dirname, "../../subscriptions.json");
const ADMIN_LOG_PATH = path.join(__dirname, "../../admin_log.json");

export interface Subscription {
  mc_name: string;
  payment_date: string;
  duration_days: number;
  end_date: string;
  active: boolean;
  pending: boolean;
  requested_at: string;
  updated_at: string;
}

export interface AdminLogEntry {
  action: string;
  details: Record<string, any>;
  ip: string;
  timestamp: string;
}

export async function loadSubscriptions(): Promise<Subscription[]> {
  try {
    const data = await fs.readFile(SUBSCRIPTIONS_PATH, "utf-8");
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    let changed = false;
    let expiredCount = 0;

    for (const entry of parsed) {
      const endDateRaw = entry.end_date;
      if (!endDateRaw) continue;

      try {
        const [year, month, day] = endDateRaw.split("-").map(Number);
        const endDate = new Date(Date.UTC(year, month - 1, day));
        if (entry.active && endDate < today) {
          entry.active = false;
          entry.updated_at = new Date().toISOString();
          changed = true;
          expiredCount++;
        }
      } catch {
        continue;
      }
    }

    if (changed) {
      await saveSubscriptions(parsed);
      await appendAdminLogDirect("auto-expire", { expired_count: expiredCount });
    }

    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function saveSubscriptions(subscriptions: Subscription[]): Promise<void> {
  const tmpPath = `${SUBSCRIPTIONS_PATH}.tmp`;
  const sorted = subscriptions.sort((a, b) => a.mc_name.localeCompare(b.mc_name));
  await fs.writeFile(tmpPath, JSON.stringify(sorted, null, 2));
  await fs.rename(tmpPath, SUBSCRIPTIONS_PATH);
}

export function parsePaymentDate(rawDate: string): Date | null {
  try {
    const [year, month, day] = rawDate.split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(Date.UTC(year, month - 1, day));
  } catch {
    return null;
  }
}

export async function appendAdminLog(
  action: string,
  details: Record<string, any> = {},
  req: Request
): Promise<void> {
  const entry: AdminLogEntry = {
    action,
    details,
    ip: getRemoteAddr(req),
    timestamp: new Date().toISOString(),
  };
  return appendAdminLogDirect(action, details, entry.ip);
}

async function appendAdminLogDirect(
  action: string,
  details: Record<string, any> = {},
  ip: string = "system"
): Promise<void> {
  let logEntries: AdminLogEntry[] = [];

  try {
    const data = await fs.readFile(ADMIN_LOG_PATH, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      logEntries = parsed;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  logEntries.push({
    action,
    details,
    ip,
    timestamp: new Date().toISOString(),
  });

  const tmpPath = `${ADMIN_LOG_PATH}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(logEntries, null, 2));
  await fs.rename(tmpPath, ADMIN_LOG_PATH);
}

export async function loadAdminLog(limit: number = 50): Promise<AdminLogEntry[]> {
  try {
    const data = await fs.readFile(ADMIN_LOG_PATH, "utf-8");
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed.reverse().slice(0, limit);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export function getRemoteAddr(req: Request): string {
  return (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.socket.remoteAddress || "unknown";
}
