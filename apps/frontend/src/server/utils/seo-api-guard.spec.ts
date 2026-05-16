import { afterEach, describe, expect, it } from 'vitest';
import {
  getSeoApiCooldownMs,
  markSeoApiFailure,
  markSeoApiSuccess,
  resetSeoApiGuard,
  shouldBypassSeoApiFetch,
  shouldLogSeoApiFailure,
} from './seo-api-guard';

describe('seo-api-guard', () => {
  afterEach(() => {
    resetSeoApiGuard();
  });

  it('skips repeated upstream calls while SEO API is in cooldown', () => {
    const now = 1_000;

    expect(shouldBypassSeoApiFetch(now)).toBe(false);

    markSeoApiFailure(now);

    expect(shouldBypassSeoApiFetch(now + 1)).toBe(true);
    expect(getSeoApiCooldownMs(now + 1)).toBe(29_999);
    expect(shouldBypassSeoApiFetch(now + 30_001)).toBe(false);
  });

  it('clears cooldown after a successful upstream call', () => {
    const now = 5_000;

    markSeoApiFailure(now);
    expect(shouldBypassSeoApiFetch(now + 10)).toBe(true);

    markSeoApiSuccess();

    expect(shouldBypassSeoApiFetch(now + 10)).toBe(false);
    expect(getSeoApiCooldownMs(now + 10)).toBe(0);
  });

  it('throttles repeated SEO API failure logs', () => {
    const now = 10_000;

    expect(shouldLogSeoApiFailure(now)).toBe(true);
    expect(shouldLogSeoApiFailure(now + 1_000)).toBe(false);
    expect(shouldLogSeoApiFailure(now + 30_001)).toBe(true);
  });
});
