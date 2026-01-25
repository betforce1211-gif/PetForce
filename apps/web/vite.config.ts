import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@petforce/auth': path.resolve(__dirname, '../../packages/auth/src'),
      '@petforce/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
  optimizeDeps: {
    exclude: ['expo-local-authentication'],
  },
  server: {
    port: 3000,
  },
});
