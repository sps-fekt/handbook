import { site } from './site'

// Příručka prváka on the comark-docs layer (https://github.com/comarkdown/comark-docs).
// Pages are rendered on the server at request time, no static generation:
// in development from content/ on disk, in production from the GitHub repo.
export default defineNuxtConfig({
  extends: ['comark-docs'],

  site: {
    url: 'https://prirucka.sps-fekt.cz',
    name: site.name,
    description: site.description,
    defaultLocale: 'cs',
  },

  css: ['~/assets/css/main.css'],

  // Czech at /, English under /en (content/en/). The layer's page routes stay
  // unlocalised: its content lookup reads the whole path, /en included.
  modules: ['@nuxtjs/i18n'],
  i18n: {
    baseUrl: 'https://prirucka.sps-fekt.cz',
    defaultLocale: 'cs',
    strategy: 'prefix_except_default',
    locales: [
      { code: 'cs', language: 'cs-CZ', name: 'Čeština', file: 'cs.json' },
      { code: 'en', language: 'en', name: 'English', file: 'en.json' },
    ],
    customRoutes: 'config',
    pages: { 'index': false, 'slug': false, 'en': false },
    detectBrowserLanguage: false,
  },

  llms: {
    domain: 'https://prirucka.sps-fekt.cz',
  },

  app: {
    head: {
      meta: [{ name: 'theme-color', content: site.color }],
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },
})
