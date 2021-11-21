addEventListener('fetch', async (e) => {
  const { pathname } = new URL(e.request.url)

  if (pathname === '/') {
    e.respondWith(new Response('Blog ok'))
  } else {
    const entry = BLOG_ENTRIES.get(pathname.slice(1), 'json')

    e.respondWith(entry.then((value) => new Response(value)))
  }
})
