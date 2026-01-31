import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  outDir: 'dist',
  // Don't bundle Node.js built-ins and packages that use them
  external: [
    'crypto',
    'stream',
    'buffer',
    'util',
    'events',
    'path',
    'fs',
    'os',
    'net',
    'tls',
    'http',
    'https',
    'url',
    'zlib',
    'dns',
    'child_process',
    // External packages that have native dependencies
    '@fastify/cookie',
    'bcrypt',
  ],
  // Keep external modules as imports, not bundled
  noExternal: [],
  // Clean output directory
  clean: true,
  // Target Node.js 20
  target: 'node20',
  // Generate sourcemaps
  sourcemap: true,
});
