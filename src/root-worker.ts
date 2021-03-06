/**
 * The root worker gets compiled by multiflare with esbuild and
 * delegates the requests to the according miniflare mounts..
 */
import matchUrl from 'match-url-wildcard'

export default {
  async fetch(
    req: Request,
    env: { routes: Record<string, string[]>; https?: boolean },
  ) {
    const [project] =
      Object.entries(env.routes).find(([, routes]) =>
        routes.find((route) => matchUrl(req.url, route)),
      ) ?? []

    if (!project) {
      return
    }

    const url = new URL(req.url)

    url.protocol = env.https ? 'https' : 'http'
    url.pathname = `/${project}${url.pathname}`

    const response = await fetch(url.toString(), req)

    return response.redirected ? Response.redirect(response.url) : response
  },
}
