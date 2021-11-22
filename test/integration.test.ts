import crypto from 'node:crypto'
import { fetch, RequestInfo, RequestInit, Response } from 'undici'

import multiflare from '../src/multiflare'

const request = async (
  hostname: RequestInfo,
  options?: RequestInit,
  type: 'text' | 'json' = 'text',
) => {
  const res = await fetch(`http://${hostname}`, options)

  return await res[type]()
}

describe('multiflare', () => {
  it('should respond', async () => {
    const { stop } = await multiflare({ rootDir: './test/test-workers' })

    await expect(request('multiflare.test')).resolves.toBe('Page ok')
    await expect(request('www.multiflare.test')).resolves.toBe('Page ok')
    await expect(request('api.multiflare.test')).resolves.toBe('API ok')
    await expect(request('blog.multiflare.test')).resolves.toBe('Blog ok')
    await expect(request('chat.multiflare.test')).resolves.toBe('Chat ok')

    await stop()
  })

  it('should work with KV', async () => {
    const { stop, miniflare } = await multiflare({
      rootDir: './test/test-workers',
    })

    const key = crypto.randomBytes(5).toString('hex')
    const value = crypto.randomBytes(5).toString('hex')

    const kv = await miniflare.getKVNamespace('BLOG_ENTRIES')
    await kv.put(key, JSON.stringify(value))

    await expect(request(`blog.multiflare.test/${key}`)).resolves.toBe(value)

    await stop()
  })

  it('should work with Cache', async () => {
    const { stop, miniflare } = await multiflare({
      rootDir: './test/test-workers',
    })

    const toTest = { test: 'cached 133' }

    const caches = await miniflare.getCaches()
    await caches.default.put(
      'http://multiflare.test/from-cache',
      new Response(JSON.stringify(toTest), {
        // very important to set!
        headers: { 'Cache-Control': 'max-age=86400' },
      }),
    )

    expect(
      await request('www.multiflare.test/from-cache', undefined, 'json'),
    ).toEqual(toTest)

    await stop()
  })
})
