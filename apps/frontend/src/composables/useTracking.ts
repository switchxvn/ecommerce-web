export const useTracking = () => {
  const { $gtag, $fbq, $trackEvent, $trackConversion } = useNuxtApp()
  const pushToDataLayer = (event: Record<string, any>) => {
    if (typeof window === 'undefined') {
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(event);
  };

  // Track page view
  const trackPageView = (page_title?: string, page_location?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title,
        page_location: page_location || window.location.href
      })
    } else {
      pushToDataLayer({
        event: 'page_view',
        page_title,
        page_location: page_location || window.location.href
      });
    }
    
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView')
    }
  }

  // Track e-commerce events
  const trackPurchase = (transactionId: string, value: number, currency: string = 'VND', items: any[] = []) => {
    // Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: transactionId,
        value: value,
        currency: currency,
        items: items
      })
    } else {
      pushToDataLayer({
        event: 'purchase',
        transaction_id: transactionId,
        value,
        currency,
        items
      });
    }

    // Facebook Pixel
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Purchase', {
        value: value,
        currency: currency,
        content_ids: items.map(item => item.item_id),
        content_type: 'product'
      })
    }

    // Google Ads Conversion
    if ($trackConversion && typeof $trackConversion === 'function') {
      // This will use the settings from the plugin
      $trackConversion('purchase', undefined, value)
    }
  }

  const trackAddToCart = (itemId: string, itemName: string, value: number, currency: string = 'VND') => {
    const items = [{
      item_id: itemId,
      item_name: itemName,
      quantity: 1,
      price: value
    }];

    // Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: currency,
        value: value,
        items
      })
    } else {
      pushToDataLayer({
        event: 'add_to_cart',
        currency,
        value,
        items
      });
    }

    // Facebook Pixel
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', {
        value: value,
        currency: currency,
        content_ids: [itemId],
        content_type: 'product'
      })
    }

    // Google Ads Conversion
    if ($trackConversion && typeof $trackConversion === 'function') {
      $trackConversion('add_to_cart', undefined, value)
    }
  }

  const trackBeginCheckout = (value: number, currency: string = 'VND', items: any[] = []) => {
    // Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'begin_checkout', {
        currency: currency,
        value: value,
        items: items
      })
    } else {
      pushToDataLayer({
        event: 'begin_checkout',
        currency,
        value,
        items
      });
    }

    // Facebook Pixel
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        value: value,
        currency: currency,
        content_ids: items.map(item => item.item_id),
        content_type: 'product'
      })
    }

    // Google Ads Conversion
    if ($trackConversion && typeof $trackConversion === 'function') {
      $trackConversion('begin_checkout', undefined, value)
    }
  }

  const trackViewItem = (itemId: string, itemName: string, category: string, value: number, currency: string = 'VND') => {
    const items = [{
      item_id: itemId,
      item_name: itemName,
      item_category: category,
      quantity: 1,
      price: value
    }];

    // Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_item', {
        currency: currency,
        value: value,
        items
      })
    } else {
      pushToDataLayer({
        event: 'view_item',
        currency,
        value,
        items
      });
    }

    // Facebook Pixel
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'ViewContent', {
        value: value,
        currency: currency,
        content_ids: [itemId],
        content_type: 'product'
      })
    }
  }

  const trackSearch = (searchTerm: string) => {
    // Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'search', {
        search_term: searchTerm
      })
    } else {
      pushToDataLayer({
        event: 'search',
        search_term: searchTerm
      });
    }

    // Facebook Pixel
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Search', {
        search_string: searchTerm
      })
    }
  }

  const trackLead = (value?: number, currency: string = 'VND') => {
    const eventData: any = { event_category: 'engagement' }
    if (value) {
      eventData.value = value
      eventData.currency = currency
    }

    // Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'generate_lead', eventData)
    } else {
      pushToDataLayer({
        event: 'generate_lead',
        ...eventData
      });
    }

    // Facebook Pixel
    if (typeof window !== 'undefined' && window.fbq) {
      const eventData: any = {}
      if (value) {
        eventData.value = value
        eventData.currency = currency
      }
      window.fbq('track', 'Lead', eventData)
    }
  }

  const trackContact = () => {
    // Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'contact', {
        event_category: 'engagement'
      })
    } else {
      pushToDataLayer({
        event: 'contact',
        event_category: 'engagement'
      });
    }

    // Facebook Pixel
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Contact')
    }
  }

  // Custom event tracking
  const trackCustomEvent = (eventName: string, parameters?: any) => {
    if ($trackEvent && typeof $trackEvent === 'function') {
      $trackEvent(eventName, parameters)
    }
  }

  return {
    trackPageView,
    trackPurchase,
    trackAddToCart,
    trackBeginCheckout,
    trackViewItem,
    trackSearch,
    trackLead,
    trackContact,
    trackCustomEvent
  }
} 
