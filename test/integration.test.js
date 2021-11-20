import http from 'node:http'

/**
 * @param {string} hostname
 * @param {number=} port
 * @returns {Promise<string>}
 */
const request = async (hostname, port = 80) =>
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
    await expect(request('multiflare.test')).resolves.toBe('Page ok')
    await expect(request('www.multiflare.test')).resolves.toBe('Page ok')
    await expect(request('api.multiflare.test')).resolves.toBe('API ok')
    await expect(request('blog.multiflare.test')).resolves.toBe('Blog ok')
    await expect(request('chat.multiflare.test')).resolves.toBe('Chat ok')
  })
})
