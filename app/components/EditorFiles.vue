<!-- The page editor's list of files (/cs/editor, app/pages/editor.vue): a row
     per Czech page, by its file in the language's folder of content/, with a
     column per language to open it in the editor. Translations also say
     whether they're done, outdated (the Czech page changed since) or missing,
     from Lunaria (lunaria.config.ts), run by the server
     (server/utils/translations.ts). A missing one opens as the Czech page, to
     translate. A language added in lunaria.config.ts gets its own column. -->
<script setup lang="ts">
interface Commit { hash: string, date: string, message: string }
type Status = 'up-to-date' | 'outdated' | 'missing'
interface Entry {
  source: { path: string, git: { latestTrackedCommit: Commit } }
  localizations: { path: string, lang: string, status: Status, git?: { latestTrackedCommit: Commit } }[]
}

const { github } = useAppConfig()
const repo = `https://github.com/${github?.owner}/${github?.name}`
const { data: status } = await useFetch<Entry[]>('/api/translations')
const data = computed(() => status.value ?? [])

const { t, locale } = useI18n()
const localePath = useLocalePath()
const colors = { 'up-to-date': 'success', 'outdated': 'warning', 'missing': 'error' } as const

// Czech is the source; then the translations.
const translations = computed(() => [...new Set(data.value.flatMap((entry) => entry.localizations.map((loc) => loc.lang)))])
const languages = computed(() => ['cs', ...translations.value])
// The language's name in the reader's language, e.g. "Angličtina" / "English".
const languageName = (lang: string) => {
  const name = new Intl.DisplayNames([locale.value], { type: 'language' }).of(lang) ?? lang
  return name.charAt(0).toLocaleUpperCase(locale.value) + name.slice(1)
}

// content/cs/2.studies/3.tips-and-tricks.md → 2.studies/3.tips-and-tricks.md
const relative = (path: string) => path.replace(/^content\/[a-z]{2}\//, '')
// 2.studies/3.tips-and-tricks.md: the folder (with its slash) and the name.
const folder = (file: string) => file.slice(0, file.lastIndexOf('/') + 1)
const name = (file: string) => file.slice(file.lastIndexOf('/') + 1)
const editorUrl = (lang: string, file: string) => ({ path: localePath('/editor'), query: { file: `${lang}/${file}` } })

const rows = computed(() => data.value.map(({ source, localizations }) => {
  const file = relative(source.path)
  return {
    file,
    cells: {
      cs: { status: undefined, changes: undefined, to: editorUrl('cs', file) },
      ...Object.fromEntries(localizations.map((loc) => [loc.lang, {
        status: loc.status,
        // Outdated: what changed in Czech since the translation was last updated.
        changes: loc.status === 'outdated' && loc.git
          ? `${repo}/compare/${loc.git.latestTrackedCommit.hash}...${source.git.latestTrackedCommit.hash}`
          : undefined,
        to: editorUrl(loc.lang, file),
      }])),
    } as Record<string, { status?: Status, changes?: string, to: ReturnType<typeof editorUrl> }>,
  }
}))


const columns = computed(() => [
  { accessorKey: 'file', header: t('editor.file') },
  ...languages.value.map((lang) => ({ id: lang, header: languageName(lang) })),
])

type LegendItem = { text: string, icon?: string, status?: Status }
const legend = computed<{ title: string, items: LegendItem[] }[]>(() => [
  { title: t('editor.legend.status'), items: [
    { status: 'up-to-date', text: t('editor.legend.done') },
    { status: 'outdated', text: t('editor.legend.outdated') },
    { status: 'missing', text: t('editor.legend.missing') },
  ] },
  { title: t('editor.legend.actions'), items: [
    { icon: 'i-lucide-pencil', text: t('editor.legend.edit') },
    { icon: 'i-lucide-file-plus', text: t('editor.legend.create') },
    { icon: 'i-lucide-file-diff', text: t('editor.legend.changes') },
  ] },
])

useSeoMeta({ title: () => t('editor.title'), robots: 'noindex, nofollow' })
</script>

<template>
  <UContainer>
    <UPage>
      <!-- In the header's middle on wide screens (AppHeader.vue), like an
           edited file: here then only for screen readers. -->
      <UPageHeader :title="t('editor.files')" class="lg:sr-only" />

      <UPageBody>
        <!-- Framed and compact; a file's folder above its name. A language's
             status first, the same width in each row, then its actions. -->
        <UTable
          :data="rows"
          :columns="columns"
          class="rounded-lg ring ring-default"
          :ui="{ thead: 'bg-elevated/50', th: 'py-2.5 max-sm:px-2', td: 'py-2 text-default max-sm:px-2 max-sm:whitespace-normal' }"
        >
          <template #file-cell="{ row }">
            <div class="font-mono text-sm leading-tight">
              <div
                v-if="folder(row.original.file)"
                class="text-xs text-dimmed"
              >
                {{ folder(row.original.file) }}
              </div>
              <!-- Breaking, when it must, after a hyphen or a dot. -->
              <div class="font-medium text-highlighted">
                <template
                  v-for="(part, i) in name(row.original.file).split(/(?<=[-.])/)"
                  :key="i"
                >{{ part }}<wbr></template>
              </div>
            </div>
          </template>

          <template
            v-for="lang in languages"
            :key="lang"
            #[`${lang}-cell`]="{ row }"
          >
            <div
              v-if="row.original.cells[lang]"
              class="flex items-center gap-1"
            >
              <!-- On a phone a coloured dot, to fit. -->
              <UBadge
                v-if="row.original.cells[lang].status"
                :label="t(`translationStatus.${row.original.cells[lang].status}`)"
                :color="colors[row.original.cells[lang].status!]"
                variant="subtle"
                :title="t(`translationStatus.${row.original.cells[lang].status}`)"
                class="shrink-0 justify-center max-sm:size-2.5 max-sm:rounded-full max-sm:p-0 max-sm:bg-current max-sm:text-[0px] max-sm:ring-0 sm:w-24"
              />
              <UTooltip :text="t(row.original.cells[lang].status === 'missing' ? 'translations.create' : 'translations.edit')">
                <UButton
                  :to="row.original.cells[lang].to"
                  :icon="row.original.cells[lang].status === 'missing' ? 'i-lucide-file-plus' : 'i-lucide-pencil'"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  :aria-label="t(row.original.cells[lang].status === 'missing' ? 'translations.create' : 'translations.edit')"
                />
              </UTooltip>
              <UTooltip
                v-if="row.original.cells[lang].changes"
                :text="t('translations.changes')"
              >
                <UButton
                  :to="row.original.cells[lang].changes"
                  target="_blank"
                  icon="i-lucide-file-diff"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  :aria-label="t('translations.changes')"
                />
              </UTooltip>
            </div>
          </template>
        </UTable>

        <!-- What the table's buttons and statuses mean, drawn as they are there:
             a translation's status, and the actions (in the table's order). -->
        <div class="grid gap-6 text-sm sm:grid-cols-2">
          <div
            v-for="group in legend"
            :key="group.title"
          >
            <p class="mb-2 font-medium text-highlighted">
              {{ group.title }}
            </p>
            <ul class="flex flex-col gap-2 text-muted">
              <li
                v-for="item in group.items"
                :key="item.text"
                class="flex min-h-7 items-center gap-2"
              >
                <UBadge
                  v-if="item.status"
                  :label="t(`translationStatus.${item.status}`)"
                  :color="colors[item.status]"
                  variant="subtle"
                  class="w-24 shrink-0 justify-center"
                />
                <span
                  v-else
                  class="inline-flex size-7 shrink-0 items-center justify-center text-default"
                >
                  <UIcon :name="item.icon!" class="size-4" />
                </span>
                {{ item.text }}
              </li>
            </ul>
          </div>
        </div>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
