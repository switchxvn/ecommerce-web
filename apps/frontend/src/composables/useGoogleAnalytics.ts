import { ref } from 'vue'
import { useHead } from '#imports'

export const useGoogleAnalytics = () => {
  const isInitialized = ref(false)
  const error = ref<string | null>(null)

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

  return {
    isInitialized,
    error,
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
