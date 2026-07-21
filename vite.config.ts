import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import net from 'net';

/**
 * Encontra a primeira porta TCP disponível a partir de uma porta inicial.
 * Evita conflitos de porta em modo não-interativo de forma silenciosa e robusta.
 */
function getAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, '0.0.0.0', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : startPort;
      server.close(() => {
        resolve(port);
      });
    });
    server.on('error', () => {
      resolve(getAvailablePort(startPort + 1));
    });
  });
}

export default defineConfig(async ({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const apiAssetsTarget = env.VITE_API_BASE_URL || 'https://lojas.vlks.com.br';

    // Determina portas disponíveis de forma dinâmica para evitar erros de porta ocupada
    const port = await getAvailablePort(8888);
    const previewPort = await getAvailablePort(8889);

    return {
      server: {
        port,
        host: '0.0.0.0',
        strictPort: true, // Evita prompts interativos de confirmação no terminal
        proxy: {
          '/api': {
            target: apiAssetsTarget,
            changeOrigin: true,
            secure: true,
          },
          '/api-assets': {
            target: apiAssetsTarget,
            changeOrigin: true,
            secure: true,
            rewrite: (p) => p.replace(/^\/api-assets/, ''),
          },
        },
      },
      preview: {
        port: previewPort,
        strictPort: true,
        proxy: {
          '/api': {
            target: apiAssetsTarget,
            changeOrigin: true,
            secure: true,
          },
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
