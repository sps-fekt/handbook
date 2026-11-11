import { defineConfig } from '@lunariajs/core/config'

// Translation tracking. `npm run build` writes the dashboard to
// public/translations/ before `nuxt build`, so the site serves it at
// /translations/; `npm run lunaria` refreshes it in development.
//
// A page is "outdated" when content/cs/<page>.md got a commit after the last
// commit to content/en/<page>.md; the dashboard links to the diff of what
// changed in Czech since. Commits whose message contains "lunaria-ignore" or
// "fix typo" don't count, for Czech changes that need no translation, e.g.
// "Oprava překlepu (lunaria-ignore)".
export default defineConfig({
  repository: {
    name: 'sps-fekt/handbook',
    branch: 'main',
    hosting: 'github',
  },
  sourceLocale: {
    label: 'Čeština',
    lang: 'cs',
  },
  locales: [
    {
      label: 'English',
      lang: 'en',
    },
  ],
  files: [
    {
      include: ['content/cs/**/*.md'],
      pattern: 'content/@lang/@path',
      type: 'universal',
    },
  ],
  outDir: './public/translations',
  // In Czech and in the site's look (lunaria/dashboard.css), with its header.
  dashboard: {
    title: 'Stav překladu',
    description: 'Které stránky Příručky prváka je potřeba přeložit nebo aktualizovat.',
    site: 'https://prirucka.sps-fekt.cz/translations/',
    basesToHide: ['content/cs/', 'content/en/'],
    customCss: ['./lunaria/dashboard.css'],
    favicon: { inline: './public/favicon.svg' },
    ui: {
      'lang': 'cs',
      'status.done': 'hotovo',
      'status.outdated': 'zastaralé',
      'status.missing': 'chybí',
      'statusByLocale.heading': 'Postup podle jazyka',
      'statusByLocale.outdatedLocalizationLink': 'zastaralý překlad',
      'statusByLocale.incompleteLocalizationLink': 'neúplný překlad',
      'statusByLocale.createFileLink': 'Vytvořit soubor',
      'statusByLocale.sourceChangeHistoryLink': 'historie změn originálu',
      'statusByLocale.missingKeys': 'Chybějící klíče',
      'statusByLocale.completeLocalization': 'Překlad je kompletní, skvělá práce! 🎉',
      'statusByFile.heading': 'Stav podle souboru',
      'statusByFile.tableRowFile': 'Soubor',
    },
  },
  renderer: {
    slots: {
      beforeTitle: () => `
        <header class="site-header">
          <a class="brand" href="/cs">Příručka prváka</a>
          <a class="back" href="/cs/about/contributing">Jak přispívat →</a>
        </header>`,
    },
  },
})
