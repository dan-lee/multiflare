/**
 * The root worker gets compiled by multiflare with esbuild and
 * delegates the requests to the according miniflare mounts..
 */
import matchUrl from 'match-url-wildcard'

export default {
  /**
   * @param {Request} req
   * @param {{ routes: Record<string, string[]>, https: boolean }} env
   */
  async fetch(req, env) {
    const project = Object.entries(env.routes).find(([, routes]) =>
      routes.find((route) => matchUrl(req.url, route)),
    )?.[0]

    if (!project) {
      return
    }

    const url = new URL(req.url)

    url.protocol = env.https ? 'https' : 'http'
    url.pathname = `/${project}${url.pathname}`

    return fetch(url.toString(), req)
  },
}
