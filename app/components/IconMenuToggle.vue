<!-- Replaces the layer's menu button (comark-docs/app/components/IconMenuToggle.vue):
     square, outlined and sized like the other header buttons, with the
     classic three-bar icon that turns into an X when the menu is open
     (outer bars rotate onto each other, the middle one fades). -->
<script setup lang="ts">
defineProps<{
  open: boolean
}>()

const { t } = useI18n()
</script>

<template>
  <UButton
    color="neutral"
    variant="outline"
    class="lg:hidden p-2 cursor-pointer"
    square
    :aria-label="open ? t('closeMenu') : t('openMenu')"
    :aria-expanded="open"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <line
        x1="4"
        y1="6"
        x2="20"
        y2="6"
        class="bar"
        :class="{ 'bar-top-open': open }"
      />
      <line
        x1="4"
        y1="12"
        x2="20"
        y2="12"
        class="bar"
        :class="{ 'opacity-0': open }"
      />
      <line
        x1="4"
        y1="18"
        x2="20"
        y2="18"
        class="bar"
        :class="{ 'bar-bottom-open': open }"
      />
    </svg>
  </UButton>
</template>

<style scoped>
.bar {
  transform-box: view-box;
  transform-origin: center;
  transition: transform 200ms ease, opacity 200ms ease;
}

.bar-top-open {
  transform: rotate(45deg) translateY(6px);
}

.bar-bottom-open {
  transform: rotate(-45deg) translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .bar {
    transition: none;
  }
}
</style>
