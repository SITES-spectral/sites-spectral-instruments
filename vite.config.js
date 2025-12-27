import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Vite Configuration for SITES Spectral Frontend
 *
 * This configuration builds the ES6 module frontend into optimized bundles.
 * The output is placed in public/dist/ and referenced from HTML files.
 *
 * @see https://vitejs.dev/config/
 */
export default defineConfig({
    // Disable public directory copying (we manage public assets separately)
    publicDir: false,

    // Build configuration
    build: {
        // Output to public/dist for Cloudflare Workers static assets
        outDir: 'public/dist',

        // Don't empty outDir on rebuild (preserve other assets)
        emptyOutDir: true,

        // Generate source maps for debugging
        sourcemap: true,

        // Generate manifest for server-side rendering
        manifest: true,

        // Rollup options for multi-entry build
        rollupOptions: {
            input: {
                // Main application entry points
                main: resolve(__dirname, 'src/frontend/main.js'),
                login: resolve(__dirname, 'src/frontend/login.js'),
                dashboard: resolve(__dirname, 'src/frontend/dashboard.js'),
            },
            output: {
                // Naming pattern for chunks (no hashes for easier HTML integration during migration)
                entryFileNames: '[name].bundle.js',
                chunkFileNames: 'chunks/[name].bundle.js',
                assetFileNames: 'assets/[name][extname]',

                // Manual chunks for better caching
                manualChunks: {
                    // Core utilities shared across all pages
                    'core': [
                        './src/frontend/core/utils.js',
                        './src/frontend/core/security.js',
                        './src/frontend/core/config.js',
                    ],
                    // API layer
                    'api': [
                        './src/frontend/api/client.js',
                    ],
                    // UI components
                    'components': [
                        './src/frontend/components/toast.js',
                        './src/frontend/components/modal.js',
                        './src/frontend/components/skeleton.js',
                    ],
                },
            },
        },

        // Target modern browsers
        target: 'es2020',

        // Minification
        minify: 'esbuild',
    },

    // Path aliases for cleaner imports
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src/frontend'),
            '@core': resolve(__dirname, 'src/frontend/core'),
            '@api': resolve(__dirname, 'src/frontend/api'),
            '@components': resolve(__dirname, 'src/frontend/components'),
            '@utils': resolve(__dirname, 'src/frontend/utils'),
        },
    },

    // Development server (for local testing)
    server: {
        port: 3000,
        open: false,
        // Proxy API requests to Wrangler dev server
        proxy: {
            '/api': {
                target: 'http://localhost:8787',
                changeOrigin: true,
            },
        },
    },

    // Preview server
    preview: {
        port: 4173,
    },

    // Define globals for compatibility
    define: {
        // Version info
        '__APP_VERSION__': JSON.stringify(process.env.npm_package_version || '13.15.0'),
    },
});
