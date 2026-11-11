<!-- Language switch in the header (AppHeader.vue).

     English pages live under /en with the Czech page's path, e.g.
     /about/contributing ↔ /en/about/contributing. The switch
     opens the same page in the other language when it exists, otherwise that
     language's home page. -->
<script setup lang="ts">
import type { NavigationItem } from 'comark-content'

const route = useRoute()
const navigation = inject<Ref<NavigationItem[]>>('navigation', ref([]))

const { lang, t } = useSiteLang()
const isEnglish = computed(() => lang.value === 'en')

const paths = computed(() => {
  const all = new Set<string>()
  const walk = (items: NavigationItem[]) => items.forEach((item) => {
    all.add(item.path)
    if (item.children) walk(item.children)
  })
  walk(navigation.value ?? [])
  return all
})

function pathIn(lang: 'cs' | 'en') {
  const czech = isEnglish.value ? route.path.replace(/^\/en/, '') || '/' : route.path
  const target = lang === 'en' ? (czech === '/' ? '/en' : `/en${czech}`) : czech
  return paths.value.has(target) ? target : lang === 'en' ? '/en' : '/'
}

const languages = computed(() => [
  { code: 'cs', name: 'Čeština', to: pathIn('cs'), active: !isEnglish.value },
  { code: 'en', name: 'English', to: pathIn('en'), active: isEnglish.value },
])
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
