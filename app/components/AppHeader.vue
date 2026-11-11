<!-- Replaces the layer's header (comark-docs/app/components/AppHeader.vue):
     - no tab bar (AppHeaderCenter); the language switch (LanguageSwitch.vue)
       goes last on the right instead, after search and history, styled and
       spaced like them;
     - the switch is also in the mobile menu, which lists no tabs either.
     The rest is the layer's header unchanged. -->
<script setup lang="ts">
const { header, footer, assistant } = useAppConfig()
const content = useDocsContent()
const historyOpen = useVersionHistory()
const assistantOpen = useAssistant()
</script>

<template>
  <UHeader :to="prefixLink(header?.to || '/', content.routeBase)">
    <template #left>
      <AppHeaderBrand />
    </template>

    <template #right>
      <UContentSearchButton
        v-if="header?.search"
        :collapsed="assistantOpen"
        :icon="assistantOpen ? undefined : false"
        :variant="assistantOpen ? 'outline' : undefined"
        :ui="{ leadingIcon: 'size-4' }"
        :class="['text-muted font-normal hidden lg:inline-flex', assistantOpen ? 'p-2' : 'min-w-[150px]']"
      />

      <UButton
        v-if="assistant?.enabled"
        label="Ask AI"
        color="neutral"
        variant="outline"
        @click="assistantOpen = !assistantOpen"
      />

      <UButton
        icon="i-lucide-history"
        :color="content.mode === 'prod' ? 'neutral' : 'warning'"
        :variant="content.mode === 'prod' ? 'outline' : 'subtle'"
        aria-label="Version history"
        :ui="{ leadingIcon: 'size-4' }"
        class="p-2"
        @click="historyOpen = !historyOpen"
      />

      <LanguageSwitch />
    </template>

    <template #toggle="{ open, toggle }">
      <IconMenuToggle
        :open="open"
        @click="toggle"
      />
    </template>

    <template #body>
      <div class="flex flex-col justify-between h-full">
        <UContentSearchButton
          v-if="header?.search"
          :collapsed="false"
          size="xl"
          class="w-full font-normal"
          :icon="false"
        />
        <div class="flex items-center gap-4">
          <template v-if="footer?.links">
            <UButton
              v-for="(link, index) of footer?.links"
              :key="index"
              v-bind="{ color: 'neutral', variant: 'ghost', size: 'md', ...link }"
              class="text-highlighted"
            />
          </template>
          <UColorModeButton
            size="md"
            class="text-highlighted"
          />
        </div>
      </div>
    </template>
  </UHeader>
</template>
