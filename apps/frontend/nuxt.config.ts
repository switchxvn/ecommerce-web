import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineNuxtConfig } from 'nuxt/config';
import i18nConfig from './i18n.config';
import { ROUTE_NAMES, ROUTE_PATHS } from './src/utils/routes';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  workspaceDir: '../../',
  srcDir: 'src',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  ignore: ['**/*.js.map', '**/*.js'],

  devServer: {
    host: process.env.FRONTEND_NUXT_HOST || process.env.NUXT_HOST || 'localhost',
    port: process.env.FRONTEND_NUXT_PORT
      ? parseInt(process.env.FRONTEND_NUXT_PORT)
      : process.env.NUXT_PORT
        ? parseInt(process.env.NUXT_PORT)
        : 4200,
  },

  nitro: {
    experimental: {
      wasm: true
    },
    routeRules: {
      '/_nuxt/**': {
        headers: {
          'cache-control': 'public, max-age=31536000, immutable'
        }
      },
      '/_ipx/**': {
        headers: {
          'cache-control': 'public, max-age=2592000, stale-while-revalidate=604800'
        }
      },
      '/fonts/**': {
        headers: {
          'cache-control': 'public, max-age=31536000, immutable'
        }
      },
      '/images/**': {
        headers: {
          'cache-control': 'public, max-age=2592000, stale-while-revalidate=604800'
        }
      },
      '/favicon.ico': {
        headers: {
          'cache-control': 'public, max-age=2592000, stale-while-revalidate=604800'
        }
      },
      '/robots.txt': {
        headers: {
          'cache-control': 'public, max-age=3600, stale-while-revalidate=86400'
        }
      },
      '/sitemap.xml': {
        headers: {
          'cache-control': 'public, max-age=3600, stale-while-revalidate=86400'
        }
      }
    },
    esbuild: {
      options: {
        target: 'node18'
      }
    },
    preset: 'node-server'
  },

  components: {
    extensions: ['vue'],
    dirs: [
      {
        path: '~/components',
        pathPrefix: false,
      },
      {
        path: '~/components/common',
        pathPrefix: false,
      },
      {
        path: '~/components/cards',
        pathPrefix: false,
      },
      {
        path: '~/components/product',
        pathPrefix: false,
      },
      {
        path: '~/components/category',
        pathPrefix: false,
      },
      {
        path: '~/components/sections',
        pathPrefix: false,
      },
      {
        path: '~/components/media',
        pathPrefix: false,
      },
      {
        path: '~/components/sliders',
        pathPrefix: false,
      },
      {
        path: '~/components/ui',
        pathPrefix: false,
      },
      {
        path: '~/components/cart',
        pathPrefix: false,
      },
      {
        path: '~/components/sidebar',
        pathPrefix: false,
      },
      {
        path: '~/components/settings',
        pathPrefix: false,
      },
      {
        path: '~/components/form',
        pathPrefix: false,
      }
    ],
  },

  hooks: {
    'pages:extend'(routes) {
      const postsListRoute = routes.find(r => r.path === ROUTE_PATHS.POSTS_LIST.en);
      const postsDetailRoute = routes.find(r => r.path.startsWith(ROUTE_PATHS.POSTS_LIST.en + '/'));
      const productListRoute = routes.find(r => r.path === ROUTE_PATHS.PRODUCTS_LIST.en);
      const productDetailRoute = routes.find(r => r.path.startsWith(ROUTE_PATHS.PRODUCTS_LIST.en + '/'));
      const serviceListRoute = routes.find(r => r.path === ROUTE_PATHS.SERVICES_LIST.en);
      const serviceDetailRoute = routes.find(r => r.path.startsWith(ROUTE_PATHS.SERVICES_LIST.en + '/'));
      const categoriesListRoute = routes.find(r => r.path === ROUTE_PATHS.CATEGORIES_LIST.en);
      const categoryDetailRoute = routes.find(r => r.path.startsWith(ROUTE_PATHS.CATEGORIES_LIST.en + '/'));
      const contactRoute = routes.find(r => r.path === ROUTE_PATHS.CONTACT.en);
      const galleryRoute = routes.find(r => r.path === ROUTE_PATHS.GALLERY.en);
      const aboutRoute = routes.find(r => r.path === ROUTE_PATHS.ABOUT.en);
      const ticketPricingRoute = routes.find(r => r.path === ROUTE_PATHS.TICKET_PRICING.en);
      const menuRoute = routes.find(r => r.path === ROUTE_PATHS.MENU.en);
      const orderTicketRoute = routes.find(r => r.path === ROUTE_PATHS.ORDER_TICKET.en);
      if (postsListRoute) {
        routes.push({
          name: ROUTE_NAMES.POSTS_LIST.vi,
          path: ROUTE_PATHS.POSTS_LIST.vi,
          file: postsListRoute.file
        });
      }

      if (postsDetailRoute) {
        routes.push({
          name: ROUTE_NAMES.POST_DETAIL.vi,
          path: ROUTE_PATHS.POST_DETAIL.vi,
          file: postsDetailRoute.file,
          meta: postsDetailRoute.meta
        });
      }

      if (productListRoute) {
        routes.push({
          name: ROUTE_NAMES.PRODUCTS_LIST.vi,
          path: ROUTE_PATHS.PRODUCTS_LIST.vi,
          file: productListRoute.file
        });
      }

      if (productDetailRoute) {
        routes.push({
          name: ROUTE_NAMES.PRODUCT_DETAIL.vi,
          path: ROUTE_PATHS.PRODUCT_DETAIL.vi,
          file: productDetailRoute.file,
          meta: productDetailRoute.meta
        });
      }

      if (serviceListRoute) {
        routes.push({
          name: ROUTE_NAMES.SERVICES_LIST.vi,
          path: ROUTE_PATHS.SERVICES_LIST.vi,
          file: serviceListRoute.file
        });
      }

      if (serviceDetailRoute) {
        routes.push({
          name: ROUTE_NAMES.SERVICE_DETAIL.vi,
          path: ROUTE_PATHS.SERVICE_DETAIL.vi,
          file: serviceDetailRoute.file,
          meta: serviceDetailRoute.meta
        });
      }

      if (categoriesListRoute) {
        routes.push({
          name: ROUTE_NAMES.CATEGORIES_LIST.vi,
          path: ROUTE_PATHS.CATEGORIES_LIST.vi,
          file: categoriesListRoute.file
        });
      }

      if (categoryDetailRoute) {
        routes.push({
          name: ROUTE_NAMES.CATEGORY_DETAIL.vi,
          path: ROUTE_PATHS.CATEGORY_DETAIL.vi,
          file: categoryDetailRoute.file,
          meta: categoryDetailRoute.meta
        });
      }

      if (contactRoute) {
        routes.push({
          name: ROUTE_NAMES.CONTACT.vi,
          path: ROUTE_PATHS.CONTACT.vi,
          file: contactRoute.file,
          meta: contactRoute.meta
        });
      }

      if (galleryRoute) {
        routes.push({
          name: ROUTE_NAMES.GALLERY.vi,
          path: ROUTE_PATHS.GALLERY.vi,
          file: galleryRoute.file
        });
      }

      if (aboutRoute) {
        routes.push({
          name: ROUTE_NAMES.ABOUT.vi,
          path: ROUTE_PATHS.ABOUT.vi,
          file: aboutRoute.file
        });
      }

      if (ticketPricingRoute) {
        routes.push({
          name: ROUTE_NAMES.TICKET_PRICING.vi,
          path: ROUTE_PATHS.TICKET_PRICING.vi,
          file: ticketPricingRoute.file
        });
      }

      if (menuRoute) {
        routes.push({
          name: ROUTE_NAMES.MENU.vi,
          path: ROUTE_PATHS.MENU.vi,
          file: menuRoute.file
        });
      }

      if (orderTicketRoute) {
        routes.push({
          name: ROUTE_NAMES.ORDER_TICKET.vi,
          path: ROUTE_PATHS.ORDER_TICKET.vi,
          file: orderTicketRoute.file
        });
      }
    }
  },

  typescript: {
    strict: true,
    typeCheck: false,
    shim: false,
    tsConfig: {
      extends: './nuxt.tsconfig.json',
      compilerOptions: {
        module: 'esnext',
        target: 'esnext',
      }
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || process.env.FRONTEND_API_BASE || process.env.API_BASE || 'http://localhost:3333',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || process.env.FRONTEND_SITE_URL || process.env.SITE_URL || 'http://localhost:4200',
      siteName: process.env.NUXT_PUBLIC_SITE_NAME || process.env.FRONTEND_SITE_NAME || process.env.SITE_NAME || 'Ecommerce Web',
    },
  },

  imports: {
    exclude: [
      /useVueComposables/,
    ],
    dirs: [
      'composables',
      'composables/*/index.{ts,js,mjs,mts}',
      'composables/**'
    ],
    presets: [
      {
        from: 'vue',
        imports: []
      }
    ]
  },

  css: [
    '@/assets/styles/main.scss',
    'photoswipe/style.css'
  ],
  
  postcss: {
    plugins: {
      'postcss-import': {},
      'tailwindcss/nesting': 'postcss-nesting',
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  // Cấu hình router cho Nuxt 3
  router: {
    options: {
      strict: false
    }
  },

  // Cấu hình i18n
  modules: [
    '@nuxtjs/i18n',
    '@nuxt/ui',
    '@nuxt/image',
    '@pinia/nuxt',
  ],

  ui: {
    colorMode: false,
  },

  plugins: [
    '~/plugins/trpc',
    '~/plugins/gtm.server',
  ],

  i18n: {
    ...i18nConfig,
    bundle: {
      optimizeTranslationDirective: false,
    },
  },

  vite: {
    plugins: [nxViteTsPaths()],
    optimizeDeps: {
      include: ['@trpc/client', '@trpc/server', 'photoswipe', 'estree-walker'],
      exclude: ['entities'],
      esbuildOptions: {
        target: 'es2020'
      }
    },
    build: {
      target: 'es2020',
      rollupOptions: {
        output: {
          manualChunks: {
            photoswipe: ['photoswipe']
          }
        }
      },
      cssCodeSplit: true,
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true
      }
    },
    ssr: {
      noExternal: ['entities', 'photoswipe']
    },
    vue: {
      script: {
        defineModel: true,
        propsDestructure: true,
      }
    },
    server: {
      proxy: {
        '/api/trpc': {
          target: process.env.NUXT_PUBLIC_API_BASE || process.env.FRONTEND_API_BASE || process.env.API_BASE || 'http://localhost:3333',
          changeOrigin: true,
          rewrite: (path) => path,
        },
      },
      allowedHosts: process.env.ALLOWED_HOSTS ? process.env.ALLOWED_HOSTS.split(',') : [],
    },
    resolve: {
      alias: {
        '@ew/shared': '../../libs/shared/src/index.ts'
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/styles/base/_variables.scss" as *;'
        }
      }
    }
  },

  compatibilityDate: '2025-03-03',

  app: {
    spaLoadingTemplate: '~/app/spa-loading-template.html',
    head: {
      titleTemplate: '%s',
      title: 'Ecommerce Web - Trang thương mại điện tử',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'robots', content: 'index, follow' },
        { name: 'description', content: 'Khám phá các sản phẩm chất lượng cao. Mua sắm online dễ dàng, giao hàng nhanh chóng.' },
        { name: 'keywords', content: 'thương mại điện tử, mua sắm online, sản phẩm chất lượng' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'Ecommerce Web - Trang thương mại điện tử' },
        { property: 'og:description', content: 'Khám phá các sản phẩm chất lượng cao. Mua sắm online dễ dàng, giao hàng nhanh chóng.' },
        { property: 'og:image', content: '/images/og-default.jpg' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Ecommerce Web - Trang thương mại điện tử' },
        { name: 'twitter:description', content: 'Khám phá các sản phẩm chất lượng cao. Mua sắm online dễ dàng, giao hàng nhanh chóng.' },
        { name: 'twitter:image', content: '/images/og-default.jpg' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    },
    pageTransition: { name: 'page', mode: 'out-in' }
  },

  image: {
    provider: 'ipx',
    dir: 'public',
    quality: 75,
    formats: ['webp', 'avif'],
    domains: ['cdn.mgavietnam.com', 'cdn.captreonuisam.com', 'images.unsplash.com'],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
  },

  // Enable detailed error pages in production
  errorHandler: '~/error',

  // Enable source maps in production for better error tracking
  sourcemap: true,

  experimental: {
    componentIslands: true
  },

  build: {
    transpile: ['vue', 'estree-walker', 'photoswipe']
  },
});
