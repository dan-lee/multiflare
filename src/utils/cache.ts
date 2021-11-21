import type { Miniflare } from 'miniflare'
import type { CacheInterface, CacheStorage } from '@miniflare/cache'

const __caches = new WeakMap<Miniflare, CacheStorage>()

export const createCacheProxy = (mf: Miniflare) => {
  const getCache = async (name?: string) => {
    if (!__caches.has(mf)) {
      __caches.set(mf, await mf.getCaches())
    }
    const caches = __caches.get(mf)!

    return name ? caches.open(name) : caches.default
  }

  const createCacheProxyFn =
    (name: keyof CacheInterface, cacheName?: string) =>
    (...args: Parameters<CacheInterface['put']>) =>
    async () => {
      const cache = await getCache(cacheName)
      return cache[name](...args)
    }

  const methods = ['put', 'match', 'delete'] as const

  return {
    default: Object.fromEntries(
      methods.map((key) => [key, createCacheProxyFn(key)]),
    ),
    open: (name: string) =>
      Object.fromEntries(
        methods.map((key) => [key, createCacheProxyFn(key, name)]),
      ),
  }
}
