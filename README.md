# handbook

Freshman handbook (Příručka prváka) of Studenti pro studenty, built on the [comark-docs](https://github.com/comarkdown/comark-docs) Nuxt layer.

- **Czech and English.** Czech is the source language. The English version has the same file names.
- **Pages served from GitHub.** In production the site reads the Markdown from this repository when a page is requested, so it isn't bundled into the build.
- **Translation tracking** with [Lunaria](https://lunaria.dev). The page `/cs/translations` lists English pages that are missing or older than their Czech source.
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
| `.github/workflows/` | A check build on every push and pull request, and the deploy |

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

`deploy/deploy.sh` pulls `main`, rebuilds the image when the site changed and restarts it. The header of the script lists what each kind of change does. Content changes rebuild the image too: the pages themselves come from GitHub, but the translation status is made at build time.

It runs right after every push to `main`: the `Deploy` workflow connects to the server over SSH, which starts `handbook-deploy.service`. As a fallback, `handbook-deploy.timer` checks GitHub every 10 minutes. Without either, a content change still shows up on its own within about 15 minutes, as the site rechecks the branch every 10 minutes and caches pages for 5.

The workflow's SSH key can only start the deploy. To set it up:

1. On any machine, create a key without a passphrase:

   ```bash
   ssh-keygen -t ed25519 -N '' -C github-deploy -f deploy_key
   ```

2. On the server, add the public key (`deploy_key.pub`) to the handbook user's `~/.ssh/authorized_keys`, limited to starting the deploy:

   ```
   restrict,command="systemctl --user start --no-block handbook-deploy.service" ssh-ed25519 AAAA… github-deploy
   ```

3. In the repository settings (Secrets and variables → Actions), add:

   | Name | Kind | Value |
   |---|---|---|
   | `DEPLOY_SSH_KEY` | secret | the private key, the whole of `deploy_key` |
   | `DEPLOY_SSH_TARGET` | variable | `user@host`, or `ssh://user@host:port` |
   | `DEPLOY_SSH_KNOWN_HOSTS` | variable | the server's host key: the output of `ssh-keyscan host` (`-p port` for another port) |

   Then delete `deploy_key`.

### Setup

1. Create a GitHub token the site reads the pages with: GitHub → Settings → Developer settings → Fine-grained tokens, resource owner `sps-fekt`, only the `handbook` repository, permission **Contents: Read-only**. Store it as a Podman secret:

   ```bash
   printf '%s' 'github_pat_…' | podman secret create handbook-github-token -
   ```

   When the token expires, replace it (`podman secret rm`, then create it again) and restart the site: `systemctl --user restart handbook.service`.

2. Check `config/handbook.env` (site URL, repository).
3. Run `~/repo/deploy/deploy.sh --install`.
