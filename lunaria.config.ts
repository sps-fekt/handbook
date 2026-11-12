import { defineConfig } from '@lunariajs/core/config'

// Translation tracking, shown at /cs/translations (app/pages/translations.vue).
// The server runs Lunaria on the first visit and after every push
// (server/utils/translations.ts, server/api/webhook.post.ts).
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
})
