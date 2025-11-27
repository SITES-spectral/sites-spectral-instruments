import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    globals: true,
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
        miniflare: {
          // Mock D1 database for testing
          d1Databases: ['DB'],
          kvNamespaces: ['KV'],
        },
      },
    },
    // Test file patterns
    include: ['tests/**/*.test.js', 'tests/**/*.spec.js'],
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: ['src/**/*.test.js', 'node_modules/**'],
    },
    // Timeout for async tests
    testTimeout: 30000,
    // Reporter
    reporters: ['verbose'],
  },
});
