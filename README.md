# MySport

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
  Deux échelles, facultatives elles aussi, notent le ressenti avant la séance
  (de « à fond » à « fatigué ») et après (de « au top » à « vidé »).
- **Statistiques** — semaine par semaine : la dépense de la semaine comparée à
  la précédente, les calories jour par jour et chaque jour avec ses séances,
  repos compris. Ou sur un mois, 3 mois, un an ou tout l'historique : dépense
  moyenne par semaine, par séance et par jour, nombre de séances et de jours
  actifs, temps total, calories semaine par semaine, calendrier du mois où
  chaque jour d'entraînement s'ouvre sur sa séance, exercices les plus faits.
  Les deux vues répartissent la dépense entre musculation, cardio et sports.
- **Chronomètre** — minuteur d'intervalles : temps d'effort, temps de pause,
  nombre de tours. Il sonne à chaque changement, avec un décompte sur les trois
  dernières secondes, et garde l'écran allumé jusqu'à la fin.
- **Poids** — noté au fil du temps depuis le profil, une pesée datée à la fois.
  Chaque séance s'estime avec le poids de sa date.

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
avant d'enregistrer est celui qui s'affiche ensuite.

Le poids retenu est celui **de la date de la séance** : la dernière pesée faite
ce jour-là ou avant, ou la toute première pour une séance plus ancienne que
toutes les pesées (`convex/lib/poids.ts`). Une pesée plus récente ne touche donc
pas les séances passées ; une pesée ajoutée, corrigée ou supprimée dans le passé
recalcule les séances qu'elle concerne. Chaque séance garde le poids qui a servi
à son estimation.

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
  bienvenue/      premier passage : prénom et première pesée
  connexion/      connexion
composants/       interface : sélecteur d'exercices, feuille glissante, champs…
convex/
  data/           catalogue des exercices, avec leur MET
  lib/            estimation des calories, poids à une date, session
  seances.ts      lecture et enregistrement des séances
  pesees.ts       pesées, et recalcul des séances qu'elles touchent
  schema.ts       modèle de données
lib/              utilitaires côté client : dates, totaux, minuteur, sons
scripts/          déploiement Vercel, clés d'authentification, icônes
```

## Parti pris visuel

Une interface d'application de sport sobre : fond graphite, un seul accent
orange, des chiffres qui portent la page. Le tout doit se lire d'un coup
d'œil, téléphone posé par terre, et ne pas avoir l'air d'une maquette
fabriquée à la chaîne.

- **Des boîtes nettes.** Ce qui se lit d'un bloc (une liste de séances, un
  graphique, une grille de chiffres) va dans une `.boite` : fond à peine
  détaché, filet fin, angles de 10 px. Ce qu'on touche (boutons, champs,
  options) a des angles de 8 px. Rien de plus rond, aucune pastille.
- **Un titre au-dessus de chaque boîte** (`TitreSection`), comme dans les
  réglages d'un téléphone, avec à droite une valeur d'appoint ou un lien.
- **Le chiffre principal à même le fond** (`ChiffreVedette`) : très grand, sans
  cadre, avec deux moyennes en dessous séparées par un filet vertical.
- **Des choix qui se voient.** Onglets, ressentis, thème : un rail en creux, et
  l'option retenue remplie d'accent (`Onglets`, `GroupeOptions`). Les boutons
  principaux sont pleins, les secondaires ont un fond et un filet.
- **Pas d'ornement générique** : ni icône sur pastille teintée, ni étiquette
  arrondie autour de chaque valeur, ni barre de navigation flottante, ni filet
  coloré en marge d'une carte. Les icônes restent à la navigation et aux
  actions.
- **Colonnes inégales** (rapport 1,4) sur ordinateur : une colonne de lecture
  et sa marge, plutôt que deux moitiés qui n'ont jamais le même contenu.
- **Le curseur main sur ce qui se clique.** Le preflight de Tailwind v4 laisse
  aux boutons la flèche du navigateur ; une règle unique dans `globals.css` la
  remet en main pour `button`, `select`, `summary` et `[role="button"]`, sauf
  s'ils sont désactivés.

Polices : Outfit pour les titres et les chiffres, DM Sans pour le texte.

## Couleurs et thèmes

Les jetons de `app/globals.css` portent leur **rôle**, pas leur teinte : `fond`,
`surface`, `creux`, `piste`, `trait`, `encre`, `brume`. Seules leurs valeurs
changent d'un thème à l'autre, sous `:root[data-theme="clair"]` : un composant
n'a donc jamais à savoir quel thème est actif, et il n'existe pas de classe
`dark:`.

L'accent se dédouble, parce que l'orange `#ff7a45` en texte sur blanc tombe à
2,6:1 : `accent` porte les **aplats** (bouton principal, option choisie,
barres), où c'est `sur-accent` posé dessus qui assure le contraste, et
`accent-texte` est l'accent **lisible** (texte, icônes, bordures), qui passe à
un orange brûlé en clair.

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

Le site est aussi fermé aux moteurs de recherche : chaque réponse porte
`X-Robots-Tag: noindex, nofollow` (`next.config.ts`), doublé d'une balise
`robots` dans `app/layout.tsx`. `robots.txt` laisse volontairement les robots
entrer : un robot à qui on interdit la page ne lit pas son « noindex », et peut
alors lister l'adresse seule.

## Précision

Les calories affichées sont une estimation à partir de valeurs moyennes par
activité, pas une mesure.
