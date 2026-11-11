import { defineConfig } from '@lunariajs/core/config'

// Translation tracking. `npm run build` writes the status to
// .lunaria/ before `nuxt build`, shown at /cs/translations
// (app/pages/translations.vue); `npm run lunaria` refreshes it in development.
//
// A page is "outdated" when content/cs/<page>.md got a commit after the last
// commit to content/en/<page>.md; /cs/translations links to the diff of what
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
  // Only the data is used: app/pages/translations.vue renders it at /cs/translations and /en/translations.
  outDir: './.lunaria',
})
