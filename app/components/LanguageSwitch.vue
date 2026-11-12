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
// The picked language, so / opens it next time (server/middleware/language.ts).
const saved = useCookie('lang', { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
const isEnglish = computed(() => lang.value === 'en')

const paths = computed(() => pagePaths(navigation.value ?? []))

// The page's path in the given language, or undefined if there's no such page.
function counterpart(lang: 'cs' | 'en') {
  const target = route.path.replace(/^\/(cs|en)(?=\/|$)/, `/${lang}`)
  return paths.value.has(target) ? target : undefined
}

// A menu like the colour mode's (AppHeader.vue); the current language is highlighted.
const languages = computed(() => [
  { label: 'Čeština', to: counterpart('cs') ?? '/cs', active: !isEnglish.value, onSelect: () => { saved.value = 'cs' } },
  { label: 'English', to: counterpart('en') ?? '/en', active: isEnglish.value, onSelect: () => { saved.value = 'en' } },
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
  <UDropdownMenu :items="languages" :content="{ align: 'end' }">
    <UButton
      color="neutral"
      variant="outline"
      icon="i-lucide-languages"
      :aria-label="t('language')"
      :ui="{ leadingIcon: 'size-4' }"
      class="p-2"
    />
  </UDropdownMenu>
</template>
