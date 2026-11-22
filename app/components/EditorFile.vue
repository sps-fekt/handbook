<!-- The page editor (app/pages/editor.vue) for one file: its Markdown beside a
     live preview, and a button that proposes the change as a pull request.
     Sign-in and GitHub are server/routes/editor/. A translation that doesn't
     exist yet starts as the Czech page (page.get.ts). -->
<script setup lang="ts">
import { refDebounced, useEventListener, useLocalStorage } from '@vueuse/core'
import { Markdown } from '@comark/vue'
import { parseFrontmatter } from 'comark'
import { insertTextIntoField, wrapFieldSelection } from 'text-field-edit'
import { componentsFor, componentTemplates, inEditor, insertableComponents } from '~/editor/preview'
import { sourceLines, useScrollSync } from '~/editor/scroll-sync'

const route = useRoute()
const { t, te, locale } = useI18n()
useSeoMeta({ title: () => t('editor.title'), robots: 'noindex, nofollow' })

// The file in content/, without .md: cs/2.studies/3.tips-and-tricks.
const props = defineProps<{ file: string }>()
const file = computed(() => props.file)
// content/cs/2.studies/3.tips-and-tricks.md is /cs/studies/tips-and-tricks.
const pageUrl = computed(() => `/${file.value}`.replace(/\/\d+\./g, '/').replace(/\/index$/, ''))
const signInUrl = computed(() => `/editor/login?return=${encodeURIComponent(route.fullPath)}`)

// Anyone can edit; proposing needs GitHub sign-in (nuxt-auth-utils). Signing in
// leaves the page, so the draft waits in this browser and comes back after.
const { loggedIn, user, clear: signOut } = useUserSession()
const { data, error } = useFetch('/editor/page', { query: { path: file }, server: false })
const source = ref('')
const sha = ref('') // The version being edited: GitHub refuses the change if the page has moved on.
const summary = ref('')
const submitting = ref(false) // The proposal dialog is open.
type Draft = { source: string, sha: string, summary: string }
const drafts = useLocalStorage<Record<string, Draft>>('handbook-editor-drafts', {}, { flush: 'sync' })
watch(data, (page) => {
  if (!page) return
  const draft = drafts.value[file.value]
  delete drafts.value[file.value]
  source.value = draft?.source ?? page.content
  sha.value = draft?.sha ?? page.sha
  summary.value = draft?.summary ?? ''
  // Back from signing in with changes: straight on to proposing them.
  if (draft && loggedIn.value && draft.source !== page.content) submitting.value = true
}, { immediate: true })
const changed = computed(() => !!data.value && source.value !== data.value.content)
const proposeHint = computed(() => (pull.value ? t('editor.sentShort') : changed.value ? t('editor.propose') : t('editor.noChanges')))

let leaving = false
function signIn() {
  drafts.value[file.value] = { source: source.value, sha: sha.value, summary: summary.value }
  leaving = true
  return navigateTo(signInUrl.value, { external: true })
}

// The toolbar beside the source is GitHub's (its comment box's): it edits only
// the selection or its lines (** around a word, - before a line), with undo.
// The library defines browser elements, so it loads in the browser only.
// Headings and quotes are this page's own (styleLines below): the library
// puts them before the word under the cursor, not the line. It has no table.
// No heading 1: that's the page's title, from the frontmatter.
onMounted(() => import('@github/markdown-toolbar-element'))
// Lists, callouts and components are menus (items), at the end: the lists'
// are the library's list buttons, hidden in the toolbar and clicked from the menu.
type Tool = { label: string, icon: string, tag?: string, onClick?: () => void, items?: { label: string, icon?: string, onSelect: () => void }[] }
const tools = computed<Tool[]>(() => [
  { tag: 'button', onClick: () => styleLines('## '), icon: 'i-lucide-heading-2', label: 'heading2' },
  { tag: 'button', onClick: () => styleLines('### '), icon: 'i-lucide-heading-3', label: 'heading3' },
  { tag: 'md-bold', icon: 'i-lucide-bold', label: 'bold' },
  { tag: 'md-italic', icon: 'i-lucide-italic', label: 'italic' },
  { tag: 'md-code', icon: 'i-lucide-code', label: 'code' },
  { tag: 'md-link', icon: 'i-lucide-link', label: 'link' },
  { tag: 'md-image', icon: 'i-lucide-image', label: 'image' },
  { tag: 'button', onClick: () => styleLines('> '), icon: 'i-lucide-text-quote', label: 'quote' },
  { tag: 'button', onClick: insertTable, icon: 'i-lucide-table', label: 'table' },
  { icon: 'i-lucide-list', label: 'lists', items: [
    { label: t('editor.tools.bulletList'), icon: 'i-lucide-list', onSelect: () => afterMenu(() => clickTool('md-unordered-list')) },
    { label: t('editor.tools.orderedList'), icon: 'i-lucide-list-ordered', onSelect: () => afterMenu(() => clickTool('md-ordered-list')) },
  ] },
  { icon: 'i-lucide-message-square-warning', label: 'callout', items: calloutItems.value },
  { icon: 'i-lucide-puzzle', label: 'component', items: componentItems.value },
])
const toolbar = useTemplateRef<HTMLElement>('toolbar')
const clickTool = (tag: string) => toolbar.value?.querySelector<HTMLElement>(tag)?.click()

// A heading or quote at the start of the cursor's line, or of every selected
// line: in place of another heading, or taken off when the lines have it already.
function styleLines(prefix: string) {
  const area = sourceArea.value?.textareaRef
  if (!area) return
  const { value, selectionStart, selectionEnd } = area
  const start = value.lastIndexOf('\n', selectionStart - 1) + 1
  const end = value.indexOf('\n', selectionEnd) === -1 ? value.length : value.indexOf('\n', selectionEnd)
  const existing = prefix.startsWith('#') ? /^#{1,6} / : /^> ?/
  const lines = value.slice(start, end).split('\n')
  const off = lines.every((line) => line.match(existing)?.[0] === prefix)
  const text = lines.map((line) => (off ? '' : prefix) + line.replace(existing, '')).join('\n')
  area.focus()
  area.setSelectionRange(start, end)
  insertTextIntoField(area, text) // As typed: Ctrl+Z undoes it.
  // The cursor at the line's end, or the lines still selected.
  area.setSelectionRange(selectionStart === selectionEnd ? start + text.length : start, start + text.length)
}

// A table, a block of its own: on the cursor's line when that's empty, else
// after it, with blank lines around. Its first heading selected, to type over.
function insertTable() {
  const area = sourceArea.value?.textareaRef
  if (!area) return
  const { value, selectionEnd } = area
  const start = value.lastIndexOf('\n', selectionEnd - 1) + 1
  const end = value.indexOf('\n', selectionEnd) === -1 ? value.length : value.indexOf('\n', selectionEnd)
  const from = value.slice(start, end).trim() ? end : start
  const before = value.slice(0, from)
  const after = value.slice(end)
  const lead = !before || before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n'
  const trail = !after || after.startsWith('\n\n') ? '' : after.startsWith('\n') ? '\n' : '\n\n'
  const column = t('editor.tableColumn')
  area.focus()
  area.setSelectionRange(from, end)
  insertTextIntoField(area, `${lead}| ${column} 1 | ${column} 2 |\n| --- | --- |\n|  |  |${trail}`)
  const cell = from + lead.length + 2
  area.setSelectionRange(cell, cell + column.length + 2)
}

// The account button under the toolbar.
const accountItems = computed(() => loggedIn.value
  ? [[{ label: `@${user.value?.login}`, type: 'label' as const }], [{ label: t('editor.signOut'), icon: 'i-lucide-log-out', onSelect: () => signOut() }]]
  : [[
      { label: t('editor.signInGithub'), onSelect: () => signIn() },
      { label: t('editor.signUp'), to: 'https://github.com/signup', target: '_blank' },
    ]])

// Comark components (::note, ::landing-hero): from the list the preview renders
// with, so new ones appear by themselves. A block goes around the selected
// lines, an inline one around the selection (text-field-edit: Ctrl+Z undoes it).
// One that needs more (::accordion, :button) comes from a template, its first
// blank to fill in selected (app/editor/preview.ts).
// A menu's choice is carried out once the menu has closed: while it's open it
// holds the focus, and the text can't go into the source. Then the source gets
// the focus back, not the menu's button.
let pending: (() => void) | undefined
const afterMenu = (action: () => void) => { pending = action }
function menuClosed(event: Event) {
  const byHover = hovered
  hovered = false
  if (!pending && !byHover) return
  event.preventDefault()
  sourceArea.value?.textareaRef.focus()
  pending?.()
  pending = undefined
}

// The menus also open while the pointer is over their button, and close a
// moment after it leaves both the button and the menu. Opened so, a menu
// doesn't take the focus: the cursor stays in the source.
const openMenu = ref<string>()
let hovered = false
let overButton = false
let closing: ReturnType<typeof setTimeout> | undefined
function hoverMenu(label: string, button = false) {
  clearTimeout(closing)
  if (button) overButton = true
  if (openMenu.value === label) return
  hovered = true
  openMenu.value = label
}
// Closes only once the pointer is over neither the button nor the menu
// (.editor-menu): checked again while it is.
function leaveMenu(button = false) {
  clearTimeout(closing)
  if (button) overButton = false
  const check = () => {
    if (!hovered) return
    if (overButton || document.querySelector('.editor-menu:hover')) closing = setTimeout(check, 200)
    else openMenu.value = undefined
  }
  closing = setTimeout(check, 300)
}
const keepFocus = (event: Event) => { if (hovered) event.preventDefault() }
// Opened or closed by a click, Escape or a pick. A click on the button of a
// menu its hover opened leaves it open.
function setMenu(label: string, open: boolean) {
  clearTimeout(closing)
  if (!open && hovered && overButton && openMenu.value === label) return
  openMenu.value = open ? label : undefined
}
// The callouts (::note, ::tip, …) have a menu of their own, with their icons.
const { ui: { icons } } = useAppConfig()
// In this order: the plain box, then from a note to a caution.
const calloutIcons: Record<string, string | undefined> = { callout: 'i-lucide-message-square-warning', note: icons.info, tip: icons.tip, warning: icons.warning, caution: icons.caution }
const calloutOrder = Object.keys(calloutIcons)
const components = computed(() => insertableComponents(file.value))
// By their name in the editor's language; one without a translation by its own.
const componentName = (name: string) => (te(`editor.components.${name}`) ? t(`editor.components.${name}`) : name)
const menuItem = ({ name, inline }: { name: string, inline: boolean }) => ({
  label: componentName(name),
  onSelect: () => afterMenu(() => insertComponent(name, inline)),
})
// Alphabetically, by the name shown.
const componentItems = computed(() => components.value.filter((component) => !component.callout).map(menuItem)
  .sort((a, b) => a.label.localeCompare(b.label, locale.value)))
const calloutItems = computed(() => components.value.filter((component) => component.callout)
  .sort((a, b) => calloutOrder.indexOf(a.name) - calloutOrder.indexOf(b.name))
  .map((component) => ({ ...menuItem(component), icon: calloutIcons[component.name] })))
function insertComponent(name: string, inline: boolean) {
  const area = sourceArea.value?.textareaRef
  if (!area) return
  area.focus()
  const { value, selectionStart, selectionEnd } = area
  const lineEnd = value.indexOf('\n', selectionEnd)
  const start = inline ? selectionStart : value.lastIndexOf('\n', selectionStart - 1) + 1
  const end = inline ? selectionEnd : lineEnd === -1 ? value.length : lineEnd
  area.setSelectionRange(start, end)
  const template = componentTemplates[name]
  if (!template) return inline ? wrapFieldSelection(area, `:${name}[`, ']') : wrapFieldSelection(area, `::${name}\n`, '\n::')
  const blanks: Record<string, string> = { '{title}': t('editor.componentTitle'), '{link}': 'https://' }
  // On an empty line, a paragraph of its own: not joined to the ones around.
  const emptyLine = start === end && (start === 0 || value[start - 1] === '\n') && (end === value.length || value[end] === '\n')
  const text = emptyLine && inline ? `\n${template('')}\n` : template(value.slice(start, end))
  const first = text.match(/\{title\}|\{link\}/)
  insertTextIntoField(area, text.replace(/\{title\}|\{link\}/g, (blank) => blanks[blank]!))
  if (first) area.setSelectionRange(start + first.index!, start + first.index! + blanks[first[0]]!.length)
}

// The preview, without the frontmatter, a moment after typing stops.
const debounced = refDebounced(source, 300)
// Split as the site does (Comark's frontmatter parser). Half-typed YAML doesn't
// parse: until it does, the frontmatter is just left out.
const parsed = computed(() => {
  try {
    const { data, content } = parseFrontmatter(debounced.value)
    return { meta: data as { title?: string, description?: string }, body: content }
  }
  catch {
    return { meta: {}, body: debounced.value.replace(/^---\n[\s\S]*?\n---\n/, '') }
  }
})
// Without the blank lines it starts with: <Markdown> would drop them, and
// with them the lines its blocks report.
const previewBody = computed(() => parsed.value.body.replace(/^\n+/, ''))
// The lines before the body, so a body line + this is a source line.
const frontmatterLines = computed(() => debounced.value.split('\n').length - previewBody.value.split('\n').length)

// The panes scroll together, and the preview follows the cursor (app/editor/scroll-sync.ts).
const sourceArea = useTemplateRef<{ textareaRef: HTMLTextAreaElement }>('sourceArea')
const previewPane = useTemplateRef<HTMLElement>('previewPane')
const previewPlugins = [sourceLines]
useScrollSync(
  () => sourceArea.value?.textareaRef,
  () => previewPane.value ?? undefined,
  () => frontmatterLines.value,
)

// Proposing: a pull request, and the page's preview of it (/pr/<number>/…) when
// the site may show one (propose.post.ts).
const { data: pull, error: proposeError, status, execute: propose } = useFetch('/editor/propose', {
  method: 'POST',
  body: computed(() => ({ path: file.value, content: source.value, sha: sha.value, title: summary.value || `${t('editor.title')}: ${parsed.value.meta.title ?? file.value}` })),
  immediate: false,
  watch: false,
})
const sentActions = computed(() => pull.value && [
  { label: t('editor.openPull'), to: pull.value.url, target: '_blank' },
  ...(pull.value.previewable ? [{ label: t('editor.openPreview'), to: `/pr/${pull.value.number}${pageUrl.value}`, target: '_blank', color: 'neutral' as const, variant: 'outline' as const }] : []),
])

useEventListener('beforeunload', (event: BeforeUnloadEvent) => {
  if (changed.value && !pull.value && !leaving) event.preventDefault()
})
</script>

<template>
  <!-- On wide screens the editor fills the window under the site header: the
       panes take all the height the rows above them leave. -->
  <UContainer class="flex flex-col py-3 lg:h-[calc(100dvh-var(--ui-header-height))]">
    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      :title="t('editor.loadFailed')"
      :description="error.statusMessage"
    />

    <template v-else-if="data">
      <!-- Side by side, each pane scrolls on its own (and with the other), the
           same height: all the window leaves. -->
      <div class="grid min-h-0 flex-1 gap-x-6 gap-y-2 lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)]">
        <!-- "Editor" is in the header, after the site title (AppHeaderBrand.vue),
             and on wide screens the file too, in its middle (AppHeader.vue):
             here it's then only for screen readers. -->
        <h1 class="truncate font-mono text-sm text-muted lg:sr-only">
          {{ file }}.md
        </h1>
        <!-- The toolbar runs down the source's left side, the account at its foot. -->
        <div class="flex min-h-0 gap-2 lg:col-start-1 lg:row-start-1">
          <div class="flex shrink-0 flex-col justify-between gap-2">
            <markdown-toolbar
              ref="toolbar"
              for="editor-source"
              :aria-label="t('editor.toolbar')"
              class="flex shrink-0 flex-col gap-0.5"
            >
              <template v-for="tool in tools" :key="tool.label">
                <!-- A menu: opens on hover too; the corner triangle says so. -->
                <UDropdownMenu
                  v-if="tool.items"
                  :open="openMenu === tool.label"
                  :modal="false"
                  :items="tool.items"
                  :content="{ side: 'right', align: 'start', sideOffset: 2, onOpenAutoFocus: keepFocus, onCloseAutoFocus: menuClosed }"
                  :ui="{ content: 'editor-menu max-h-80' }"
                  @update:open="(open: boolean) => setMenu(tool.label, open)"
                >
                  <UButton
                    data-md-button
                    :icon="tool.icon"
                    :aria-label="t(`editor.tools.${tool.label}`)"
                    :title="t(`editor.tools.${tool.label}`)"
                    color="neutral"
                    variant="ghost"
                    class="relative size-8 justify-center text-muted"
                    @pointerenter="hoverMenu(tool.label, true)"
                    @pointerleave="leaveMenu(true)"
                  >
                    <span aria-hidden="true" class="absolute right-0.5 bottom-0.5 size-1.5 bg-current opacity-70 [clip-path:polygon(100%_0,100%_100%,0_100%)]" />
                  </UButton>
                </UDropdownMenu>
                <component
                  :is="tool.tag"
                  v-else
                  :type="tool.onClick && 'button'"
                  :aria-label="t(`editor.tools.${tool.label}`)"
                  :title="t(`editor.tools.${tool.label}`)"
                  class="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-elevated hover:text-highlighted focus-visible:outline-2 focus-visible:outline-primary"
                  @click="tool.onClick?.()"
                >
                  <UIcon :name="tool.icon" class="size-4" />
                </component>
              </template>
              <md-unordered-list class="hidden" />
              <md-ordered-list class="hidden" />
            </markdown-toolbar>
            <!-- At the foot: back to the page, proposing the change, and last the account. -->
            <div class="flex flex-col gap-0.5">
              <UButton
                :to="pageUrl"
                icon="i-lucide-arrow-left"
                :aria-label="t('editor.viewPage')"
                :title="t('editor.viewPage')"
                color="neutral"
                variant="ghost"
                class="size-8 justify-center text-muted"
              />
              <!-- Grey and disabled until something changed, and the tooltip
                   says why: on a wrapper, as a disabled button gets no hover. -->
              <UTooltip :text="proposeHint" :content="{ side: 'right' }">
                <span class="inline-flex">
                  <UButton
                    icon="i-lucide-save"
                    :aria-label="proposeHint"
                    :color="pull ? 'success' : changed ? 'primary' : 'neutral'"
                    :variant="pull || changed ? 'solid' : 'ghost'"
                    :disabled="!changed && !pull"
                    :class="['size-8 justify-center', !changed && !pull && 'pointer-events-none text-dimmed']"
                    @click="submitting = true"
                  />
                </span>
              </UTooltip>
              <UDropdownMenu :items="accountItems" :content="{ side: 'right', align: 'end' }">
                <UButton
                  :aria-label="t('editor.account')"
                  :title="loggedIn ? `@${user?.login}` : t('editor.account')"
                  color="neutral"
                  variant="ghost"
                  class="size-8 justify-center p-0 text-muted"
                >
                  <UAvatar v-if="loggedIn" :src="user?.avatar" :alt="user?.login" size="xs" />
                  <UIcon v-else name="i-lucide-circle-user-round" class="size-5" />
                </UButton>
              </UDropdownMenu>
            </div>
          </div>
          <UTextarea
            id="editor-source"
            ref="sourceArea"
            v-model="source"
            :rows="30"
            class="min-w-0 flex-1"
            :ui="{ base: 'h-full resize-none font-mono text-sm leading-6' }"
          />
        </div>
        <div ref="previewPane" class="relative min-w-0 rounded-md px-4 py-2 ring ring-inset ring-accented max-lg:mt-4 lg:col-start-2 lg:row-start-1 lg:min-h-0 lg:overflow-y-auto">
          <!-- A translation that didn't exist yet (page.get.ts). -->
          <UBadge v-if="!data.sha" :label="t('editor.newFile')" color="warning" variant="subtle" class="absolute top-2 right-2" />
          <!-- The title and description, as the page's header shows them. Marked
               as line 0, so the frontmatter scrolls and outlines with it. -->
          <UPageHeader
            :title="parsed.meta.title"
            :description="parsed.meta.description"
            :data-line="-frontmatterLines"
          />
          <!-- Markdown parses asynchronously. -->
          <Suspense>
            <Markdown
              :value="previewBody"
              :components="componentsFor(file)"
              :plugins="previewPlugins"
              :transform-node="inEditor"
            />
          </Suspense>
        </div>
      </div>

      <!-- Proposing: what changed, then signing in (signed out) or sending. -->
      <UModal v-model:open="submitting" :title="t('editor.propose')" :description="loggedIn || pull ? undefined : t('editor.signInDescription')">
        <template #body>
          <UAlert
            v-if="pull"
            color="success"
            variant="subtle"
            :title="t('editor.sent')"
            :actions="sentActions"
          />
          <form v-else class="flex flex-col gap-4" @submit.prevent="loggedIn ? propose() : signIn()">
            <UInput v-model="summary" :placeholder="t('editor.summary')" autofocus class="w-full" />
            <p v-if="proposeError" class="text-sm text-error">
              {{ t('editor.failed') }}: {{ proposeError.statusCode === 409 ? t('editor.conflict') : proposeError.statusMessage }}
            </p>
            <div class="flex flex-wrap items-center justify-end gap-3">
              <template v-if="!loggedIn">
                <UButton
                  :label="t('editor.signUp')"
                  to="https://github.com/signup"
                  target="_blank"
                  color="neutral"
                  variant="outline"
                />
                <UButton type="submit" :label="t('editor.signIn')" />
              </template>
              <template v-else>
                <span class="me-auto" />
                <UButton
                  type="submit"
                  icon="i-lucide-save"
                  :label="t('editor.propose')"
                  :loading="status === 'pending'"
                />
              </template>
            </div>
          </form>
        </template>
      </UModal>
    </template>
  </UContainer>
</template>
