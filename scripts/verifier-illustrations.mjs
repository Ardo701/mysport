/*
 * Chaque exercice du programme a-t-il ses deux dessins ?
 *
 * Une illustration manquante ne casse rien — le composant ne rend alors rien —
 * mais ne se voit pas non plus tant qu'on n'ouvre pas la bonne séance dans la
 * bonne variante. D'où cette vérification, à lancer après avoir touché aux
 * exercices ou aux scènes :
 *
 *   node scripts/verifier-illustrations.mjs
 *
 * Elle lit les deux fichiers comme du texte plutôt que de les importer : le
 * module des scènes est du TSX, que Node ne sait pas exécuter tel quel.
 */

import { readFileSync } from "node:fs";

const programme = readFileSync("convex/data/programme.ts", "utf8");
const scenes = readFileSync("composants/illustrations/scenes.tsx", "utf8");

// Six espaces d'indentation : c'est le niveau des exercices. Les séances, qui
// portent aussi un « id », sont deux niveaux plus haut.
const exercices = [...programme.matchAll(/^ {6}id: "([a-z-]+)",$/gm)].map((m) => m[1]);
const dessinees = new Set([...scenes.matchAll(/^  "([a-z-]+\/(?:salle|maison))": \(\)/gm)].map((m) => m[1]));

const manquantes = [];
for (const id of exercices) {
  for (const variante of ["salle", "maison"]) {
    if (!dessinees.has(`${id}/${variante}`)) manquantes.push(`${id}/${variante}`);
  }
}

const orphelines = [...dessinees].filter(
  (cle) => !exercices.includes(cle.slice(0, cle.lastIndexOf("/"))),
);

if (manquantes.length > 0) {
  console.error(`Dessins manquants (${manquantes.length}) : ${manquantes.join(", ")}`);
}
if (orphelines.length > 0) {
  console.error(`Dessins sans exercice (${orphelines.length}) : ${orphelines.join(", ")}`);
}
if (manquantes.length > 0 || orphelines.length > 0) process.exit(1);

console.log(`${exercices.length} exercices, ${dessinees.size} dessins : rien ne manque.`);
