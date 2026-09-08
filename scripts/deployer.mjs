/**
 * Commande de build exécutée par Vercel.
 *
 * Elle prépare le déploiement Convex avant de construire l'application, pour
 * qu'aucune configuration ne reste à faire à la main :
 *
 *   1. génère la paire de clés de Convex Auth si elle manque ;
 *   2. cale SITE_URL sur l'URL du déploiement Vercel ;
 *   3. synchronise OPENAI_API_KEY depuis les variables Vercel vers Convex ;
 *   4. déploie les fonctions Convex, puis lance le build Next.
 *
 * Les clés de session ne sont jamais réécrites : en regénérer déconnecterait
 * tous les comptes. Les variables OpenAI, elles, suivent Vercel, qui est
 * l'endroit où on les saisit.
 */

import { execFileSync } from "node:child_process";
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const journal = (message) => console.log(`[deploiement] ${message}`);

function convex(args, { silencieux = false } = {}) {
  return execFileSync("npx", ["convex", ...args], {
    encoding: "utf8",
    stdio: silencieux ? ["ignore", "pipe", "pipe"] : ["ignore", "pipe", "inherit"],
  });
}

if (!process.env.CONVEX_DEPLOY_KEY) {
  console.error(
    "\n[deploiement] CONVEX_DEPLOY_KEY est absente des variables d'environnement.\n" +
      "Sans elle, impossible de savoir vers quel déploiement Convex publier.\n" +
      "Ajoute-la dans Vercel : Settings > Environment Variables.\n" +
      "La clé se génère dans le tableau de bord Convex : Settings > Deploy keys.\n",
  );
  process.exit(1);
}

/**
 * Variables déjà définies sur le déploiement Convex ciblé, valeurs comprises.
 *
 * Un déploiement neuf répond une liste vide, ce qui est légitime. En revanche
 * un échec de la commande n'est jamais interprété comme « aucune variable » :
 * on s'arrêterait sinon à regénérer des clés déjà en place, ce qui
 * déconnecterait tous les comptes existants.
 */
function variablesExistantes() {
  let sortie;
  try {
    sortie = convex(["env", "list"], { silencieux: true });
  } catch (erreur) {
    console.error(
      "\n[deploiement] Impossible de lire les variables du déploiement Convex.\n" +
        "La clé CONVEX_DEPLOY_KEY est peut-être invalide, ou le déploiement " +
        "injoignable.\n" +
        (erreur.stderr ? `\n${erreur.stderr}\n` : ""),
    );
    process.exit(1);
  }

  // Les valeurs servent à repérer une clé changée dans Vercel ; elles restent
  // en mémoire et ne sont jamais journalisées.
  const variables = new Map();
  for (const ligne of sortie.split("\n")) {
    const separateur = ligne.indexOf("=");
    if (separateur > 0) {
      variables.set(ligne.slice(0, separateur).trim(), ligne.slice(separateur + 1));
    }
  }
  return variables;
}

/**
 * Écrit une variable Vercel côté Convex quand elle y manque ou y diffère.
 *
 * Sans la comparaison, une clé changée dans Vercel n'atteindrait jamais Convex
 * et l'application continuerait d'appeler OpenAI avec l'ancienne, sans rien
 * dire. Un collage laisse souvent traîner un saut de ligne, qui casserait
 * l'en-tête d'autorisation : la valeur est donc élaguée avant comparaison.
 */
function synchroniser(nom, existantes) {
  const valeur = process.env[nom]?.trim();
  if (!valeur) return false;
  if (existantes.get(nom) === valeur) {
    journal(`${nom} déjà à jour côté Convex.`);
    return true;
  }
  definir(nom, valeur);
  return true;
}

function definir(nom, valeur) {
  try {
    // Le séparateur « -- » est indispensable : une clé privée PKCS#8 commence
    // par « -----BEGIN », que l'analyseur d'options prendrait pour un drapeau.
    convex(["env", "set", "--", nom, valeur], { silencieux: true });
  } catch (erreur) {
    // L'erreur d'execFileSync contient la ligne de commande, donc la valeur.
    // On ne la laisse jamais atteindre le journal de build.
    throw new Error(
      `Échec de l'écriture de ${nom} côté Convex (code ${erreur.status ?? "inconnu"}).`,
    );
  }
  journal(`${nom} définie.`);
}

const existantes = variablesExistantes();

// 1. Clés de signature des sessions. Les deux vont ensemble : si l'une manque,
//    la paire entière est régénérée, sinon les jetons seraient invérifiables.
if (!existantes.has("JWT_PRIVATE_KEY") || !existantes.has("JWKS")) {
  journal("Clés de Convex Auth absentes, génération d'une paire RS256.");
  const paire = await generateKeyPair("RS256", { extractable: true });
  const clePrivee = await exportPKCS8(paire.privateKey);
  const clePublique = await exportJWK(paire.publicKey);

  definir("JWT_PRIVATE_KEY", clePrivee.trimEnd().replace(/\n/g, " "));
  definir("JWKS", JSON.stringify({ keys: [{ use: "sig", ...clePublique }] }));
} else {
  journal("Clés de Convex Auth déjà en place.");
}

// 2. Adresse publique de l'application, utilisée par Convex Auth.
const domaine =
  process.env.VERCEL_ENV === "production"
    ? process.env.VERCEL_PROJECT_PRODUCTION_URL
    : process.env.VERCEL_URL;

if (domaine && (process.env.VERCEL_ENV === "production" || !existantes.has("SITE_URL"))) {
  definir("SITE_URL", `https://${domaine}`);
} else if (!existantes.has("SITE_URL")) {
  journal("SITE_URL inconnue : ni URL Vercel ni valeur déjà définie.");
}

// 3. Les variables OpenAI sont saisies dans Vercel ; les actions Convex les
//    lisent depuis leur propre environnement, il faut donc les y porter.
if (!synchroniser("OPENAI_API_KEY", existantes)) {
  journal(
    existantes.has("OPENAI_API_KEY")
      ? "OPENAI_API_KEY absente des variables Vercel, celle de Convex est conservée."
      : "OPENAI_API_KEY absente : l'application fonctionnera, mais l'analyse des " +
          "repas par photo ou par description restera en erreur.",
  );
}

synchroniser("OPENAI_MODEL", existantes);

// 4. Publication des fonctions Convex, puis build de l'application.
journal("Déploiement des fonctions Convex et build de l'application.");
execFileSync("npx", ["convex", "deploy", "--cmd", "npm run build"], {
  stdio: "inherit",
});

// 5. Rattrapages sur les données déjà en base, une fois les fonctions publiées.
//
//    Une valeur par défaut ne vaut que pour un compte qui n'a rien enregistré ;
//    les autres gardent ce qui a été copié en base à leur inscription. Les
//    rattrapages se marquent eux-mêmes et ne repassent pas (convex/migrations.ts).
//
//    L'étape n'est pas bloquante : l'application fonctionne sans, et un
//    déploiement ne doit pas échouer parce qu'une retouche de données a raté.
//    L'appel ne transporte aucun secret, sa sortie peut donc aller au journal.
journal("Rattrapages sur les données existantes.");
try {
  const sortie = convex(
    ["run", "--codegen", "disable", "--typecheck", "disable", "migrations:appliquer"],
    { silencieux: true },
  );
  journal(sortie.trim() || "aucune sortie.");
} catch (erreur) {
  journal(
    "Rattrapages non appliqués, le déploiement continue : " +
      String(erreur.stderr || erreur.message || "raison inconnue").trim(),
  );
}
