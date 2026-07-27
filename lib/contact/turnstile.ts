import "server-only";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_TIMEOUT_MS = 8_000;
const MAX_TURNSTILE_TOKEN_LENGTH = 2_048;
const TURNSTILE_TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";

type TurnstileVerificationResponse = {
  success?: unknown;
  action?: unknown;
  hostname?: unknown;
};

function getAllowedHostnames() {
  return new Set(
    (process.env.TURNSTILE_ALLOWED_HOSTNAMES ?? "")
      .split(",")
      .map((hostname) => hostname.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function verifyTurnstileToken(token: unknown): Promise<boolean> {
  if (typeof token !== "string") return false;

  const responseToken = token.trim();
  if (!responseToken || responseToken.length > MAX_TURNSTILE_TOKEN_LENGTH) {
    return false;
  }

  const secret =
    process.env.NODE_ENV === "production"
      ? process.env.TURNSTILE_SECRET_KEY?.trim()
      : TURNSTILE_TEST_SECRET_KEY;
  if (!secret) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TURNSTILE_TIMEOUT_MS);

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: responseToken }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) return false;

    const result = (await response.json()) as TurnstileVerificationResponse;
    if (!result || typeof result !== "object" || result.success !== true) {
      return false;
    }

    const expectedAction =
      process.env.NODE_ENV === "production" ? "contact_form" : "test";
    if (result.action !== expectedAction) return false;

    if (process.env.NODE_ENV === "production") {
      const allowedHostnames = getAllowedHostnames();
      if (!allowedHostnames.size || typeof result.hostname !== "string") {
        return false;
      }
      if (!allowedHostnames.has(result.hostname.toLowerCase())) return false;
    }

    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
