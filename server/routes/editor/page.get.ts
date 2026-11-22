// A page's Markdown for the editor (?path=cs/2.studies/3.tips-and-tricks), as on
// GitHub now, read with the site's token. Its sha comes back with the proposal
// (propose.post.ts), so a page changed in the meantime isn't overwritten.
// A translation that doesn't exist yet comes as the Czech page, to translate,
// with no sha: proposing it creates the file.
export default defineEventHandler(async (event) => {
  const file = contentFile(getQuery(event).path)
  const read = (path: string) => github<{ content: string, sha: string }>(githubToken(), `/repos/${githubRepo()}/contents/${path}`, {
    query: { ref: targetBranch() },
  })
  const czech = file.replace(/^content\/[a-z]{2}\//, 'content/cs/')
  const page = await read(file).catch((error) => {
    if (error.statusCode !== 404 || file === czech) throw error
    return read(czech).then(({ content }) => ({ content, sha: '' }))
  })
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return { content: Buffer.from(page.content, 'base64').toString('utf8'), sha: page.sha }
})
