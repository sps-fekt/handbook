import { createLunaria } from '@lunariajs/core'
import config from '../../lunaria.config'

// Translation status for /cs/translations, from Lunaria (lunaria.config.ts).
// In production Lunaria keeps its own clone of the repository in /tmp and
// pulls it on every run, so a content push needs no rebuild; in development
// it reads the local repository. Rerun on every push (server/api/webhook.post.ts)
// and at most every 10 minutes, as the site rechecks the content; the previous
// status is served meanwhile.

const MAX_AGE = 10 * 60 * 1000

let status: ReturnType<typeof run> | undefined
let started = 0
// One run at a time: they share the clone.
let queue: Promise<unknown> = Promise.resolve()

async function run() {
  const lunaria = await createLunaria({
    logLevel: 'warn',
    config: import.meta.dev
      ? config
      : { ...config, external: true, cacheDir: '/tmp/lunaria/cache', cloneDir: '/tmp/lunaria/history' },
  })
  // Only what the page shows: no file contents, and no commit authors (their emails).
  const commit = ({ hash, date, message }: { hash: string, date: string, message: string }) => ({ hash, date, message })
  return (await lunaria.getFullStatus()).map(({ source, localizations }) => ({
    source: { path: source.path, git: { latestTrackedCommit: commit(source.git.latestTrackedCommit) } },
    localizations: localizations.map((localization) => ({
      path: localization.path,
      lang: localization.lang,
      status: localization.status,
      git: 'git' in localization ? { latestTrackedCommit: commit(localization.git.latestTrackedCommit) } : undefined,
    })),
  }))
}

export function refreshTranslationStatus() {
  started = Date.now()
  const next = queue.then(run)
  queue = next.catch(() => {})
  next.then(
    () => { status = next },
    (error) => {
      console.error('[translations] Lunaria failed', error)
      if (status === next) status = undefined
    },
  )
  status ??= next
  return next
}

export function translationStatus() {
  // A failed run is logged in refreshTranslationStatus().
  if (!status || Date.now() - started > MAX_AGE) refreshTranslationStatus().catch(() => {})
  return status!
}
