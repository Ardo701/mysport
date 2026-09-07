# Cadence

Application de suivi quotidien : séances de musculation, repas, grignotage et
sommeil. Interface en français, pensée pour le téléphone.

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
- **Planning** — heures de coucher et de lever, heures des repas, créneaux
  d'entraînement de la semaine.
- **Sommeil** — durée, qualité, dette de sommeil sur 14 jours.
- **Progression** — courbe de poids, tour de taille, régularité des séances,
  volume soulevé.

## Pile technique

| Rôle | Choix |
| --- | --- |
| Application | Next.js 16 (App Router, React 19) |
| Styles | Tailwind CSS 4, palette noir et jaune, tout en sans-serif |
| Base de données et temps réel | Convex |
| Authentification | Convex Auth (email et mot de passe) |
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

### Lancer l'application

```bash
npm run dev     # dans un terminal
npx convex dev  # dans un autre, pour synchroniser les fonctions Convex
```

## Déploiement sur Vercel

1. Importer le dépôt dans Vercel.
2. Ajouter `CONVEX_DEPLOY_KEY` aux variables d'environnement du projet, avec la
   clé de production générée depuis le tableau de bord Convex.
3. La commande de build est déjà fixée par `vercel.json` :
   `npx convex deploy --cmd 'npm run build'`. Elle déploie les fonctions Convex,
   puis construit l'application en lui injectant `NEXT_PUBLIC_CONVEX_URL`.
4. Après le premier déploiement, pointer `SITE_URL` sur l'URL Vercel :
   `npx convex env set SITE_URL https://mon-app.vercel.app --prod`

La clé OpenAI ne va **pas** dans Vercel : les appels partent des actions Convex,
jamais du serveur Next.

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

## Précision

Les estimations nutritionnelles et les programmes proposés sont des repères
d'entraînement, pas un avis médical.
