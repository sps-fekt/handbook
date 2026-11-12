import { execSync } from 'node:child_process'
import { site } from './site'

// Short hash of the commit the site is built from, shown in the footer when the
// deployed commit isn't known (in development, see server/api/version.get.ts). Empty without git.
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
    url: 'https://handbook.sps-fekt.cz',
    name: site.name,
    description: site.description,
    defaultLocale: 'en',
  },

  css: ['~/assets/css/main.css'],

  // The colour mode in a cookie instead of localStorage, so the server knows it:
  // the page comes in the right colours and the header's colour mode button
  // (AppHeader.vue) is rendered with the rest of the header.
  colorMode: {
    storage: 'cookie',
  },

  // Pages used to have Czech file names; old links keep working.
  routeRules: {
    '/cs/zaciname/vitej': { redirect: { to: '/cs/getting-started/welcome', statusCode: 301 } },
    '/cs/zaciname/prvni-dny-studia': { redirect: { to: '/cs/getting-started/first-days', statusCode: 301 } },
    '/cs/zaciname/co-to-vlastne-studuji': { redirect: { to: '/cs/getting-started/study-programmes', statusCode: 301 } },
    '/cs/zaciname/odstartuj-s-nami-semestr': { redirect: { to: '/cs/getting-started/semester-kickoff', statusCode: 301 } },
    '/cs/studium/system-vyuky': { redirect: { to: '/cs/studies/teaching', statusCode: 301 } },
    '/cs/studium/informacni-system': { redirect: { to: '/cs/studies/information-system', statusCode: 301 } },
    '/cs/studium/tipy-a-triky': { redirect: { to: '/cs/studies/tips-and-tricks', statusCode: 301 } },
    '/cs/studium/stipendia': { redirect: { to: '/cs/studies/scholarships', statusCode: 301 } },
    '/cs/studium/akademicke-funkce-a-tituly': { redirect: { to: '/cs/studies/academic-titles', statusCode: 301 } },
    '/cs/studium/socialni-bezpeci': { redirect: { to: '/cs/studies/wellbeing', statusCode: 301 } },
    '/cs/fakulta/dulezita-mista': { redirect: { to: '/cs/faculty/important-places', statusCode: 301 } },
    '/cs/fakulta/studentske-organizace': { redirect: { to: '/cs/faculty/student-organizations', statusCode: 301 } },
    '/cs/fakulta/discord': { redirect: { to: '/cs/faculty/discord', statusCode: 301 } },
    '/cs/fakulta/sport': { redirect: { to: '/cs/faculty/sports', statusCode: 301 } },
    '/cs/fakulta/fekt-merch': { redirect: { to: '/cs/faculty/merch', statusCode: 301 } },
    '/cs/zivot-v-brne/kde-slozit-hlavu': { redirect: { to: '/cs/life-in-brno/accommodation', statusCode: 301 } },
    '/cs/zivot-v-brne/jidlo-v-brne': { redirect: { to: '/cs/life-in-brno/food', statusCode: 301 } },
    '/cs/zivot-v-brne/jak-funguje-brno': { redirect: { to: '/cs/life-in-brno/transport', statusCode: 301 } },
    '/cs/zivot-v-brne/salinkarty': { redirect: { to: '/cs/life-in-brno/transit-passes', statusCode: 301 } },
    '/cs/zivot-v-brne/pre-slovakov': { redirect: { to: '/cs/life-in-brno/for-slovaks', statusCode: 301 } },
    '/cs/o-prirucce/tiraz': { redirect: { to: '/cs/about/credits', statusCode: 301 } },
    '/cs/o-prirucce/jak-prispivat': { redirect: { to: '/cs/about/contributing', statusCode: 301 } },
    '/en/o-prirucce/jak-prispivat': { redirect: { to: '/en/about/contributing', statusCode: 301 } },
  },

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
    baseUrl: 'https://handbook.sps-fekt.cz',
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
  // app/plugins/offline.client.ts saves every page up front.
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
        // / (the installed app's start page) and /translations only redirect
        // to the visitor's language (server/middleware/language.ts), and a
        // redirect can't be kept for offline use. Offline, the worker
        // redirects instead: to the language last picked (the lang cookie,
        // where the browser lets the worker read it), else the browser's,
        // else the other one, whichever page is saved.
        // Runs in the service worker as written: only browser globals.
        urlPattern: ({ sameOrigin, url, request }) => sameOrigin && request.mode === 'navigate' && ['/', '/translations'].includes(url.pathname),
        handler: async ({ request, url }) => {
          try {
            return await fetch(request)
          }
          catch {
            const saved = (await (self as any).cookieStore?.get('lang').catch(() => null))?.value
            const browser = navigator.languages.map((tag) => tag.toLowerCase().split('-')[0]).find((lang) => ['cs', 'sk', 'en'].includes(lang!))
            const czech = saved ? saved === 'cs' : browser === 'cs' || browser === 'sk'
            for (const lang of czech ? ['cs', 'en'] : ['en', 'cs']) {
              const target = `${url.origin}/${lang}${url.pathname === '/' ? '' : url.pathname}`
              if (await caches.match(target, { cacheName: 'pages', ignoreVary: true })) return Response.redirect(target, 302)
            }
            return Response.error()
          }
        },
      }, {
        urlPattern: ({ sameOrigin, url }) => sameOrigin && !url.pathname.startsWith('/api/assistant'),
        handler: 'NetworkFirst',
        options: { cacheName: 'pages', networkTimeoutSeconds: 5, matchOptions: { ignoreVary: true } },
      }],
    },
  },

  llms: {
    domain: 'https://handbook.sps-fekt.cz',
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
