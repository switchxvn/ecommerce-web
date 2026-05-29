import { defineNuxtPlugin } from 'nuxt/app'

export default defineNuxtPlugin(() => {
  const initFacebookSDK = () => {
    return new Promise<void>((resolve) => {
      // @ts-ignore
      window.fbAsyncInit = function() {
        // @ts-ignore
        FB.init({
          xfbml: true,
          version: 'v18.0'
        });
        resolve();
      };

      // Load Facebook SDK
      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/vi_VN/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    });
  };

  if (process.client) {
    const scheduleInit = () => {
      void initFacebookSDK();
    };

    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(scheduleInit, { timeout: 3000 });
    } else {
      window.setTimeout(scheduleInit, 1500);
    }
  }
});
