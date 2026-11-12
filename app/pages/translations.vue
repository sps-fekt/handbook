<!-- Translation status at /cs/translations and /en/translations, from Lunaria
     (lunaria.config.ts), run by the server (server/utils/translations.ts). As in
     Lunaria's own dashboard: progress per language, then a row per Czech page
     with a column per language saying whether its translation is done,
     outdated (the Czech page changed since) or missing, with links to fix it
     on GitHub. A language added in lunaria.config.ts gets its own column. -->
<script setup lang="ts">
interface Commit { hash: string, date: string, message: string }
type Status = 'up-to-date' | 'outdated' | 'missing'
interface Entry {
  source: { path: string, git: { latestTrackedCommit: Commit } }
  localizations: { path: string, lang: string, status: Status, git?: { latestTrackedCommit: Commit } }[]
}

const { github } = useAppConfig()
const repo = `https://github.com/${github?.owner}/${github?.name}`
const branch = github?.branch || 'main'
const { data: status } = await useFetch<Entry[]>('/api/translations')
const data = computed(() => status.value ?? [])

const { t, locale } = useI18n()
const colors = { 'up-to-date': 'success', 'outdated': 'warning', 'missing': 'error' } as const

const languages = computed(() => [...new Set(data.value.flatMap((entry) => entry.localizations.map((loc) => loc.lang)))])
// The language's name in the reader's language, e.g. "Angličtina" / "English".
const languageName = (lang: string) => {
  const name = new Intl.DisplayNames([locale.value], { type: 'language' }).of(lang) ?? lang
  return name.charAt(0).toLocaleUpperCase(locale.value) + name.slice(1)
}

// content/cs/1.getting-started/1.welcome.md → /cs/getting-started/welcome
const pagePath = (file: string) => file.replace(/^content/, '').replace(/\/\d+\./g, '/').replace(/(\/index)?\.md$/, '')

const rows = computed(() => data.value.map(({ source, localizations }) => {
  return {
    page: pagePath(source.path),
    cells: Object.fromEntries(localizations.map((loc) => [loc.lang, {
      status: loc.status,
      // Outdated: what changed in Czech since the translation was last updated.
      changes: loc.status === 'outdated' && loc.git
        ? `${repo}/compare/${loc.git.latestTrackedCommit.hash}...${source.git.latestTrackedCommit.hash}`
        : undefined,
      fix: loc.status === 'missing' ? `${repo}/new/${branch}?filename=${loc.path}` : `${repo}/edit/${branch}/${loc.path}`,
    }])),
  }
}))

const summaries = computed(() => languages.value.map((lang) => {
  const statuses = rows.value.map((row) => row.cells[lang]?.status)
  const count = (status: Status) => statuses.filter((s) => s === status).length
  return { lang, total: statuses.length, done: count('up-to-date'), outdated: count('outdated'), missing: count('missing') }
}))

const columns = computed(() => [
  { accessorKey: 'page', header: t('translations.page') },
  ...languages.value.map((lang) => ({ id: lang, header: languageName(lang) })),
])

useSeoMeta({ title: () => t('translations.title'), robots: 'noindex' })
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="t('translations.title')"
        :description="t('translations.description')"
      />

      <UPageBody>
        <div
          v-for="summary in summaries"
          :key="summary.lang"
          class="flex flex-col gap-2"
        >
          <p class="text-sm text-muted">
            <span class="font-medium text-highlighted">{{ languageName(summary.lang) }}:</span>
            {{ t('translations.summary', summary) }}
          </p>
          <UProgress
            :model-value="summary.done"
            :max="summary.total || 1"
          />
        </div>

        <UTable
          :data="rows"
          :columns="columns"
        >
          <template #page-cell="{ row }">
            <ULink
              :to="row.original.page"
              class="font-medium"
            >
              {{ row.original.page }}
            </ULink>
          </template>

          <template
            v-for="lang in languages"
            :key="lang"
            #[`${lang}-cell`]="{ row }"
          >
            <div
              v-if="row.original.cells[lang]"
              class="flex items-center gap-1.5"
            >
              <UBadge
                :label="t(`translationStatus.${row.original.cells[lang].status}`)"
                :color="colors[row.original.cells[lang].status]"
                variant="subtle"
                class="mr-1.5"
              />
              <UTooltip
                v-if="row.original.cells[lang].changes"
                :text="t('translations.changes')"
              >
                <UButton
                  :to="row.original.cells[lang].changes"
                  target="_blank"
                  icon="i-lucide-file-diff"
                  color="neutral"
                  variant="outline"
                  :ui="{ leadingIcon: 'size-4' }"
                  class="p-2"
                  :aria-label="t('translations.changes')"
                />
              </UTooltip>
              <UTooltip :text="t(row.original.cells[lang].status === 'missing' ? 'translations.create' : 'translations.edit')">
                <UButton
                  :to="row.original.cells[lang].fix"
                  target="_blank"
                  :icon="row.original.cells[lang].status === 'missing' ? 'i-lucide-file-plus' : 'i-lucide-pencil'"
                  color="neutral"
                  variant="outline"
                  :ui="{ leadingIcon: 'size-4' }"
                  class="p-2"
                  :aria-label="t(row.original.cells[lang].status === 'missing' ? 'translations.create' : 'translations.edit')"
                />
              </UTooltip>
            </div>
          </template>
        </UTable>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
