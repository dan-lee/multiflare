import http from 'node:http'
import crypto from 'node:crypto'

import multiflare from '../src/multiflare'

/**
 * @param {string} hostname
 * @param {number=} port
 * @returns {Promise<string>}
 */
const request = async (hostname: string, port = 80) =>
  new Promise((resolve, reject) => {
    http
      .request(`http://${hostname}`, (res) =>
        res.on('data', (buf) => resolve(buf.toString())),
      )
      .on('error', reject)
      .end()
  })

describe('multiflare', () => {
  it('should respond', async () => {
    const { stop } = await multiflare({
      rootDir: './test/test-workers',
      logLevel: 'error',
    })

    await expect(request('multiflare.test')).resolves.toBe('Page ok')
    await expect(request('www.multiflare.test')).resolves.toBe('Page ok')
    await expect(request('api.multiflare.test')).resolves.toBe('API ok')
    await expect(request('blog.multiflare.test')).resolves.toBe('Blog ok')
    await expect(request('chat.multiflare.test')).resolves.toBe('Chat ok')

    await stop()
  })

  it('should work with KV', async () => {
    const { stop, kv } = await multiflare({
      rootDir: './test/test-workers',
    })

    const key = crypto.randomBytes(5).toString('hex')
    const value = crypto.randomBytes(5).toString('hex')

    await kv('blog', 'BLOG_ENTRIES').put(key, JSON.stringify(value))

    await expect(request(`blog.multiflare.test/${key}`)).resolves.toBe(value)

    await stop()
  })
})
