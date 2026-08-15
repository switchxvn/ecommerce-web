import { ref } from 'vue';

import type { AdvertisingPopupCampaign } from '../types/advertising-popup';
import { useTrpc } from './useTrpc';

const SESSION_MARKER_KEY = 'advertising-popup-shown';

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

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(?:T.*)?$/;

const isNullableDate = (value: unknown): value is Date | string | null => {
  if (value === null) return true;
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  return (
    typeof value === 'string' &&
    ISO_DATE_PATTERN.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
};

const isCampaign = (value: unknown): value is AdvertisingPopupCampaign => {
  if (typeof value !== 'object' || value === null) return false;

  const campaign = value as Record<string, unknown>;
  return (
    typeof campaign.id === 'number' &&
    Number.isFinite(campaign.id) &&
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

export const useAdvertisingPopup = () => {
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
      const result: unknown =
        await useTrpc().advertisingPopup.getActive.query();
      if (!isCampaign(result)) return;

      campaign.value = result;
      window.sessionStorage.setItem(SESSION_MARKER_KEY, 'true');
      shouldShow.value = true;
    } catch (initializationError) {
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

  const close = () => {
    shouldShow.value = false;
  };

  return { campaign, shouldShow, isLoading, error, initialize, close };
};
