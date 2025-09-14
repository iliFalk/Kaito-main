import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import { readFileSync } from 'fs';

/**
 * Vite config for building the extension.
 * Uses @crxjs/vite-plugin to emit a browser extension build using manifest.json
 *
 * Note: @crxjs expects the manifest option to be an object (not a path string).
 * We read and parse manifest.json here and pass the object to the plugin.
 */
const manifest = JSON.parse(
  readFileSync(new URL('./manifest.json', import.meta.url), 'utf-8')
);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.')
      }
    },
    plugins: [
      // Pass the parsed manifest object to the CRX plugin
      crx({ manifest })
    ],
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        input: {
          // Ensure sidepanel entry and any other html entrypoints are preserved
          sidepanel: 'sidepanel/index.html'
        },
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom']
          }
        }
      }
    }
  };
});
