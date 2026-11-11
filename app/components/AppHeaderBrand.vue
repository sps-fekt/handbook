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
    class="flex shrink-0 items-center gap-3 text-highlighted lg:mr-3"
  >
    <span
      role="img"
      aria-label="Studenti pro studenty"
      class="size-6 shrink-0 bg-current [mask:url('/sps-logo.svg')_center/contain_no-repeat]"
    />
    <!-- Below 400px the name doesn't fit beside the buttons: logo only (still read out). -->
    <span class="font-bold leading-none max-[400px]:sr-only">{{ t('siteName') }}</span>
  </NuxtLink>
</template>
