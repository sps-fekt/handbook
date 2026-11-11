<!-- The homepage of each language, /cs and /en. The layer renders a landing
     page only at / (its pages/index.vue, which nuxt.config.ts redirects to
     /cs); this renders content/<lang>/index.md the same way, with the same
     landing components (::landing-hero and the rest). -->
<script setup lang="ts">
definePageMeta({ path: '/:lang(cs|en)' })

const landingComponents = byFileName(import.meta.glob('../../node_modules/comark-docs/app/components/content/landing/*.{vue,ts}', { eager: true, import: 'default' }))

const content = useDocsContent()
const route = useRoute()
const lang = route.params.lang as string

const { data: page } = await useAsyncData(`${content.value.routeBase}:landing-${lang}`, () => content.value.client.get(`/${lang}`))
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const tree = computed(() => page.value && { ...page.value, nodes: prefixTreeLinks(page.value.nodes, content.value.routeBase) })
const fm = computed<Record<string, any>>(() => page.value?.data ?? {})

useSeoMeta({
  titleTemplate: '',
  title: () => fm.value.title,
  ogTitle: () => fm.value.title,
  description: () => fm.value.description,
  ogDescription: () => fm.value.description,
})
</script>

<template>
  <MarkdownDocument
    v-if="tree"
    :value="tree"
    :components="landingComponents"
  />
</template>
