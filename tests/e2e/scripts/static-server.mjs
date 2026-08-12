/**
 * Servidor estático mínimo para o build do frontend (`dist/`).
 *
 * Existe para não depender de `vite preview`: o `vite.config.ts` do app escolhe
 * a porta dinamicamente (getAvailablePort), o que impede prever a URL base dos
 * testes. Aqui a porta é fixa e determinística.
 *
 * O app usa HashRouter, então nem precisa de fallback SPA — mas ele está aqui
 * de qualquer forma para o caso de o roteamento mudar.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../../dist', import.meta.url)));
const PORT = Number.parseInt(process.env.E2E_WEB_PORT ?? '4173', 10);
const HOST = process.env.E2E_WEB_HOST ?? '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

if (!existsSync(ROOT)) {
  console.error(`[e2e] build do frontend não encontrado em ${ROOT}. Rode "npm run build" na raiz do app.`);
  process.exit(1);
}

const resolveFile = (urlPath) => {
  const clean = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  const candidate = resolve(join(ROOT, normalize(clean)));
  // Bloqueia path traversal para fora de dist/.
  if (!candidate.startsWith(ROOT)) return null;
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  const indexed = join(candidate, 'index.html');
  if (existsSync(indexed)) return indexed;
  return join(ROOT, 'index.html'); // fallback SPA
};

const server = createServer((req, res) => {
  const file = resolveFile(req.url ?? '/');
  if (!file || !existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  res.writeHead(200, {
    'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  createReadStream(file).pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`[e2e] frontend servido em http://${HOST}:${PORT} (raiz: ${ROOT})`);
});
