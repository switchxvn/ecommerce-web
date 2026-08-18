import { ref } from 'vue';

import type { AdvertisingPopupCampaign } from '../types/advertising-popup';
import { useTrpc } from './useTrpc';

const SESSION_MARKER_KEY = 'advertising-popup-shown';
const DISMISSED_CAMPAIGNS_KEY = 'advertising-popup-dismissed-campaigns';

interface AdvertisingPopupSessionClaim {
  owner: symbol;
  promise: Promise<AdvertisingPopupCampaign | null>;
}

let advertisingPopupSessionClaim: AdvertisingPopupSessionClaim | null = null;

export const __resetAdvertisingPopupSessionForTests = () => {
  advertisingPopupSessionClaim = null;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isSafeCtaUrl = (value: unknown): value is string => {
  if (!isNonEmptyString(value)) return false;
  if (value.includes('\\')) return false;
  if (value.startsWith('/') && !value.startsWith('//')) return true;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.length > 0;
  } catch {
    return false;
  }
};

const ISO_DATE_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/;

const isNullableDate = (value: unknown): value is Date | string | null => {
  if (value === null) return true;
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  if (typeof value !== 'string') return false;

  const match = ISO_DATE_PATTERN.exec(value);
  if (!match || Number.isNaN(Date.parse(value))) return false;

  const [, year, month, day] = match;
  const calendarDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  return (
    calendarDate.getUTCFullYear() === Number(year) &&
    calendarDate.getUTCMonth() + 1 === Number(month) &&
    calendarDate.getUTCDate() === Number(day)
  );
};

const isCampaign = (value: unknown): value is AdvertisingPopupCampaign => {
  if (typeof value !== 'object' || value === null) return false;

  const campaign = value as Record<string, unknown>;
  return (
    typeof campaign.id === 'number' &&
    Number.isInteger(campaign.id) &&
    campaign.id > 0 &&
    isNonEmptyString(campaign.name) &&
    isNonEmptyString(campaign.title) &&
    isNonEmptyString(campaign.content) &&
    isNonEmptyString(campaign.ctaLabel) &&
    isSafeCtaUrl(campaign.ctaUrl) &&
    campaign.isActive === true &&
    isNullableDate(campaign.startsAt) &&
    isNullableDate(campaign.endsAt)
  );
};

const parseDismissedCampaignIds = (value: string | null): number[] => {
  if (value === null) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((id): id is number => Number.isInteger(id) && id > 0);
  } catch {
    return [];
  }
};

export const useAdvertisingPopup = () => {
  const instanceId = Symbol('advertising-popup-instance');
  const campaign = ref<AdvertisingPopupCampaign | null>(null);
  const shouldShow = ref(false);
  const isLoading = ref(false);
  const error = ref<unknown>(null);
  let initialization: Promise<void> | null = null;

  const runInitialization = async () => {
    if (typeof window === 'undefined') return;

    try {
      if (window.sessionStorage.getItem(SESSION_MARKER_KEY) !== null) return;
    } catch (storageError) {
      error.value = storageError;
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      if (advertisingPopupSessionClaim) {
        await advertisingPopupSessionClaim.promise;
        return;
      }

      const claim: AdvertisingPopupSessionClaim = {
        owner: instanceId,
        promise: (async () => {
          const result: unknown =
            await useTrpc().advertisingPopup.getActive.query();
          if (!isCampaign(result)) return null;

          campaign.value = result;
          window.sessionStorage.setItem(SESSION_MARKER_KEY, 'true');
          return result;
        })(),
      };
      advertisingPopupSessionClaim = claim;

      const result = await claim.promise;
      if (!result) {
        if (advertisingPopupSessionClaim === claim) {
          advertisingPopupSessionClaim = null;
        }
        return;
      }

      let dismissedCampaignIds: number[] = [];
      try {
        dismissedCampaignIds = parseDismissedCampaignIds(
          window.localStorage.getItem(DISMISSED_CAMPAIGNS_KEY)
        );
      } catch {
        // localStorage can be unavailable; session-only behavior still applies.
      }
      if (dismissedCampaignIds.includes(result.id)) return;

      shouldShow.value = true;
    } catch (initializationError) {
      if (advertisingPopupSessionClaim?.owner === instanceId) {
        advertisingPopupSessionClaim = null;
      }
      error.value = initializationError;
      shouldShow.value = false;
    } finally {
      isLoading.value = false;
    }
  };

  const initialize = (): Promise<void> => {
    if (!initialization) {
      initialization = runInitialization().finally(() => {
        initialization = null;
      });
    }
    return initialization;
  };

  const close = (doNotShowAgain = false) => {
    shouldShow.value = false;
    if (!doNotShowAgain || !campaign.value || typeof window === 'undefined') {
      return;
    }

    try {
      const dismissedCampaignIds = parseDismissedCampaignIds(
        window.localStorage.getItem(DISMISSED_CAMPAIGNS_KEY)
      );
      const campaignIds = Array.from(
        new Set([...dismissedCampaignIds, campaign.value.id])
      );
      window.localStorage.setItem(
        DISMISSED_CAMPAIGNS_KEY,
        JSON.stringify(campaignIds)
      );
    } catch (storageError) {
      error.value = storageError;
    }
  };

  return { campaign, shouldShow, isLoading, error, initialize, close };
};
