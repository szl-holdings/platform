const DEFAULT_API_BASE = "https://api.szlholdings.com";

function fail(message: string): never {
  throw new Error(`[jira-marketplace] Invalid configuration: ${message}`);
}

function validateApiBase(raw: string | undefined): string {
  const value = (raw ?? DEFAULT_API_BASE).trim();
  if (!value) {
    fail("SZL_API_BASE is empty");
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return fail(`SZL_API_BASE is not a valid URL: ${JSON.stringify(value)}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    fail(`SZL_API_BASE must use http or https (got ${parsed.protocol})`);
  }
  if (!parsed.hostname) {
    fail("SZL_API_BASE is missing a hostname");
  }
  return value.replace(/\/+$/, "");
}

function validateInternalToken(raw: string | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) {
    fail("SZL_INTERNAL_TOKEN is required but missing or empty");
  }
  if (value.length < 16) {
    fail("SZL_INTERNAL_TOKEN looks malformed (must be at least 16 characters)");
  }
  return value;
}

export const SZL_API_BASE = validateApiBase(process.env.SZL_API_BASE);
export const SZL_INTERNAL_TOKEN = validateInternalToken(process.env.SZL_INTERNAL_TOKEN);

export const szlHeaders = {
  "Content-Type": "application/json",
  "x-internal-token": SZL_INTERNAL_TOKEN,
};
