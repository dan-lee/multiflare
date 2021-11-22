export default {
  async fetch(request) {
    const url = new URL(request.url)

    if (url.pathname === '/from-cache') {
      return caches.default.match('http://multiflare.test/in-cache')
    } else {
      return new Response('Page ok')
    }
  },
}
