// Proposes an edited page: commits it to a new branch and opens a pull request
// against the site's branch. Editors who can't push to the repository get a
// fork (GitHub's own "edit this file" does the same). Body: { path, content, sha, title };
// no sha for a new file (a translation that didn't exist, page.get.ts).
export default defineEventHandler(async (event) => {
  const { user: { login }, secure } = await requireUserSession(event)
  const token = secure!.token
  const { path, content, sha, title } = await readBody(event)
  const file = contentFile(path)
  if (typeof content !== 'string' || typeof sha !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Missing page content' })
  }
  const message = String(title || `Update ${file}`).slice(0, 200)
  const repo = githubRepo()
  const base = targetBranch()

  const { permissions } = await github<{ permissions?: { push?: boolean } }>(token, `/repos/${repo}`)
  const head = permissions?.push
    ? repo
    : (await github<{ full_name: string }>(token, `/repos/${repo}/forks`, { method: 'POST', body: { default_branch_only: true } })).full_name

  // A new fork takes a few seconds to appear, hence the retries.
  const { object } = await github<{ object: { sha: string } }>(token, `/repos/${repo}/git/ref/heads/${base}`)
  const branch = `edit/${login}-${Date.now().toString(36)}`
  await github(token, `/repos/${head}/git/refs`, {
    method: 'POST',
    body: { ref: `refs/heads/${branch}`, sha: object.sha },
    retry: 9,
    retryDelay: 2000,
    retryStatusCodes: [404, 409, 422],
  })

  // With the page's sha as loaded, GitHub refuses (409) if it has changed since;
  // without one, if the file has appeared since (422).
  await github(token, `/repos/${head}/contents/${file}`, {
    method: 'PUT',
    body: { message, branch, ...(sha ? { sha } : {}), content: Buffer.from(content, 'utf8').toString('base64') },
  })

  const pull = await github<{ html_url: string, number: number }>(token, `/repos/${repo}/pulls`, {
    method: 'POST',
    body: { title: message, head: head === repo ? branch : `${login}:${branch}`, base, body: `Proposed in the page editor by @${login}.`, maintainer_can_modify: true },
  })
  // The site previews it at /pr/<number>/… (comark-docs); a fork's pull request
  // only once a maintainer adds the preview:enabled label.
  return { url: pull.html_url, number: pull.number, previewable: head === repo }
})
