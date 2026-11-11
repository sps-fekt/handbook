// / and /translations open the handbook in the visitor's language: the one
// they last picked in the language switch (the `lang` cookie, set by
// LanguageSwitch.vue), else Czech for a Czech or Slovak browser, else English.
// Done here because the comark-docs layer owns /, where @nuxtjs/i18n's own
// browser detection never runs.
const LANGS = ['cs', 'en'] as const

function fromBrowser(header = '') {
  const preferred = header.split(',')
    .map((part) => {
      const [tag = '', q] = part.trim().split(';q=')
      return { lang: tag.toLowerCase().split('-')[0], q: q ? Number(q) : 1 }
    })
    .sort((a, b) => b.q - a.q)
  for (const { lang } of preferred) {
    if (lang === 'cs' || lang === 'sk') return 'cs'
    if (lang === 'en') return 'en'
  }
  return 'en'
}

export default defineEventHandler((event) => {
  const [path, query] = event.path.split('?')
  if (path !== '/' && path !== '/translations') return

  const saved = getCookie(event, 'lang')
  const lang = LANGS.find((l) => l === saved) ?? fromBrowser(getRequestHeader(event, 'accept-language'))

  // The answer depends on the visitor, so caches must not share it.
  setResponseHeader(event, 'Vary', 'Accept-Language, Cookie')
  setResponseHeader(event, 'Cache-Control', 'private, no-cache')
  const target = path === '/' ? `/${lang}` : `/${lang}/translations`
  return sendRedirect(event, query ? `${target}?${query}` : target, 302)
})
