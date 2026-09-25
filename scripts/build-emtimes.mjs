#!/usr/bin/env node
/**
 * Bouwt alle EM Times-pagina's opnieuw op uit emtimes-articles.js + de
 * artikelteksten: hub, categoriepagina's, artikels, RSS-feed en sitemap.
 *
 *   node scripts/build-emtimes.mjs
 *
 * Draai dit na elke handmatige wijziging aan een artikel of aan de sjablonen
 * in scripts/emtimes/lib.mjs. De dagelijkse generator roept dit zelf aan.
 */
import { build } from "./emtimes/lib.mjs";

build().catch((e) => { console.error("FOUT:", e.message); process.exit(1); });
