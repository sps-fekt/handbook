import { cs as uiCs, en as uiEn } from '@nuxt/ui/locale'

// The handbook's UI language follows the page: English pages live under /en,
// everything else is Czech. Nuxt UI's own labels (search, "On this page",
// color mode…) come from its locales, passed to UApp in app.vue and error.vue;
// the labels below are the ones this app and the comark layer add.

export type SiteLang = 'cs' | 'en'

const messages = {
  cs: {
    siteName: 'Příručka prváka',
    openMenu: 'Otevřít menu',
    closeMenu: 'Zavřít menu',
    language: 'Jazyk: čeština',
    editOnGithub: 'Upravit na GitHubu',
    starOnGithub: 'Dát hvězdičku na GitHubu',
    openAsMarkdown: 'Otevřít jako Markdown',
    openInChat: 'Otevřít v chatu',
    copyActions: 'Otevřít nabídku kopírování',
    copyPrompt: 'Kopírovat prompt',
    promptCopied: 'Prompt zkopírován do schránky',
    copyPage: 'Kopírovat stránku',
    pageCopied: 'Stránka zkopírována do schránky',
    copyFailed: 'Stránku se nepodařilo zkopírovat.',
    openIn: 'Otevřít v {name}',
    aiPrompt: 'Přečti si {url}, ať se tě na ni můžu ptát.',
    notFoundTitle: 'Stránka nenalezena',
    notFoundDescription: 'Omlouváme se, ale tuto stránku se nepodařilo najít.',
  },
  en: {
    siteName: 'Freshman handbook',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    language: 'Language: English',
    editOnGithub: 'Edit this page on GitHub',
    starOnGithub: 'Star on GitHub',
    openAsMarkdown: 'Open as Markdown',
    openInChat: 'Open in Chat',
    copyActions: 'Open copy actions menu',
    copyPrompt: 'Copy prompt',
    promptCopied: 'Prompt copied to clipboard',
    copyPage: 'Copy page',
    pageCopied: 'Page copied to clipboard',
    copyFailed: 'Could not copy page.',
    openIn: 'Open in {name}',
    aiPrompt: 'Read {url} so I can ask questions about it.',
    notFoundTitle: 'Page not found',
    notFoundDescription: 'We are sorry but this page could not be found.',
  },
} satisfies Record<SiteLang, Record<string, string>>

export type MessageKey = keyof typeof messages.cs

export function useSiteLang() {
  const route = useRoute()
  const lang = computed<SiteLang>(() => (route.path === '/en' || route.path.startsWith('/en/') ? 'en' : 'cs'))
  const uiLocale = computed(() => (lang.value === 'en' ? uiEn : uiCs))

  function t(key: MessageKey, params: Record<string, string> = {}) {
    return messages[lang.value][key].replace(/\{(\w+)\}/g, (_, name: string) => params[name] ?? '')
  }

  return { lang, uiLocale, t }
}
