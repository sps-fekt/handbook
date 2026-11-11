<!-- Replaces the layer's footer, which links its own brand assets page. -->
<script setup lang="ts">
const appConfig = useAppConfig()
const links = computed(() => appConfig.footer?.links ?? [])
</script>

<template>
  <UFooter>
    <template #left>
      <ULink
        to="https://sps-fekt.cz"
        target="_blank"
        class="hover:text-highlighted"
      >
        {{ appConfig.footer?.owner }}
      </ULink>
    </template>

    <template #right>
      <UButton
        v-for="(link, index) of links"
        :key="index"
        v-bind="{ color: 'neutral', variant: 'ghost', size: 'sm', ...link }"
        class="text-highlighted"
      />
    </template>
  </UFooter>
</template>
