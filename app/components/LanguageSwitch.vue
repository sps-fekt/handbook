<!-- Language switch in the header (AppHeader.vue).

     Each page lives under its language's prefix with the same path, e.g.
     /cs/about/contributing ↔ /en/about/contributing. The switch
     opens the same page in the other language when it exists, otherwise that
     language's home page. It also adds the hreflang links between the two
     versions, which @nuxtjs/i18n doesn't for the layer's unlocalised routes. -->
<script setup lang="ts">
import type { NavigationItem } from 'comark-content'

const route = useRoute()
const site = useSiteConfig()
const navigation = inject<Ref<NavigationItem[]>>('navigation', ref([]))

const { locale: lang, t } = useI18n()
const isEnglish = computed(() => lang.value === 'en')

const paths = computed(() => {
  const all = new Set<string>(['/cs', '/en', '/cs/translations', '/en/translations'])
  const walk = (items: NavigationItem[]) => items.forEach((item) => {
    all.add(item.path)
    if (item.children) walk(item.children)
  })
  walk(navigation.value ?? [])
  return all
})

// The page's path in the given language, or undefined if there's no such page.
function counterpart(lang: 'cs' | 'en') {
  const target = route.path.replace(/^\/(cs|en)(?=\/|$)/, `/${lang}`)
  return paths.value.has(target) ? target : undefined
}

const languages = computed(() => [
  { code: 'cs', name: 'Čeština', to: counterpart('cs') ?? '/cs', active: !isEnglish.value },
  { code: 'en', name: 'English', to: counterpart('en') ?? '/en', active: isEnglish.value },
])

useHead({
  link: () => {
    const cs = counterpart('cs')
    const en = counterpart('en')
    if (!cs || !en) return []
    return [
      { rel: 'alternate', hreflang: 'cs', href: `${site.url}${cs}` },
      { rel: 'alternate', hreflang: 'en', href: `${site.url}${en}` },
      { rel: 'alternate', hreflang: 'x-default', href: `${site.url}${en}` },
    ]
  },
})
</script>

<template>
  <UPopover :content="{ align: 'end' }">
    <UButton
      color="neutral"
      variant="outline"
      icon="i-lucide-languages"
      :aria-label="t('language')"
      :ui="{ leadingIcon: 'size-4' }"
      class="p-2"
    />

    <template #content>
      <ul class="flex flex-col p-1">
        <li
          v-for="language in languages"
          :key="language.code"
        >
          <NuxtLink
            :to="language.to"
            :lang="language.code"
            class="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-elevated"
            :class="language.active ? 'text-highlighted font-medium' : 'text-muted'"
          >
            {{ language.name }}
            <span class="text-xs uppercase text-dimmed">{{ language.code }}</span>
          </NuxtLink>
        </li>
      </ul>
    </template>
  </UPopover>
</template>
