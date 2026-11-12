import { readFile } from 'node:fs/promises'

// The commit the site runs: the one deploy.sh last deployed (DEPLOY_VERSION_FILE,
// written on every push, content included), or else the commit the site was
// built from (in development). Shown in the footer.
export default defineEventHandler(async (event) => {
  const file = process.env.DEPLOY_VERSION_FILE
  const deployed = file ? (await readFile(file, 'utf8').catch(() => '')).trim() : ''
  return { commit: deployed || useRuntimeConfig(event).public.commit || null }
})
