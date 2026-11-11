# Contributing

## Where things are

```text
content/
  cs/                       Czech, the source of every page
    index.md                landing page
    1.getting-started/      a section; the number sets the order in the menu
      .navigation.yml       the section's title and icon
      1.welcome.md          a page: /cs/getting-started/welcome
  en/                       English, same file names as cs/
public/images/              images, referenced as /images/...
```

Each page starts with a `title` and `description`. They also appear in link previews on Discord, so keep them short and specific.

## Editing

```bash
npm ci
npm run dev        # http://localhost:3000
```

Make your change on a branch and open a pull request against `main`. Small fixes can also be made in GitHub's web editor (the **Edit on GitHub** link on every page). The site reads the content from GitHub when a page is requested, so a change merged to `main` goes live without a new deploy.

## Rules

- **Change Czech first.** Edit `content/cs/`. Then update `content/en/` under the same file name, or leave it for a translator. The page `/cs/translations` lists what needs translating.
- **Typo fixes** that don't change the meaning: put `lunaria-ignore` (or `fix typo`) in the commit message, so the English page isn't marked as outdated.
- **Don't rename published pages** without a good reason. Links to them are shared on Discord.

## Formatting

Pages are Markdown with [Comark](https://docs-template.comark.dev/writing/pages) components. Besides plain Markdown, the handbook uses:

### Callouts

```md
::note
Something worth knowing.
::
```

Also `::tip`, `::warning` and `::caution`. See [components](https://docs-template.comark.dev/writing/components) for the rest.

### Image size

Images are full width unless given a width in pixels:

```md
![BEST Brno logo](/images/logo-best.webp){width="200"}
```

Always write the `alt` text (in the brackets). It is read out by screen readers and shown when the image doesn't load.

### Images beside the text

On screens wider than a phone, an image narrower than 400 px (`width` 100–399) that has its own paragraph and is followed by text sits **to the right of the text after it**. So put it just before the paragraph it belongs to, not after:

```md
## BEST Brno

![BEST Brno logo](/images/logo-best.webp){width="200"}

Want to have fun during your studies? ...
```

It stays on its own line when:

- its `width` is 400 or more, or it has none (posters, the map, photos),
- nothing follows it (the end of a page or section),
- it is marked `.no-float`:

  ```md
  ![Individual timetable](/images/is-rozvrh.webp){width="300" .no-float}
  ```

On phones every image is on its own line.

### Tables without a header

A Markdown table always has a header row. Leave it empty and it is hidden, for tables of plain rows like dates and contacts:

```md
|                 |                        |
| --------------- | ---------------------- |
| 11. 6. – 15. 7. | Dormitory applications |
```
