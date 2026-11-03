// Headless Chrome/Edge via het DevTools-protocol, zonder npm-pakketten. De code staat in de skill design-taste-frontend
// van het AI-team (map ai-team naast de map Websites in de gedeelde OneDrive); dit bestand laadt ze alleen.
// Alleen nodig voor maak-og.mjs en controle.mjs, niet voor de site of de Worker. Staat de map elders, zet dan EM_CDP_LIB.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const hier = path.dirname(fileURLToPath(import.meta.url));
const lib = process.env.EM_CDP_LIB
  || path.resolve(hier, '..', '..', '..', '..', '..', '..', 'ai-team', '.claude', 'skills', 'design-taste-frontend', 'scripts', 'lib', 'cdp.mjs');
const mod = await import(pathToFileURL(lib).href);
export const { Browser, sleep } = mod;
