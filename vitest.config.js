import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Test file patterns
    include: ['tests/**/*.test.js', 'tests/**/*.spec.js'],
    // Exclude patterns
    exclude: ['node_modules/**', 'dist/**'],
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
    // Setup files
    setupFiles: ['./tests/setup.js'],
  },
});
