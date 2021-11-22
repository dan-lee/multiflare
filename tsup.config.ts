import { defineConfig } from 'tsup'

export default defineConfig({
  env: { NODE_ENV: 'production' },
  splitting: true,
  sourcemap: false,
  format: ['esm'],
  clean: true,
  target: 'node16',
  dts: true,
  entryPoints: ['src/multiflare.ts', 'src/cli.ts'],
})
