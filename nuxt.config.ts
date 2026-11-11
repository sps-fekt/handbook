import { execSync } from 'node:child_process'
import { site } from './site'

// Short hash of the commit the site is built from, shown in the footer when the
// content's own commit isn't known (in development). Empty without git.
function commitHash() {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  }
  catch {
    return ''
  }
}

// Příručka prváka on the comark-docs layer (https://github.com/comarkdown/comark-docs).
// Pages are rendered on the server at request time, no static generation:
// in development from content/ on disk, in production from the GitHub repo.
export default defineNuxtConfig({
  extends: ['comark-docs'],

  site: {
    url: 'https://prirucka.sps-fekt.cz',
    name: site.name,
    description: site.description,
    defaultLocale: 'en',
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      commit: commitHash(),
    },
  },

  // Czech under /cs (content/cs/), English under /en (content/en/); English is
  // the default; / and /translations redirect to the visitor's language
  // (server/middleware/language.ts). Czech stays the source of the content.
  // The layer's page routes stay unlocalised: its content lookup reads the
  // whole path, language prefix included.
  modules: ['@nuxtjs/i18n', '@vite-pwa/nuxt'],
  i18n: {
    baseUrl: 'https://prirucka.sps-fekt.cz',
    defaultLocale: 'en',
    strategy: 'prefix',
    locales: [
      { code: 'cs', language: 'cs', name: 'Čeština', file: 'cs.json' },
      { code: 'en', language: 'en', name: 'English', file: 'en.json' },
    ],
    customRoutes: 'config',
    pages: { 'index': false, 'slug': false, 'lang': false },
    // Done by server/middleware/language.ts instead: the layer owns /, so the
    // module's detection never runs there.
    detectBrowserLanguage: false,
  },

  // Installable as an app, and readable offline. The site's files are saved
  // when the service worker installs; pages and their content are loaded from
  // the network, with the last copy kept for offline use.
  // app/plugins/offline.client.ts saves every page of the language up front.
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: site.name,
      short_name: site.shortName,
      description: site.description,
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: site.color,
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      // Pages are rendered on the server, there's no app shell to fall back to.
      navigateFallback: null,
      globPatterns: ['**/*.{js,css,png,svg,ico,webp,woff2}'],
      runtimeCaching: [{
        urlPattern: ({ sameOrigin, url }) => sameOrigin && !url.pathname.startsWith('/api/assistant'),
        handler: 'NetworkFirst',
        options: { cacheName: 'pages', networkTimeoutSeconds: 5, matchOptions: { ignoreVary: true } },
      }],
    },
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
