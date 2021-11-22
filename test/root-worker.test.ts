import { jest } from '@jest/globals'
import rootWorker from '../src/root-worker'

const fetchInterceptor = jest.fn()
;(globalThis as any).fetch = fetchInterceptor

beforeEach(fetchInterceptor.mockReset)

describe('rootWorker', () => {
  it('should match and fetch route', async () => {
    // blog.example.test is routed to 127.0.0.1
    const url = 'http://blog.example.test/news'
    await rootWorker.fetch(new Request(url), {
      routes: { blog: ['blog.example.test/*'] },
    })

    // still 127.0.0.1 replies (subdomain is not relevant) but with appended mount path
    expect(fetchInterceptor.mock.calls[0][0]).toBe(
      'http://blog.example.test/blog/news',
    )
  })

  it('should do nothing if no route matches', async () => {
    const url = 'http://i-do-not-exist.example.test/'
    await rootWorker.fetch(new Request(url), {
      routes: { api: ['api.example.test/*'] },
    })

    expect(fetchInterceptor).not.toHaveBeenCalled()
  })
})
