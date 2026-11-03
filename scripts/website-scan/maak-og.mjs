#!/usr/bin/env node
/**
 * Maakt assets/og-website-scan.png (1200 x 630) uit scripts/paginas/website-scan/og.html met headless Chrome of Edge.
 *   node scripts/website-scan/maak-og.mjs
 * Gebruikt de CDP-hulp uit de skill design-taste-frontend van het AI-team (geen npm-pakketten nodig).
 */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Browser } from './cdp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const bron = pathToFileURL(path.join(ROOT, 'scripts/paginas/website-scan/og.html')).href;
const uit = path.join(ROOT, 'assets/og-website-scan.png');
const b = await Browser.launch({ width: 1200, height: 630 });
try {
  const p = await b.newPage({ width: 1200, height: 630 });
  await p.goto(bron, { settleMs: 800 });
  await p.screenshot({ path: uit, format: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
  console.log('gemaakt:', path.relative(ROOT, uit));
} finally { await b.close(); }
