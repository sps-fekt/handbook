<!-- Translation status at /translations, from the data Lunaria writes to
     .lunaria/status.json (lunaria.config.ts) when the site is built:
     for each Czech page, whether its English version is done, outdated (the
     Czech page changed since) or missing, with links to fix it on GitHub. -->
<script setup lang="ts">
interface Commit { hash: string, date: string, message: string }
interface Entry {
  source: { path: string, git: { latestTrackedCommit: Commit } }
  localizations: { path: string, lang: string, status: 'done' | 'outdated' | 'missing', git?: { latestTrackedCommit: Commit } }[]
}

const repo = 'https://github.com/sps-fekt/handbook'
// Bundled at build time, right after Lunaria writes it. A glob, so a missing file (no
// `npm run lunaria` yet) gives an empty page instead of a failed build.
const files = import.meta.glob<Entry[]>('../../.lunaria/status.json', { eager: true, import: 'default' })
const data = computed(() => Object.values(files)[0] ?? [])

const statuses = {
  done: { label: 'Hotovo', color: 'success' },
  outdated: { label: 'Zastaralé', color: 'warning' },
  missing: { label: 'Chybí', color: 'error' },
} as const

// content/cs/1.getting-started/1.welcome.md → /cs/getting-started/welcome
const pagePath = (file: string) => file.replace(/^content/, '').replace(/\/\d+\./g, '/').replace(/(\/index)?\.md$/, '')

const rows = computed(() => data.value.flatMap(({ source, localizations }) => localizations.map((loc) => ({
  page: pagePath(source.path),
  lang: loc.lang,
  status: loc.status,
  // Outdated: what changed in Czech since the translation was last updated.
  changes: loc.status === 'outdated' && loc.git
    ? `${repo}/compare/${loc.git.latestTrackedCommit.hash}...${source.git.latestTrackedCommit.hash}`
    : undefined,
  fix: loc.status === 'missing' ? `${repo}/new/main?filename=${loc.path}` : `${repo}/edit/main/${loc.path}`,
}))))

const summary = computed(() => {
  const count = (status: string) => rows.value.filter((row) => row.status === status).length
  return { total: rows.value.length, done: count('done'), outdated: count('outdated'), missing: count('missing') }
})

useSeoMeta({ title: 'Stav překladu', robots: 'noindex' })
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        title="Stav překladu"
        description="Které stránky je potřeba přeložit do angličtiny nebo aktualizovat po změně v češtině."
      />

      <UPageBody>
        <div class="flex flex-col gap-2">
          <p class="text-sm text-muted">
            English: {{ summary.done }} hotovo, {{ summary.outdated }} zastaralé, {{ summary.missing }} chybí
          </p>
          <UProgress
            :model-value="summary.done"
            :max="summary.total || 1"
          />
        </div>

        <UTable
          :data="rows"
          :columns="[
            { accessorKey: 'page', header: 'Stránka' },
            { accessorKey: 'status', header: 'Stav' },
            { id: 'links', header: '' },
          ]"
        >
          <template #page-cell="{ row }">
            <ULink
              :to="row.original.page"
              class="font-medium"
            >
              {{ row.original.page }}
            </ULink>
          </template>
          <template #status-cell="{ row }">
            <UBadge
              :label="statuses[row.original.status].label"
              :color="statuses[row.original.status].color"
              variant="subtle"
            />
          </template>
          <template #links-cell="{ row }">
            <div class="flex justify-end gap-3">
              <ULink
                v-if="row.original.changes"
                :to="row.original.changes"
                target="_blank"
              >
                Co se změnilo
              </ULink>
              <ULink
                :to="row.original.fix"
                target="_blank"
              >
                {{ row.original.status === 'missing' ? 'Vytvořit' : 'Upravit' }}
              </ULink>
            </div>
          </template>
        </UTable>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
