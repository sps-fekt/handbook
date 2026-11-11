<!-- The layer's search palette (comark-docs/app/components/AppSearch.vue)
     limited to the current language: it browses that language's sections
     (Začínáme, Studium, …) instead of one group per language, and full-text
     results from the other language are left out. The rest is the layer's. -->
<script setup lang="ts">
import type { NavigationItem, SearchOptions } from 'comark-content'

const props = defineProps<{
  navigation: NavigationItem[]
}>()

const { search: searchAll, status } = useSearch()
const { locale } = useI18n()
const content = useDocsContent()

const appConfig = useAppConfig()

// The current language's home path, e.g. /cs (with the preview prefix, if any).
const home = computed(() => `${content.value.routeBase}/${locale.value}`)
const navigation = computed(() => props.navigation.find((item) => item.path === home.value)?.children ?? props.navigation)

// Result ids are page paths, with #heading for sections within a page.
async function search(query: string, opts?: SearchOptions) {
  const h = home.value
  return (await searchAll(query, opts)).filter(({ id }) => id === h || id.startsWith(`${h}/`) || id.startsWith(`${h}#`))
}

interface PageItem {
  label: string
  prefix?: string
  suffix?: string
  to: string
  icon: string
}

/** Leaf pages, flattened; ancestor titles become the `Section > Page` prefix the palette renders. */
function pageItems(items: NavigationItem[], ancestors: string[] = []): PageItem[] {
  return items.flatMap((item) => {
    if (item.children?.length) return pageItems(item.children, [...ancestors, item.title])
    if (!item.path || item.page === false) return []
    return [{
      label: item.title,
      prefix: ancestors.length ? `${ancestors.join(' > ')} >` : undefined,
      suffix: item.description,
      to: item.path,
      icon: (item.icon as string | undefined) || appConfig.ui.icons.file,
    }]
  })
}

function browseOnly(query: string, items?: PageItem[]): PageItem[] {
  return query ? [] : (items ?? [])
}

// One group per top-level section, mirroring how `UContentSearch` groups navigation when it can.
const groups = computed(() => {
  if (navigation.value.some((item) => item.children?.length)) {
    return navigation.value
      .filter((section) => section.children?.length)
      .map((section) => ({
        id: section.path,
        label: section.title,
        items: pageItems(section.children ?? []),
        postFilter: browseOnly,
      }))
      .filter((group) => group.items.length > 0)
  }
  return [{ id: 'docs', items: pageItems(navigation.value), postFilter: browseOnly }]
})
</script>

<template>
  <LazyUContentSearch
    :search="search"
    :search-status="status"
    :navigation="navigation"
    :groups="groups"
    :transition="false"
    :loading="status === 'loading'"
  />
</template>
