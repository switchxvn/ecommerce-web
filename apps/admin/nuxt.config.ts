import { defineNuxtConfig } from 'nuxt/config';
import { resolve } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineNuxtConfig({
  srcDir: 'src',
  devtools: { enabled: true },

  build: {
    transpile: ['@ew/shared']
  },

  devServer: {
    host: process.env.ADMIN_NUXT_HOST || process.env.NUXT_HOST || 'localhost',
    port: process.env.ADMIN_NUXT_PORT
      ? parseInt(process.env.ADMIN_NUXT_PORT)
      : process.env.NUXT_PORT
        ? parseInt(process.env.NUXT_PORT)
        : 4300,
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || process.env.ADMIN_API_BASE || 'http://localhost:3333'
    },
  },

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/color-mode',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n',
  ],

  plugins: [
    '~/plugins/trpc',
    '~/plugins/toast',
    '~/plugins/theme',
    '~/plugins/i18n',
  ],

  imports: {
    dirs: ['composables/**']
  },

  // @ts-expect-error - i18n module types
  i18n: {
    vueI18n: './i18n.config.ts'
  },

  app: {
    baseURL: process.env.ADMIN_BASE_URL || process.env.NUXT_APP_BASE_URL || '/',
    head: {
      title: 'Admin Dashboard',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Admin Dashboard for E-commerce Website' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  css: [
    '~/assets/scss/main.scss',
    '@vueup/vue-quill/dist/vue-quill.snow.css'
  ],

  vite: {
    plugins: [tsconfigPaths()],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/scss/abstracts/_variables.scss" as *;'
        }
      }
    },
    server: {
      proxy: {
        '/api/trpc': {
          target: process.env.NUXT_PUBLIC_API_BASE || process.env.ADMIN_API_BASE || 'http://localhost:3333',
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path
        }
      },
    },
    resolve: {
      alias: {
        '@ew/shared': resolve(__dirname, '../../libs/shared/src')
      }
    }
  },

  // @ts-expect-error - colorMode config is valid
  colorMode: {
    classSuffix: '',
    preference: 'light',
    fallback: 'light',
    storage: 'localStorage'
  },

  ui: {
    global: true,
    icons: {
      dynamic: true,
      families: {
        heroicons: {
          outline: true,
          solid: true,
          mini: true
        }
      }
    },
    notifications: {
      position: 'top-right'
    }
  },

  typescript: {
    strict: true,
    shim: false
  },

  compatibilityDate: '2025-04-04',

  alias: {
    '@ew/shared': '../../libs/shared/src'
  },
})
