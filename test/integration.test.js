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
    await expect(request('my-workshop.test')).resolves.toBe('Website ok')
    await expect(request('www.my-workshop.test')).resolves.toBe('Website ok')
    await expect(request('api.my-workshop.test')).resolves.toBe('API ok')
    await expect(request('account.my-workshop.test')).resolves.toBe(
      'Account ok',
    )
  })
})
