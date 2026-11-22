<!-- The page editor. /cs/editor lists the files (EditorFiles.vue), with how far
     their translations are; /cs/editor?file=cs/2.studies/3.tips-and-tricks.md
     edits content/cs/2.studies/3.tips-and-tricks.md (EditorFile.vue). The file
     doesn't depend on the editor's language: /cs/editor?file=en/… edits an
     English page with the editor in Czech. -->
<script setup lang="ts">
const route = useRoute()
// Without .md, as the server takes it (and the drafts are kept by).
const file = computed(() => String(route.query.file ?? '').replace(/\.md$/, ''))
</script>

<template>
  <EditorFile v-if="file" :key="file" :file="file" />
  <EditorFiles v-else />
</template>
