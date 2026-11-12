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

### Images

Always write the `alt` text (in the brackets). It is read out by screen readers and shown when the image doesn't load.

By default an image is as wide as the text, on its own line. Add options in braces after it, separated by spaces. On phones every image is full width, on its own line, whatever the options.

| Option | What it does |
|---|---|
| `width="200"` | Width in pixels (at most the text's width). For logos and other pictures with a natural size. |
| `.quarter` `.third` `.half` `.two-thirds` `.three-quarters` | That share of the text's width. |
| `.float` | Beside the text, on the right. Without a size or width, at most half the text's width. |
| `.float-left` | Beside the text, on the left. |
| `.float-right` | The same as `.float`. |

A sized image on its own line is centred. Combine a size or width with a float:

```md
![Faculty campus](/images/arealy-fakulty.webp){.half}

![Studenti pro studenty logo](/sps-logo.svg){width="200" .float}

![FEEC library](/images/knihovna-fekt.webp){.third .float-left}
```

Use `.float`, so images sit on the same side throughout the handbook. Use `.float-left` only where the right side doesn't work, and don't write `.float-right`: it exists only as the counterpart of `.float-left`.

A floating image sits beside the text **after** it, so put it in its own paragraph just before the paragraph it belongs to. The next heading always starts below it.

### Tables without a header

A Markdown table always has a header row. Leave it empty and it is hidden, for tables of plain rows like dates and contacts:

```md
|                 |                        |
| --------------- | ---------------------- |
| 11. 6. – 15. 7. | Dormitory applications |
```
