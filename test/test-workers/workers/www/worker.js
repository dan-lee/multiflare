export default {
  async fetch(request) {
    const url = new URL(request.url)

    if (url.pathname === '/cache') {
      const cache = caches.default

      return cache.match('http://multiflare.test')
    } else {
      return new Response('Page ok')
    }
  },
}
