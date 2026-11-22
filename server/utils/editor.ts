// The page editor's server side: /editor/login, /editor/page, /editor/propose
// (server/routes/editor/). Sign-in and the session are nuxt-auth-utils; the
// signed-in editor's GitHub token is the session's secure part.
declare module '#auth-utils' {
  interface User { login: string, avatar: string }
  interface SecureSessionData { token: string }
}

/** A GitHub REST call (anonymous without a token); GitHub's message becomes the error. */
export function github<T>(token: string | undefined, path: string, options: Parameters<typeof $fetch>[1] = {}) {
  return $fetch<T>(`https://api.github.com${path}`, {
    ...options,
    headers: { Accept: 'application/vnd.github+json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  }).catch((error) => {
    throw createError({ statusCode: error.statusCode ?? 502, statusMessage: `GitHub: ${error.data?.message ?? 'no answer'}` })
  })
}

/** cs/2.studies/3.tips-and-tricks → content/cs/2.studies/3.tips-and-tricks.md; nothing outside content/. */
export function contentFile(path: unknown) {
  if (typeof path !== 'string' || !/^[a-z]{2}(\/[\w-][\w.-]*)+$/.test(path)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid page path' })
  }
  return `content/${path}.md`
}
