import crypto from 'node:crypto'
import { fetch, RequestInfo, RequestInit } from 'undici'

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
    const { stop, getWorker } = await multiflare({
      rootDir: './test/test-workers',
    })

    const key = crypto.randomBytes(5).toString('hex')
    const value = crypto.randomBytes(5).toString('hex')

    await getWorker('blog').kv('BLOG_ENTRIES').put(key, JSON.stringify(value))

    await expect(request(`blog.multiflare.test/${key}`)).resolves.toBe(value)

    await stop()
  })

  it('should work with Cache', async () => {
    const { stop } = await multiflare({
      rootDir: './test/test-workers',
    })

    const toTest = { test: 'cached value' }

    await request(`multiflare.test/cache`, {
      method: 'POST',
      body: JSON.stringify(toTest),
    })

    expect(await request('multiflare.test/cache', undefined, 'json')).toEqual(
      toTest,
    )

    await stop()
  })
})
