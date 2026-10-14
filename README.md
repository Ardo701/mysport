# Cadence

Journal d'entraînement personnel. On note après coup ce qu'on a fait — les
exercices, le temps passé —, et l'application en tire le reste : quel jour on
s'est entraîné, à quoi, et combien de calories on a dépensé en moyenne.
Interface en français : barre d'onglets en bas sur téléphone, barre latérale et
deux colonnes à partir de 1024 px.

- **Journal** — chaque séance se saisit en quelques gestes : la date, la durée,
  puis les exercices cochés dans un catalogue d'environ 150 mouvements (muscu,
  gainage, cardio, sports, mobilité). Le détail est facultatif : séries,
  répétitions et charge pour la musculation, secondes pour le gainage, durée et
  distance pour le cardio. Un exercice absent du catalogue s'ajoute par son nom.
- **Statistiques** — sur 4 semaines, 3 mois, 12 mois ou tout l'historique :
  dépense moyenne par semaine, par séance et par jour, nombre de séances et de
  jours actifs, temps total, calories semaine par semaine, calendrier du mois
  où chaque jour d'entraînement s'ouvre sur sa séance, exercices les plus faits.
- **Chronomètre** — minuteur d'intervalles : temps d'effort, temps de pause,
  nombre de tours. Il sonne à chaque changement, avec un décompte sur les trois
  dernières secondes, et garde l'écran allumé jusqu'à la fin.

## Calories

Elles sont toujours **estimées**, jamais saisies : `kcal = MET × poids × durée`,
la formule du Compendium of Physical Activities. Chaque exercice du catalogue
(`convex/data/exercices.ts`) porte son MET ; pour la course, il se recalcule à
partir de l'allure quand la distance est saisie.

La séance se découpe en trois sortes de temps :

- **chronométré** — une course, un match : sa durée, au MET de l'activité ;
- **travail** — le temps passé dans les séries (séries × répétitions × 3 s, ou
  séries × secondes tenues pour le gainage), au MET de l'exercice, majoré par
  la charge : soulever en plus l'équivalent de son poids double le coût ;
- **récupération** — tout le reste de la durée saisie : repos entre les
  séries, installation, transitions, à 3,5 MET.

À durée égale, une série, une répétition ou un kilo de plus transforme du
repos en effort : l'estimation ne peut que monter. La durée de la séance reste
le levier principal.

Le calcul vit dans `convex/lib/calories.ts`, que le serveur applique à
l'enregistrement et l'écran de saisie à chaque frappe : le chiffre annoncé
avant d'enregistrer est celui qui s'affiche ensuite. Il est figé avec la
séance, au poids du moment, que la séance garde : changer son poids dans le
profil ne réécrit pas les séances passées, et une formule corrigée peut les
recalculer avec le poids qui était le leur.

## Pile technique

| Rôle | Choix |
| --- | --- |
| Application | Next.js 16 (App Router, React 19) |
| Styles | Tailwind CSS 4, palette noir et jaune, tout en sans-serif |
| Base de données et temps réel | Convex |
| Authentification | Convex Auth (email et mot de passe), inscriptions fermées |
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
npx convex env set SITE_URL http://localhost:3000
```

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
3. déploie les fonctions Convex, puis construit l'application en lui injectant
   `NEXT_PUBLIC_CONVEX_URL` ;
4. applique les rattrapages de données de `convex/migrations.ts`.

Ce dernier point sert quand une modification touche des lignes déjà en base :
un rattrapage s'écrit une fois, passe au déploiement suivant, laisse sa trace
dans la table `migrations` et ne repasse jamais. L'étape n'est pas bloquante :
un build ne doit pas échouer parce qu'une retouche de données a raté.

Une seule valeur est à saisir dans Vercel (Settings → Environment Variables) :
`CONVEX_DEPLOY_KEY`, à générer dans le tableau de bord Convex → Settings →
Deploy keys. Tout le reste est posé par le script ; si elle manque, le journal
de build de Vercel le dit explicitement.

## Organisation du code

```
app/
  (app)/          pages connectées : tableau de bord, journal, saisie d'une
                  séance, statistiques, chronomètre, profil
  bienvenue/      premier passage : prénom et poids
  connexion/      connexion
composants/       interface : sélecteur d'exercices, feuille glissante, champs…
convex/
  data/           catalogue des exercices, avec leur MET
  lib/            estimation des calories, session
  seances.ts      lecture et enregistrement des séances
  schema.ts       modèle de données
lib/              utilitaires côté client : dates, totaux, minuteur, sons
scripts/          déploiement Vercel, clés d'authentification, icônes
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
- **Le curseur main sur ce qui se clique.** Le preflight de Tailwind v4 laisse
  aux boutons la flèche du navigateur ; une règle unique dans `globals.css` la
  remet en main pour `button`, `select`, `summary` et `[role="button"]`, sauf
  s'ils sont désactivés. Une classe à répéter sur chaque bouton finirait par
  s'oublier quelque part.

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

Les calories affichées sont une estimation à partir de valeurs moyennes par
activité, pas une mesure.
