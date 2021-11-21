addEventListener('fetch', async (e) => {
  const { pathname } = new URL(e.request.url)

  if (pathname === '/') {
    e.respondWith(new Response('Blog ok'))
  } else {
    e.respondWith(
      BLOG_ENTRIES.get(pathname.slice(1), 'json').then(
        (value) => new Response(value),
      ),
    )
  }
})
