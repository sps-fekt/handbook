import { verify } from '@octokit/webhooks-methods'

// GitHub calls this on every push (a repository webhook, see README.md).
// A push to the site's branch makes the new content live right away instead of
// within the 10 minutes the site otherwise takes to notice the new commit, and
// updates the translation status. The layer's own /api/revalidate does the
// same on Vercel only.
export default defineEventHandler(async (event) => {
  const { docs } = useRuntimeConfig(event)
  const secret = docs.webhookSecret || process.env.WEBHOOK_SECRET
  if (!secret) throw createError({ statusCode: 501, statusMessage: 'Webhook secret not set' })

  const body = (await readRawBody(event, 'utf8')) ?? ''
  const signature = getHeader(event, 'x-hub-signature-256') ?? ''
  if (!signature || !(await verify(secret, body, signature))) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid signature' })
  }

  const branch = targetBranch()
  const push = getHeader(event, 'x-github-event') === 'push' ? JSON.parse(body) : undefined
  if (push?.ref !== `refs/heads/${branch}`) return { ok: true, skipped: true }

  const sha = await resolveContentSha(branch, docs.contentDir, { refresh: true })
  // Takes a few seconds (git pull); GitHub doesn't need to wait for it.
  // A failed run is logged in refreshTranslationStatus().
  refreshTranslationStatus().catch(() => {})
  return { ok: true, sha }
})
