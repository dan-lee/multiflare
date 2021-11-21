/** @type {import('@jest/types').Config.InitialOptions} */
export default {
  testEnvironment: 'miniflare',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '\\.[tj]sx?$': ['esbuild-jest', { format: 'esm', target: 'esnext' }],
  },
}
