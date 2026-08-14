import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const mediaDir = path.join(rootDir, 'realworld/assets/media');

function realworldAssets(): Plugin {
  return {
    name: 'realworld-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        if (!url.startsWith('/assets/')) {
          return next();
        }

        const file = path.join(mediaDir, url.slice('/assets/'.length));
        if (!file.startsWith(mediaDir) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
          return next();
        }

        res.setHeader('Content-Type', file.endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream');
        fs.createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), realworldAssets()],
  resolve: {
    alias: {
      '@': path.join(rootDir, 'src'),
    },
  },
  server: {
    port: 4200,
    strictPort: true,
  },
  build: {
    outDir: 'dist/react-conduit',
    emptyOutDir: true,
  },
});
