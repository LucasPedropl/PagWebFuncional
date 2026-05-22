import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const apiAssetsTarget = env.VITE_API_BASE_URL || 'https://lojas.vlks.com.br';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api-assets': {
            target: apiAssetsTarget,
            changeOrigin: true,
            secure: true,
            rewrite: (p) => p.replace(/^\/api-assets/, ''),
          },
        },
      },
      preview: {
        port: 3000,
        proxy: {
          '/api-assets': {
            target: apiAssetsTarget,
            changeOrigin: true,
            secure: true,
            rewrite: (p) => p.replace(/^\/api-assets/, ''),
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
