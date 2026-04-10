import fs from "node:fs";
import path from "node:path";

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, "utf8");
  const env = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function sanitizeCustomerId(value) {
  return value ? value.replace(/-/g, "").trim() : "";
}

export function parseArgs(argv) {
  const args = {
    days: 7,
    json: false,
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) {
      continue;
    }

    const [rawKey, rawValue] = arg.slice(2).split("=");
    const key = rawKey.trim();
    const value = rawValue ?? "true";

    if (key === "env") {
      args.env = value;
    } else if (key === "days") {
      args.days = Number(value);
    } else if (key === "campaign") {
      args.campaign = value;
    } else if (key === "json") {
      args.json = value !== "false";
    }
  }

  return args;
}

export function loadConfig(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const envPath = path.resolve(process.cwd(), args.env || ".env.google-ads");
  const fileEnv = parseEnvFile(envPath);

  const get = (key) => process.env[key] || fileEnv[key] || "";

  const config = {
    envPath,
    apiVersion: get("GOOGLE_ADS_API_VERSION") || "v23",
    developerToken: get("GOOGLE_ADS_DEVELOPER_TOKEN"),
    customerId: sanitizeCustomerId(get("GOOGLE_ADS_CUSTOMER_ID")),
    loginCustomerId: sanitizeCustomerId(get("GOOGLE_ADS_LOGIN_CUSTOMER_ID")),
    serviceAccountKeyPath: get("GOOGLE_ADS_SERVICE_ACCOUNT_KEY_PATH")
      ? path.resolve(process.cwd(), get("GOOGLE_ADS_SERVICE_ACCOUNT_KEY_PATH"))
      : "",
    campaign: args.campaign || "",
    days: Number.isFinite(args.days) && args.days > 0 ? args.days : 7,
    json: Boolean(args.json),
  };

  const missing = [];
  if (!config.developerToken) missing.push("GOOGLE_ADS_DEVELOPER_TOKEN");
  if (!config.customerId) missing.push("GOOGLE_ADS_CUSTOMER_ID");
  if (!config.serviceAccountKeyPath) {
    missing.push("GOOGLE_ADS_SERVICE_ACCOUNT_KEY_PATH");
  }

  return { config, missing };
}
