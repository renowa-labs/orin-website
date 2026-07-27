import "server-only";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 5;
const REPEAT_WINDOW_MS = 5 * 60 * 1000;

type RateLimitState = {
  attempts: Map<string, number[]>;
  submissions: Map<string, number>;
};

const globalRateLimit = globalThis as typeof globalThis & {
  __orinContactRateLimit?: RateLimitState;
};

const state: RateLimitState =
  globalRateLimit.__orinContactRateLimit ??
  (globalRateLimit.__orinContactRateLimit = {
    attempts: new Map(),
    submissions: new Map(),
  });

export function consumeContactAttempt(identifier: string, now = Date.now()) {
  const recent = (state.attempts.get(identifier) ?? []).filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  );

  if (recent.length >= MAX_REQUESTS) {
    state.attempts.set(identifier, recent);
    return false;
  }

  recent.push(now);
  state.attempts.set(identifier, recent);
  return true;
}

export function isRepeatedContact(
  identifier: string,
  fingerprint: string,
  now = Date.now(),
) {
  const key = `${identifier}:${fingerprint}`;
  const previous = state.submissions.get(key);

  if (previous && now - previous < REPEAT_WINDOW_MS) return true;
  if (state.submissions.size > 500) cleanup(now);
  return false;
}

export function rememberContact(
  identifier: string,
  fingerprint: string,
  now = Date.now(),
) {
  state.submissions.set(`${identifier}:${fingerprint}`, now);
}

function cleanup(now: number) {
  for (const [key, timestamp] of state.submissions) {
    if (now - timestamp >= REPEAT_WINDOW_MS) state.submissions.delete(key);
  }

  for (const [key, timestamps] of state.attempts) {
    const recent = timestamps.filter(
      (timestamp) => now - timestamp < WINDOW_MS,
    );
    if (recent.length) state.attempts.set(key, recent);
    else state.attempts.delete(key);
  }
}
