<!-- Replaces the layer's header brand (Vercel and Comark marks): the SPS logo
     next to the site title. The logo is drawn as a mask filled with the
     current color, so one SVG serves light and dark mode. -->
<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <NuxtLink
    :to="localePath('/')"
    class="flex min-w-0 items-center gap-3 text-highlighted lg:mr-3"
  >
    <span
      role="img"
      aria-label="Studenti pro studenty"
      class="size-6 shrink-0 bg-current [mask:url('/sps-logo.svg')_center/contain_no-repeat]"
    />
    <span class="font-bold leading-tight">{{ t('siteName') }}</span>
  </NuxtLink>
</template>
