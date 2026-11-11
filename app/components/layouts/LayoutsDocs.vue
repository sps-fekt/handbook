<!-- The layer's docs layout (comark-docs/app/components/layouts/LayoutsDocs.vue)
     with the sidebar's highlight line on, as in Docus: the current page is
     marked on the line beside the pages. Styling is in app.config.ts. -->
<script setup lang="ts">
const sidebar = useFilteredNavigation()
</script>

<template>
  <UContainer>
    <UPage>
      <template #left>
        <UPageAside>
          <UContentNavigation
            variant="link"
            highlight
            :collapsible="false"
            :navigation="sidebar"
          />
        </UPageAside>
      </template>

      <slot />
    </UPage>
  </UContainer>
</template>
