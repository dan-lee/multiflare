export default {
  async fetch(request) {
    const url = new URL(request.url)

    if (url.pathname === '/cache') {
      const cache = caches.default

      if (request.method === 'POST') {
        const text = await request.text()
        await cache.put(
          'http://multiflare.test',
          new Response(text, {
            // very important to set!
            headers: { 'Cache-Control': 'max-age=3600' },
          }),
        )
      }

      return cache.match('http://multiflare.test')
    } else {
      return new Response('Page ok')
    }
  },
}
