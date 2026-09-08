# Cadence

Application de suivi quotidien : séances de musculation, repas, grignotage et
sommeil. Interface en français : colonne unique et barre d'onglets en bas sur
téléphone, barre latérale et mise en page sur deux colonnes à partir de 1024 px.

- **Séances** — programme de 12 semaines, 4 séances par semaine, orienté haut du
  corps. Chaque exercice existe en version **salle** (machines, charges libres)
  et en version **maison** (poids du corps, élastique, sac à dos, chaise), et la
  bascule se fait exercice par exercice pendant la séance.
- **Repas** — menus programmés le matin, en collation et le soir. Le midi (ou
  n'importe quel repas sauté) est enregistré par **photo** ou par **description
  écrite** : OpenAI reconnaît les aliments et estime calories et macros.
- **Grignotage et boissons** — ajout en un geste de ce qui se prend entre les
  repas (café, soda, bière, chips, chocolat…), ou description libre analysée par
  l'IA.
- **Liste de courses** — construite automatiquement à partir des menus des 3, 7
  ou 14 prochains jours : quantités cumulées, classement par rayon, date à
  laquelle acheter chaque produit (les produits frais s'achètent au dernier
  moment), cases à cocher pour ce qui est déjà acheté, et ajouts manuels.
- **Pas** — le compteur du téléphone ou de la montre se recopie dans la journée.
  La distance et la dépense s'en déduisent (foulée estimée depuis la taille,
  0,5 kcal par kilo et par kilomètre), et **seul l'écart avec le rythme déjà
  supposé par le niveau d'activité** ouvre des calories sur la cible du jour :
  compter la marche entière la compterait deux fois, puisque le multiplicateur
  du profil la contient déjà.
- **Planning** — calendrier à trois échelles (jour, semaine, mois) qui montre
  la journée type, la semaine d'entraînement et le mois d'un coup d'œil, et se
  met à jour en direct pendant qu'on modifie les horaires : heures de coucher
  et de lever, heures des repas, créneaux d'entraînement de la semaine.
- **Sommeil** — durée, qualité, dette de sommeil sur 14 jours.
- **Progression** — courbe de poids, tour de taille, régularité des séances,
  volume soulevé, marche des 14 derniers jours.

## Pile technique

| Rôle | Choix |
| --- | --- |
| Application | Next.js 16 (App Router, React 19) |
| Styles | Tailwind CSS 4, palette noir et jaune, tout en sans-serif |
| Base de données et temps réel | Convex |
| Authentification | Convex Auth (email et mot de passe), inscriptions fermées |
| IA | OpenAI (vision pour les photos, texte pour les descriptions et la génération de programmes et de menus) |
| Hébergement | Vercel |

## Mise en route

```bash
npm install
npx convex dev          # crée le projet Convex, génère convex/_generated et écrit .env.local
```

`npx convex dev` renseigne automatiquement `NEXT_PUBLIC_CONVEX_URL` dans
`.env.local` (voir `.env.example`).

### Variables d'environnement Convex

À définir **côté Convex**, pas dans `.env.local` :

```bash
npx @convex-dev/auth                       # génère les clés JWT de Convex Auth
npx convex env set OPENAI_API_KEY sk-...   # clé OpenAI
npx convex env set SITE_URL http://localhost:3000
# facultatif : modèle utilisé (par défaut gpt-4o)
npx convex env set OPENAI_MODEL gpt-4o
```

En production, `SITE_URL` vaut l'URL Vercel du projet.

`JWT_PRIVATE_KEY` et `JWKS` ne se récupèrent nulle part : ce sont une clé privée
et sa clé publique, créées à la volée par `npx @convex-dev/auth`, qui les écrit
directement dans le déploiement Convex. Une paire distincte par déploiement.
Si cette commande ne peut pas tourner, `node scripts/generer-cles-auth.mjs`
produit exactement les mêmes valeurs, à coller dans les variables
d'environnement du déploiement depuis le tableau de bord Convex.

### Lancer l'application

```bash
npm run dev     # dans un terminal
npx convex dev  # dans un autre, pour synchroniser les fonctions Convex
```

## Déploiement sur Vercel

La commande de build est fixée par `vercel.json` : `node scripts/deployer.mjs`.
Ce script fait tout le travail de configuration à chaque déploiement, sans rien
écraser de ce qui existe déjà :

1. génère la paire `JWT_PRIVATE_KEY` / `JWKS` de Convex Auth si elle manque ;
2. cale `SITE_URL` sur l'URL du déploiement Vercel ;
3. recopie `OPENAI_API_KEY` des variables Vercel vers Convex ;
4. déploie les fonctions Convex, puis construit l'application en lui injectant
   `NEXT_PUBLIC_CONVEX_URL`.

Deux valeurs seulement sont à saisir une fois dans Vercel (Settings →
Environment Variables), parce qu'elles n'existent que dans tes comptes :

| Variable | Où la prendre |
| --- | --- |
| `CONVEX_DEPLOY_KEY` | tableau de bord Convex → Settings → Deploy keys |
| `OPENAI_API_KEY` | tableau de bord OpenAI |

Tout le reste est posé par le script. Si l'une des deux manque, le journal de
build de Vercel le dit explicitement.

## Organisation du code

```
app/
  (app)/          pages connectées : aujourd'hui, séance, repas, courses,
                  planning, sommeil, progression, profil
  bienvenue/      questionnaire d'installation (profil et cibles)
  connexion/      inscription et connexion
composants/       interface : jauges, feuille glissante, analyseur de repas…
convex/
  data/           programme d'entraînement et banque de repas
  lib/            calculs (nutrition, dates, menus) et validateurs
  courses.ts      liste de courses construite depuis les menus
  ia.ts           actions OpenAI : photo, texte, menus, programme
  schema.ts       modèle de données
lib/              utilitaires côté client
```

## Accès

L'application est privée : il n'y a pas d'écran d'inscription, et la création de
compte est refusée côté serveur par le point d'entrée `createOrUpdateUser` de
`convex/auth.ts` — retirer le formulaire seul aurait laissé l'API ouverte.

Pour créer le premier compte d'un déploiement neuf, ou en ouvrir un autre,
retirer temporairement ce point d'entrée, se connecter, puis le remettre.

## Précision

Les estimations nutritionnelles et les programmes proposés sont des repères
d'entraînement, pas un avis médical.
