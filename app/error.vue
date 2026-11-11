<!-- The layer's error page (comark-docs/app/error.vue) in the page's language
     (useSiteLang). The rest is the layer's unchanged. -->
<script setup lang="ts">
import type { NuxtError } from '#app'
import type { NavigationItem } from 'comark-content'

defineProps<{
  error: NuxtError
}>()

const { uiLocale, t } = useSiteLang()

useSeoMeta({
  title: () => t('notFoundTitle'),
  description: () => t('notFoundDescription'),
})

const content = useDocsContent()

const { data: navigation } = await useAsyncData('navigation', () => content.value.client.navigation(), {
  watch: [() => content.value.routeBase],
})

// Client-only: an SSR value gets baked into the page's ISR entry and would pin search to a stale commit.
const { data: sha } = useAsyncData(
  () => `content-head:${content.value.apiBase}`,
  () =>
    $fetch<{ sha: string | null }>(`${content.value.apiBase}/head`)
      .then(({ sha }) => sha)
      .catch((error) => {
        console.error('[search] could not resolve the content head', error)
        return null
      }),
  { server: false, watch: [() => content.value.apiBase] }
)

// Matches app.vue: nav must be prefixed the same way search results are, so the palette can look them up.
const navTree = computed<NavigationItem[]>(() => prefixNavigation(navigation.value ?? [], content.value.routeBase))

provide('navigation', navTree)
provide('sha', sha)
</script>

<template>
  <UApp :locale="uiLocale">
    <AppHeader />

    <UError
      :error="error.statusCode === 404
        ? { ...error, statusMessage: t('notFoundTitle'), message: t('notFoundDescription') }
        : error"
    />

    <AppFooter />

    <AppSearch :navigation="navTree" />
  </UApp>
</template>
