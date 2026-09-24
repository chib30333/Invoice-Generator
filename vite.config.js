import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.ttf'],
  server: { host: '127.0.0.1', port: 5173 }, // explicit IPv4 loopback; VPNs can break "localhost" resolution
  build: { chunkSizeWarningLimit: 2000 }, // @react-pdf/renderer is large by nature
});
