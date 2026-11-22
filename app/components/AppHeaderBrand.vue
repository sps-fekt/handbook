<!-- Replaces the layer's header brand (Vercel and Comark marks): the SPS logo
     next to the site title. The logo is drawn as a mask filled with the
     current color, so one SVG serves light and dark mode. In the page editor
     (/cs/editor?file=…), "Editor" follows the title. -->
<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const inEditor = computed(() => /^\/[a-z]{2}\/editor(\/|$)/.test(route.path))
</script>

<template>
  <div class="flex shrink-0 items-center gap-3 lg:mr-3">
    <NuxtLink
      :to="localePath('/')"
      class="flex items-center gap-3 text-highlighted"
    >
      <span
        role="img"
        aria-label="Studenti pro studenty"
        class="size-6 shrink-0 bg-current [mask:url('/sps-logo.svg')_center/contain_no-repeat]"
      />
      <span class="font-bold leading-none">{{ t('siteName') }}</span>
    </NuxtLink>
    <template v-if="inEditor">
      <span aria-hidden="true" class="text-dimmed">/</span>
      <span class="font-medium leading-none text-muted">{{ t('editor.title') }}</span>
    </template>
  </div>
</template>
