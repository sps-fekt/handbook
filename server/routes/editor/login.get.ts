// GitHub sign-in for the page editor (nuxt-auth-utils), with scope public_repo:
// enough to fork the repository, push a branch and open a pull request. The
// token stays server-side (the session's secure part). ?return= is where the
// editor goes back to; GitHub drops the query, so it waits in a cookie.
const signIn = defineOAuthGitHubEventHandler({
  config: { scope: ['public_repo'] },
  async onSuccess(event, { user, tokens }) {
    await setUserSession(event, { user: { login: user.login, avatar: user.avatar_url }, secure: { token: tokens.access_token } })
    const back = getCookie(event, 'editor-return') ?? '/'
    deleteCookie(event, 'editor-return')
    return sendRedirect(event, back)
  },
})

export default defineEventHandler((event) => {
  const back = getQuery(event).return
  if (typeof back === 'string' && /^\/(?![/\\])/.test(back)) {
    setCookie(event, 'editor-return', back, { httpOnly: true, sameSite: 'lax', maxAge: 600 })
  }
  return signIn(event)
})
