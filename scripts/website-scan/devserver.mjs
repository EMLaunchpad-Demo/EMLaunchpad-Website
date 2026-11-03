#!/usr/bin/env node
/**
 * Lokale testserver voor de gratis website scan, zonder wrangler: serveert de statische site zoals scripts/devserver.py
 * (nette URL's, 404.html met status 404) en stuurt POST /api/scan naar dezelfde code als de Worker (worker/index.js).
 *
 *   node scripts/website-scan/devserver.mjs [poort]          standaard 8795
 *
 * Zonder de Rate Limiting-binding van Cloudflare: de Worker valt dan terug op zijn eigen teller (8 scans per minuut).
 * _redirects en _headers worden hier niet toegepast (dat doet Cloudflare).
 */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleScan } from '../../worker/index.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PORT = Number(process.argv[2]) || 8795;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.webmanifest': 'application/manifest+json', '.mp4': 'video/mp4',
};
const VERBODEN = /^\/(\.git|\.github|\.claude|scripts|worker|controle|node_modules)(\/|$)|\.(py|md)$|^\/wrangler\.jsonc$/i;

async function bestand(p) {
  try { const s = await stat(p); return s.isFile() ? p : s.isDirectory() ? bestand(path.join(p, 'index.html')) : null; } catch { return null; }
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);
  if (u.pathname.startsWith('/api/')) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const request = new Request(u.href, { method: req.method, headers: Object.entries(req.headers).filter(([, v]) => typeof v === 'string'), body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) });
    const r = u.pathname === '/api/scan' ? await handleScan(request, {}) : new Response('{"ok":false}', { status: 404, headers: { 'content-type': 'application/json' } });
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(Buffer.from(await r.arrayBuffer()));
    console.log(new Date().toISOString().slice(11, 19), req.method, u.pathname, r.status);
    return;
  }
  let pad;
  try { pad = decodeURIComponent(u.pathname); } catch { pad = u.pathname; }
  let f = null;
  if (!VERBODEN.test(pad)) {
    const p = path.join(ROOT, pad);
    if (p.startsWith(ROOT)) f = (await bestand(p)) || (await bestand(p + '.html'));
  }
  const status = f ? 200 : 404;
  f ||= path.join(ROOT, '404.html');
  const body = await readFile(f);
  res.writeHead(status, { 'content-type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(req.method === 'HEAD' ? undefined : body);
}).listen(PORT, () => console.log(`Website scan lokaal op http://localhost:${PORT}/gratis-website-scan`));
