# Cadence

Application de suivi quotidien : séances de musculation, repas, grignotage et
sommeil. Interface en français : colonne unique et barre d'onglets en bas sur
téléphone, barre latérale et mise en page sur deux colonnes à partir de 1024 px.

- **Séances** — programme de 12 semaines, 4 séances par semaine, orienté haut du
  corps. Chaque exercice existe en version **salle** (machines, charges libres)
  et en version **maison** (poids du corps, élastique, sac à dos, chaise), et la
  bascule se fait exercice par exercice pendant la séance. **Les douze semaines
  sont écrites une par une** : ce n'est pas la même séance répétée douze fois,
  le volume et l'intensité changent chaque semaine (voir plus bas).
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
- **Thème** — sombre par défaut, clair au choix. La bascule est en bas de la
  barre latérale sur ordinateur, et sur la page Profil pour le téléphone, qui
  n'a pas de barre latérale. Le choix est propre à l'appareil.
- **Sommeil** — durée, qualité, dette de sommeil sur 14 jours.
- **Progression** — courbe de poids, tour de taille, régularité des séances,
  volume soulevé, marche des 14 derniers jours.

## Comment le programme progresse

Les séances disent **quoi** faire, les semaines disent **combien**. Séparer les
deux évite d'écrire quarante-huit séances dont quarante-quatre seraient des
copies, et rend la progression lisible d'un coup d'œil dans
`convex/data/programme.ts`.

| Semaines | Bloc | Ce qui change |
| --- | --- | --- |
| 1 à 5 | Fondations | Le volume monte : 3 séries puis 4, puis 5 sur les gros mouvements. Les fourchettes descendent de 10-12 à 8-10, la réserve de 3 à 2 répétitions. |
| 6 | Décharge | Volume divisé par deux, 4 répétitions en réserve, pas de finisher. C'est cette semaine qui fixe les progrès des cinq précédentes. |
| 7 à 11 | Intensité | Les répétitions descendent jusqu'à 5-6, les repos montent jusqu'à 3 minutes, la réserve tombe à 0-1. La semaine 11 est la plus dure du cycle. |
| 12 | Décharge et test | Trois séries légères, puis une série lourde de référence à comparer à la semaine 1. |

Chaque exercice porte un **rôle** qui décide de ce qu'il reçoit :

- `principal` — les gros mouvements (développés, tractions, rowing, squat,
  soulevé roumain, superset poussée/tirage) prennent la prescription
  « principaux » de la semaine ;
- `accessoire` — isolations et bras prennent la prescription « accessoires »,
  dans des fourchettes plus hautes ;
- `fixe` — gainage et circuits abdos gardent la leur toute l'année, parce que
  « 5 × 5-6 » ne veut rien dire sur une planche.

La jointure se fait dans `convex/lib/programme.ts`, à un seul endroit : le
serveur s'en sert pour créer le bon nombre de séries au démarrage, la page de
séance pour afficher la consigne. Deux copies dériveraient, et on
s'entraînerait sur une prescription différente de celle affichée.

Un programme **généré par l'IA** n'a pas cette couche : ses exercices gardent
alors la prescription écrite sur eux, et rien ne casse.

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
Ce script fait tout le travail de configuration à chaque déploiement :

1. génère la paire `JWT_PRIVATE_KEY` / `JWKS` de Convex Auth si elle manque —
   jamais autrement, la regénérer déconnecterait tous les comptes ;
2. cale `SITE_URL` sur l'URL du déploiement Vercel ;
3. porte `OPENAI_API_KEY` et `OPENAI_MODEL` des variables Vercel vers Convex,
   quand elles y manquent **ou qu'elles y diffèrent** : Vercel est l'endroit où
   on les saisit, une clé changée là doit donc suivre. Sans cette comparaison,
   une rotation de clé laisserait l'application appeler OpenAI avec l'ancienne,
   sans rien dire ;
4. déploie les fonctions Convex, puis construit l'application en lui injectant
   `NEXT_PUBLIC_CONVEX_URL` ;
5. applique les rattrapages de données de `convex/migrations.ts`.

Ce dernier point existe parce qu'une valeur par défaut ne vaut que pour un
compte qui n'a rien enregistré : `creerPlanningParDefaut` en recopie une
version en base à l'inscription, et changer la constante ensuite ne rattrape
rien. Chaque rattrapage laisse sa trace dans la table `migrations` et ne
repasse jamais, sinon il réécrirait à chaque déploiement des valeurs
volontairement changées depuis. L'étape n'est pas bloquante : un build ne doit
pas échouer parce qu'une retouche de données a raté.

Une variable modifiée dans Vercel n'atteint Convex qu'au déploiement suivant :
après l'avoir changée, relancer un build (Vercel → Deployments → Redeploy).

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
scripts/          déploiement Vercel et génération des icônes
```

## Parti pris visuel

L'application se tient au vocabulaire d'un instrument de mesure : ce sont les
chiffres qui portent la page, tout le reste s'efface.

- **Un seul rayon.** `rounded-doux` vaut 6 px, partout : panneaux, cartes,
  champs, boutons. Les jauges et les filets restent droits, faute de classe de
  rayon. Rien n'est arrondi au-delà, et plus rien n'est en pastille.
- **Pas de boîtes.** Un bloc se délimite par son titre suivi d'un filet jusqu'à
  la marge (`TitreSection`), et les lignes de liste par un filet en tête. Les
  cartes remplies et encadrées empilaient trois signaux pour dire une seule
  chose.
- **Un seul niveau de titre par bloc.** Le surtitre en capitales *et* le titre
  répétaient la même information sous deux tailles.
- **Le jaune ne marque qu'une famille de choses** : l'avancement et le geste
  principal. Les onglets se soulignent au lieu de s'allumer, la page courante
  de la barre latérale se marque d'un filet dans la marge.
- **Colonnes inégales** (rapport 1,4) : une colonne de lecture et sa marge,
  plutôt que deux moitiés qui n'ont jamais le même contenu.
- **Aucun ornement** : pas de halo de fond, pas d'anneau de progression, pas
  d'icône décorative dans les listes — elles restent à la navigation et aux
  actions.

## Couleurs et thèmes

Les jetons de `app/globals.css` portent leur **rôle**, pas leur teinte : `fond`,
`surface`, `creux`, `trait`, `encre`, `brume`. Seules leurs valeurs changent
d'un thème à l'autre, sous `:root[data-theme="clair"]` — un composant n'a donc
jamais à savoir quel thème est actif, et il n'existe pas de classe
`dark:`.

Le jaune fait exception et se dédouble, parce que `#ffdd00` sur blanc plafonne
à 1,3:1 : `jaune` est l'accent **lisible** (texte, icônes, bordures), qui passe
à un ambre foncé en clair, tandis que `jaune-vif` porte les **aplats** de la
marque (boutons, jauges, points), où c'est `sur-jaune` posé dessus qui assure
le contraste.

`SCRIPT_THEME` (dans `composants/theme.tsx`) est inséré en tête de `<body>` et
pose `data-theme` avant le premier rendu : sans lui, un utilisateur en clair
verrait passer un éclair noir à chaque chargement. Le défaut reste le sombre,
même quand le système est en clair — l'application a toujours eu cette
apparence, basculer sans qu'on l'ait demandé serait la surprise.

## Icônes

Le logo vit dans `app/icon.svg`. Les PNG qui en dérivent — `app/apple-icon.png`
pour l'écran d'accueil iOS, `public/icone-*.png` pour le manifeste — sont
générés par `node scripts/icones.mjs`, à relancer après toute retouche du
dessin. Le SVG seul ne suffit pas : iOS ne le lit pas au moment d'ajouter le
site à l'écran d'accueil, et affiche sinon une capture de la page.

iOS garde l'icône en cache : après un déploiement, retirer le raccourci et le
rajouter pour voir la nouvelle.

## Accès

L'application est privée : il n'y a pas d'écran d'inscription, et la création de
compte est refusée côté serveur par le point d'entrée `createOrUpdateUser` de
`convex/auth.ts` — retirer le formulaire seul aurait laissé l'API ouverte.

Pour créer le premier compte d'un déploiement neuf, ou en ouvrir un autre,
retirer temporairement ce point d'entrée, se connecter, puis le remettre.

## Précision

Les estimations nutritionnelles et les programmes proposés sont des repères
d'entraînement, pas un avis médical.
