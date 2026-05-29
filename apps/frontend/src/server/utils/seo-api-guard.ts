const SEO_API_COOLDOWN_MS = 30_000;
const SEO_API_LOG_THROTTLE_MS = 30_000;

let unavailableUntil = 0;
let lastLoggedAt = 0;

export function shouldBypassSeoApiFetch(now = Date.now()): boolean {
  return now < unavailableUntil;
}

export function markSeoApiFailure(now = Date.now()): void {
  unavailableUntil = now + SEO_API_COOLDOWN_MS;
}

export function markSeoApiSuccess(): void {
  unavailableUntil = 0;
}

export function shouldLogSeoApiFailure(now = Date.now()): boolean {
  if (lastLoggedAt === 0) {
    lastLoggedAt = now;
    return true;
  }

  if (now - lastLoggedAt < SEO_API_LOG_THROTTLE_MS) {
    return false;
  }

  lastLoggedAt = now;
  return true;
}

export function getSeoApiCooldownMs(now = Date.now()): number {
  return Math.max(0, unavailableUntil - now);
}

export function resetSeoApiGuard(): void {
  unavailableUntil = 0;
  lastLoggedAt = 0;
}
