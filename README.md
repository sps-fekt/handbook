# handbook

Freshman handbook (Příručka prváka) of Studenti pro studenty, built on the [comark-docs](https://github.com/comarkdown/comark-docs) Nuxt layer.

- **Czech and English.** Czech is the source language. The English version has the same file names.
- **Pages served from GitHub.** In production the site reads the Markdown from this repository when a page is requested, so it isn't bundled into the build.
- **Translation tracking** with [Lunaria](https://lunaria.dev). The page `/cs/translations` lists English pages that are missing or older than their Czech source. The server runs Lunaria itself, so it's current without a rebuild.
- **Installable as an app** and readable offline (PWA).

## Contents

| File | Purpose |
|---|---|
| `content/cs/`, `content/en/` | The pages, as Markdown. Same file names in both languages |
| `public/` | Images, icons and other static files |
| `site.ts` | Site name, description and brand colour |
| `nuxt.config.ts` | The layer, languages, redirects from old URLs, the PWA |
| `app/` | Replacements for the layer's components (header, footer, language switch, search), the translations page, styles |
| `server/middleware/language.ts` | Sends `/` to the visitor's language |
| `i18n/locales/` | Texts of the interface in Czech and English |
| `lunaria.config.ts` | Translation tracking |
| `Containerfile`, `handbook.quadlets`, `config/`, `deploy/` | The server, see [Server](#server) |
| `.github/workflows/` | A check build on every push and pull request |

## Editing

See [CONTRIBUTING.md](CONTRIBUTING.md), also for the formatting options (image sizes, images beside the text, callouts).

## Local development

You need Node.js 24, the version the server and CI use.

```bash
npm ci
npm run dev      # http://localhost:3000, reads content/ from disk and reloads on every change
npm run build    # the production build
```

## Server

The site runs as a rootless Podman container (`handbook.quadlets`) under its own user, with the repository cloned to `~/repo`. A reverse proxy on the host forwards the domain to `127.0.0.1:8090`.

### Deploys

**Content** needs no deploy. The site reads the pages from GitHub, and a repository webhook tells it about every push (`/api/webhook`): the site then serves the new commit right away and reruns Lunaria for the translation status. Without the webhook, the site notices a new commit within an hour on its own. Both need `VERCEL_ENV=production` (`config/handbook.env`): the layer is made for Vercel and otherwise keeps the content it started with.

**Code** (everything outside `content/`) is deployed by `deploy/deploy.sh`: it pulls `main`, rebuilds the image when the site changed and restarts it. The header of the script lists what each kind of change does.

It runs right after every push to `main`, started by the same webhook: the site writes `~/.local/state/handbook-deploy/requested` (mounted into the container), and `handbook-deploy.path` starts `handbook-deploy.service` when the file appears. Nothing connects to the server from outside, so SSH can stay reachable only over the VPN. As a fallback, `handbook-deploy.timer` checks GitHub every 10 minutes.

To watch a deploy: `journalctl --user -fu handbook-deploy.service`. To deploy by hand: `~/repo/deploy/deploy.sh`.

### Setup

1. Create a GitHub token the site reads the pages with: GitHub → Settings → Developer settings → Fine-grained tokens, resource owner `sps-fekt`, only the `handbook` repository, permission **Contents: Read-only**. Store it as a Podman secret:

   ```bash
   printf '%s' 'github_pat_…' | podman secret create handbook-github-token -
   ```

   When the token expires, replace it (`podman secret rm`, then create it again) and restart the site: `systemctl --user restart handbook.service`.

2. Create a random secret that signs the link preview images:

   ```bash
   openssl rand -hex 32 | tr -d '\n' | podman secret create handbook-app-secret -
   ```

3. Create the webhook secret, and the webhook on GitHub with the same value:

   ```bash
   openssl rand -hex 32 | tr -d '\n' | tee /dev/stderr | podman secret create handbook-webhook-secret -
   ```

   In the repository settings → Webhooks → Add webhook: payload URL `https://prirucka.sps-fekt.cz/api/webhook`, content type `application/json`, the secret printed above, **Just the push event**. GitHub's first delivery (a ping) should answer 200.

4. Check `config/handbook.env` (site URL, repository).
5. Run `~/repo/deploy/deploy.sh --install`.
