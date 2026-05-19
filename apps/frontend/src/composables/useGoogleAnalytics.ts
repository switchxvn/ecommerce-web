import { ref, onMounted } from 'vue'
import { useHead } from '#imports'

export const useGoogleAnalytics = () => {
  const isInitialized = ref(false)
  const error = ref<string | null>(null)

  const initializeGTM = (gtmId: string) => {
    // Initialize dataLayer immediately
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js'
      })
    }

    // Use useHead to inject GTM script
    useHead({
      script: [
        // Google Tag Manager
        {
          innerHTML: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`
        }
      ],
      noscript: [
        // Google Tag Manager (noscript)
        {
          innerHTML: `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`
        }
      ]
    })

    isInitialized.value = true
  }

  const initializeGA4 = (gaId: string) => {
    // Initialize gtag function
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || []
      const gtag = (...args: any[]) => {
        window.dataLayer.push(args)
      }
      window.gtag = gtag

      // Configure GA4
      gtag('js', new Date())
      gtag('config', gaId, {
        page_title: document.title,
        page_location: window.location.href
      })
    }

    // Use useHead to inject GA4 script
    useHead({
      script: [
        // Google Analytics 4
        {
          src: `https://www.googletagmanager.com/gtag/js?id=${gaId}`,
          async: true
        }
      ]
    })

    isInitialized.value = true
  }

  const loadFromSettings = async () => {
    try {
      // For now, use hardcoded GTM ID from database until API is working
      const googleTagManagerId = 'GTM-T89X4CKH' // From database

      // Initialize GTM
      if (googleTagManagerId && googleTagManagerId.trim()) {
        initializeGTM(googleTagManagerId)
      }

      // TODO: Load from API when tRPC is working
      /*
      const nuxtApp = useNuxtApp()
      if (!nuxtApp.$trpc) {
        throw new Error('tRPC not available')
      }
      const { $trpc } = nuxtApp

      const settings = await $trpc.settings.getPublicSettings.query()

      const googleTagManagerId = settings.find((s: any) => s.key === 'google_tag_manager_id')?.value
      const googleAnalyticsId = settings.find((s: any) => s.key === 'google_analytics_id')?.value

      // Initialize GTM first if available
      if (googleTagManagerId && googleTagManagerId.trim()) {
        initializeGTM(googleTagManagerId)
      } 
      // Otherwise initialize GA4 if available
      else if (googleAnalyticsId && googleAnalyticsId.trim()) {
        initializeGA4(googleAnalyticsId)
      }
      */

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      console.error('Google Analytics: Error loading settings:', err)
    }
  }

  // Auto-initialize on client side
  onMounted(() => {
    if (process.client && !isInitialized.value) {
      loadFromSettings()
    }
  })

  return {
    isInitialized,
    error,
    loadFromSettings,
    initializeGTM,
    initializeGA4
  }
}

// Global type declarations
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}
