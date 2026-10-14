<p align="center">
  <img src="app/icon.svg" width="88" alt="">
</p>

<h1 align="center">MySport</h1>

<p align="center">
  A personal training log.<br>
  Log your workouts in a few taps, and the app keeps track of the days,<br>
  the time spent and the calories burned.
</p>

<p align="center">
  <img src="docs/captures/accueil.jpg" width="190" alt="Home: the current week and the latest workouts">
  &nbsp;
  <img src="docs/captures/statistiques.jpg" width="190" alt="Weekly statistics, calories day by day">
  &nbsp;
  <img src="docs/captures/seance.jpg" width="190" alt="Logging a workout: exercises and how it felt">
  &nbsp;
  <img src="docs/captures/chrono.jpg" width="190" alt="Interval timer">
</p>

<p align="center">
  Next.js 16 · React 19 · Tailwind CSS 4 · Convex · Vercel
</p>

<br>

> The interface is in French and English. The code identifiers and comments
> are in French.

## What it does

- **Log.** A workout takes a few taps: the date, the duration, then the
  exercises ticked from a catalog of about 150 movements (strength, core,
  cardio, sports, mobility). Sets, reps, equipment and load are optional, as is
  the distance for cardio. An exercise missing from the catalog can be added by
  name.
- **How it felt.** Two optional scales, before the workout (from "pumped" to
  "tired") and after (from "great" to "drained").
- **Statistics.** Week by week: calories burned compared with the previous
  week, calories day by day, and each day with its workouts or its rest. Over a
  month, 3 months, a year or the whole history: averages, one bar per week, the
  month's calendar, the most frequent exercises. Everywhere, the share of
  calories that goes to strength training and to cardio.
- **Timer.** An interval timer: work time, rest time, number of rounds. It
  beeps at every change, counts down the last three seconds and keeps the
  screen awake.
- **Weight.** Dated weigh-ins, logged from the profile. Each workout is
  estimated with the weight you had on that day.
- **App.** Installable on a phone's home screen or on a computer, where it
  opens in its own window. Dark or light theme, French or English.

## Languages

The app follows the device's language: French on a phone set to French,
English everywhere else. The profile has a switch, and so does the sign-in
page, and the choice is remembered on that device.

There is no translation library. Each piece of text sits where it is
displayed, French first and English second:

```tsx
const { t, langue } = useLangue();
<TitreSection titre={t("Cette semaine", "This week")} />
```

so a translation is read next to its original, and a text without one does
not compile. Dates and numbers go through `Intl` with `fr-FR` or `en-GB`
(Monday-first weeks and kilos, like the rest of the app). Catalog data
carries both languages: every exercise has a French and an English name, as
do the muscle groups, the equipment and the feelings. Workouts store the
exercise's id, so a workout logged in French reads in English.

The pages are prerendered in French. On an English device, a script at the
top of the page sets `lang="en"` before the first render and keeps the page
hidden until React has rewritten it, so the French never flashes by
([`composants/langue.tsx`](composants/langue.tsx)).

## How calories are estimated

They are never typed in: `kcal = MET × weight × duration`, the formula of the
*Compendium of Physical Activities*. Every exercise in the catalog
([`convex/data/exercices.ts`](convex/data/exercices.ts)) carries its MET, and
running's MET is recomputed from the pace when a distance is logged.

A workout is split into three kinds of time:

| Time | What it counts | Intensity |
| --- | --- | --- |
| **Timed** | a run, a match: its duration | the activity's MET |
| **Work** | time spent in sets: sets × reps × 3 s, or sets × seconds held | the exercise's MET, raised by the load: lifting your own body weight on top doubles the cost |
| **Recovery** | the rest of the duration: rest between sets, setting up | 3.5 MET |

One more set, rep or kilo therefore turns rest into effort, and the estimate
can only go up. The workout's duration remains the main lever.

The weight used is the one **on the workout's date**: the last weigh-in on or
before that day, or the very first one for a workout older than every
weigh-in. Adding, correcting or deleting a past weigh-in recalculates the
workouts it affects.

The same module, [`convex/lib/calories.ts`](convex/lib/calories.ts), is used
by the server when saving and by the entry screen on every keystroke: the
number shown before saving is the one displayed afterwards.

> Calories are an estimate based on average values per activity, not a
> measurement.

## Running locally

```bash
npm install
npx convex dev
```

`npx convex dev` creates the Convex project, generates `convex/_generated` and
writes `NEXT_PUBLIC_CONVEX_URL` to `.env.local` (see `.env.example`). Convex
then needs its authentication keys and the site's address:

```bash
npx @convex-dev/auth
npx convex env set SITE_URL http://localhost:3000
```

The first command creates a key pair (`JWT_PRIVATE_KEY`, `JWKS`) and writes it
straight into the Convex deployment. If it can't run,
`node scripts/generer-cles-auth.mjs` prints the same values, to paste into the
Convex dashboard.

Then, in two terminals:

```bash
npm run dev       # the app, on http://localhost:3000
npx convex dev    # keeps the Convex functions in sync
```

## Deploying to Vercel

The build command is set in [`vercel.json`](vercel.json):
`node scripts/deployer.mjs`. On every deployment, this script:

1. generates the Convex Auth keys if they are missing, and only then:
   regenerating them would sign every account out;
2. sets `SITE_URL` to the deployment's address;
3. deploys the Convex functions, then builds the app;
4. applies the data backfills from
   [`convex/migrations.ts`](convex/migrations.ts).

A backfill is for changes that affect rows already in the database. It is
written once, runs on the next deployment, records its name in the
`migrations` table and never runs again.

Only one value needs to be set in Vercel (Settings, Environment Variables):
`CONVEX_DEPLOY_KEY`, generated in the Convex dashboard (Settings, Deploy keys).
If it is missing, the build log says so.

## Project structure

```
app/
  (app)/            signed-in pages: home, log, workout, statistics,
                    timer, profile
  bienvenue/        first visit: first name and first weigh-in
  connexion/        sign-in
composants/         UI: buttons, selectors, lists, exercise picker
convex/
  data/             exercise and feeling catalogs, in both languages
  lib/              calories, weight on a date, session
  seances.ts        reading and saving workouts
  pesees.ts         weigh-ins, and recalculating the workouts they affect
  migrations.ts     data backfills run on deployment
  schema.ts         data model
lib/                client side: dates, totals, timer, sounds
scripts/            deployment, auth keys, icons
docs/captures/      the screenshots in this file
```

## Design

Graphite background, a single orange accent, numbers carrying the page.
Headings and numbers are set in Outfit, body text in DM Sans.

- **Crisp boxes** for anything read as a block (a list, a chart, a grid of
  numbers), with a heading above, like a phone's settings screen. 10 px corners
  for boxes, 8 px for anything you tap.
- **The key number straight on the background**, very large, with two
  averages below it.
- **Choices you can see**: tabs, feelings and theme are segmented controls
  whose selected option is filled with orange.
- **No generic ornaments**: no icons on tinted badges, no rounded pill around
  every value, no floating navigation bar.

Colors live in [`app/globals.css`](app/globals.css) as tokens named after
their role (`fond` background, `surface`, `creux` inset, `trait` line, `encre`
ink, `brume` muted text, `accent`). The light theme only changes their values,
so no component needs to know which theme is active. The accent comes in two
forms: `accent` for fills, and `accent-texte` for text, which turns burnt
orange in the light theme where bright orange would be unreadable. A small
script at the top of the page applies the chosen theme before the first
render, so the page never flashes the wrong color on load.

The logo is [`app/icon.svg`](app/icon.svg). The PNGs derived from it (iOS home
screen, web manifest) are regenerated with `node scripts/icones.mjs` after any
change. iOS caches the old icon: remove the shortcut and add it again to see
the new one.

## Access and privacy

The app is private. There is no sign-up screen, and account creation is
refused on the server in [`convex/auth.ts`](convex/auth.ts). To open an
account on a fresh deployment, temporarily remove that check, sign in, then
put it back.

It is also closed to search engines: every response carries
`X-Robots-Tag: noindex, nofollow` ([`next.config.ts`](next.config.ts)), backed
by a `robots` meta tag. `robots.txt` deliberately lets crawlers in: a crawler
that is denied the page never reads its "noindex", and may then list the bare
address.
