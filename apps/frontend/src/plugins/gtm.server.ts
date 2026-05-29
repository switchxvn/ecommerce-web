const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/;

const extractGtmId = (settings: Array<{ key?: string; value?: string }> = []) => {
  const rawValue = settings.find((setting) => setting.key === 'google_tag_manager_id')?.value?.trim() || '';
  return GTM_ID_PATTERN.test(rawValue) ? rawValue : null;
};

export default defineNuxtPlugin(async (nuxtApp) => {
  if (process.client) return;

  const gtmIdState = useState<string | null>('gtm-id', () => null);

  try {
    if (!nuxtApp?.ssrContext || !nuxtApp.$trpc?.settings?.getPublicSettings?.query) {
      return;
    }

    const settings = await nuxtApp.$trpc.settings.getPublicSettings.query();
    const gtmId = extractGtmId(settings);

    if (!gtmId) {
      return;
    }

    gtmIdState.value = gtmId;
    nuxtApp.provide('gtmId', gtmId);
  } catch (error) {
    console.error('GTM Server Plugin: Error resolving GTM ID from public settings:', error);
  }
});
