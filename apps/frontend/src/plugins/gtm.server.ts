export default defineNuxtPlugin(async (nuxtApp) => {
  // Only run on server side for SEO and initial load
  if (process.client) return

  try {
    // Check if we have a valid Nuxt context
    if (!nuxtApp || !nuxtApp.ssrContext) {
      console.warn('GTM Server Plugin: Invalid Nuxt context');
      return;
    }

    // Get tRPC instance to fetch settings
    const { $trpc } = nuxtApp;
    if (!$trpc) {
      console.warn('GTM Server Plugin: tRPC not available');
      // Fallback to hardcoded GTM ID
      const fallbackGtmId = process.env.GTM_ID || 'GTM-T89X4CKH';
      if (fallbackGtmId) {
        nuxtApp.provide('gtmId', fallbackGtmId);
        useState('gtm-id', () => fallbackGtmId);
      }
      return;
    }

    // Fetch GTM ID from database with timeout
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('GTM settings fetch timeout')), 5000)
      );

      const settingsPromise = ($trpc as any).settings.getPublicSettings.query();
      
      const settings = await Promise.race([settingsPromise, timeoutPromise]);
      const gtmId = settings.find((s: any) => s.key === 'google_tag_manager_id')?.value;

      if (gtmId && gtmId.trim()) {
        // Store GTM ID in global state for use across the app
        useState('gtm-id', () => gtmId);
        
        // Also provide it via nuxtApp for immediate access
        nuxtApp.provide('gtmId', gtmId);
      } else {
        console.warn('GTM Server Plugin: No GTM ID found in database, using fallback');
        // Fallback to hardcoded GTM ID
        const fallbackGtmId = process.env.GTM_ID || 'GTM-T89X4CKH';
        if (fallbackGtmId) {
          nuxtApp.provide('gtmId', fallbackGtmId);
          useState('gtm-id', () => fallbackGtmId);
        }
      }
    } catch (apiError) {
      console.warn('GTM Server Plugin: Failed to fetch GTM settings:', apiError);
      // Fallback to hardcoded GTM ID
      const fallbackGtmId = process.env.GTM_ID || 'GTM-T89X4CKH';
      if (fallbackGtmId) {
        nuxtApp.provide('gtmId', fallbackGtmId);
        useState('gtm-id', () => fallbackGtmId);
      }
    }

  } catch (error) {
    console.error('GTM Server Plugin: Error:', error);
    // Final fallback
    const fallbackGtmId = process.env.GTM_ID || 'GTM-T89X4CKH';
    if (fallbackGtmId) {
      nuxtApp.provide('gtmId', fallbackGtmId);
      useState('gtm-id', () => fallbackGtmId);
    }
  }
});
