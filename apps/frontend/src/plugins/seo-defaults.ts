export default defineNuxtPlugin({
  name: 'seo-defaults',
  enforce: 'pre', // Run before other plugins
  setup() {
    useHead({
      htmlAttrs: {
        lang: 'vi'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' }
      ]
    });

    // Set default SEO meta
    useSeoMeta({
      ogType: 'website',
      twitterCard: 'summary_large_image'
    });
  }
}); 
