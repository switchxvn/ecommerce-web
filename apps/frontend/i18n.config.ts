export default {
  restructureDir: 'src',
  lazy: true,
  langDir: 'i18n/locales',
  defaultLocale: 'vi',
  locales: [
    {
      code: 'vi',
      name: 'Tiếng Việt',
      file: 'vi.json',
    },
    {
      code: 'en',
      name: 'English',
      file: 'en.json',
    },
  ],
  strategy: 'no_prefix',
  detectBrowserLanguage: false,
  vueI18n: './i18n/vue-i18n.config.ts'
}
