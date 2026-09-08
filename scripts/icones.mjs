/**
 * Génère les icônes PNG à partir de `app/icon.svg`.
 *
 * Le SVG suffit aux navigateurs de bureau, mais iOS ne sait pas le lire pour
 * l'écran d'accueil : sans PNG, l'icône ajoutée est une capture de la page.
 *
 * Deux découpes à partir du même dessin :
 *  - arrondie, telle quelle, pour les icônes classiques ;
 *  - carrée pleine, pour iOS et pour les icônes « maskable » d'Android, qui
 *    appliquent eux-mêmes leur masque et laisseraient sinon des coins vides.
 *
 * À relancer après toute retouche du logo : `node scripts/icones.mjs`.
 */

import { readFile, writeFile } from "node:fs/promises";

// sharp arrive avec Next.js, en dépendance optionnelle. Le déclarer en plus
// ici sortirait ses binaires natifs du graphe de production dans le lockfile,
// pour un script qui ne tourne jamais pendant un build : on l'emprunte, et on
// le dit clairement s'il manque.
let sharp;
try {
  ({ default: sharp } = await import("sharp"));
} catch {
  throw new Error("sharp est introuvable : lancer `npm install`, ou `npx sharp-cli`.");
}

const source = await readFile(new URL("../app/icon.svg", import.meta.url), "utf8");

/** Le fond arrondi devient un carré plein : le masque du système le rognera. */
const pleine = source.replace(/(<rect width="512" height="512")\s+rx="\d+"/, "$1");
if (pleine === source) {
  throw new Error("Fond du logo introuvable : app/icon.svg a changé de forme.");
}

const SORTIES = [
  { fichier: "../app/apple-icon.png", svg: pleine, taille: 180 },
  { fichier: "../public/icone-maskable-512.png", svg: pleine, taille: 512 },
  { fichier: "../public/icone-192.png", svg: source, taille: 192 },
  { fichier: "../public/icone-512.png", svg: source, taille: 512 },
];

for (const { fichier, svg, taille } of SORTIES) {
  const png = await sharp(Buffer.from(svg), { density: 512 })
    .resize(taille, taille)
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(new URL(fichier, import.meta.url), png);
  console.log(`${fichier.replace("../", "")} — ${taille}px, ${png.length} octets`);
}
