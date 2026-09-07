/**
 * Génère la paire de clés attendue par Convex Auth : JWT_PRIVATE_KEY et JWKS.
 *
 * À n'utiliser que si `npx @convex-dev/auth` ne peut pas tourner ; cette
 * commande fait la même chose et pose les valeurs directement dans Convex.
 * Ici, les valeurs sont affichées et se collent à la main dans les variables
 * d'environnement du déploiement Convex concerné.
 *
 *   node scripts/generer-cles-auth.mjs
 *
 * Une paire par déploiement : n'utilise pas les mêmes clés en dev et en prod.
 */

import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

// `extractable` est obligatoire depuis jose 6 pour pouvoir exporter la clé.
const paire = await generateKeyPair("RS256", { extractable: true });
const clePrivee = await exportPKCS8(paire.privateKey);
const clePublique = await exportJWK(paire.publicKey);

// Convex Auth stocke la clé privée sur une seule ligne : les retours à la
// ligne du format PKCS#8 sont remplacés par des espaces.
console.log("JWT_PRIVATE_KEY");
console.log(clePrivee.trimEnd().replace(/\n/g, " "));
console.log();
console.log("JWKS");
console.log(JSON.stringify({ keys: [{ use: "sig", ...clePublique }] }));
