/**
 * Estimation des calories dépensées pendant une séance.
 *
 * kcal = MET × poids (kg) × durée (h), la formule du Compendium. Le serveur
 * l'applique à l'enregistrement et l'écran de saisie à chaque frappe : c'est
 * le même module, pour que le chiffre annoncé avant d'enregistrer soit celui
 * qui s'affiche ensuite.
 *
 * La séance se découpe en trois sortes de temps :
 *
 *   chronométré   une course, un match : sa durée, au MET de l'activité ;
 *   travail       le temps passé dans les séries — séries × répétitions × 3 s,
 *                 ou séries × secondes tenues pour le gainage —, au MET de
 *                 l'exercice, majoré par la charge soulevée ;
 *   récupération  tout le reste : repos entre les séries, installation,
 *                 transitions, à 3,5 MET (Compendium : musculation, effort
 *                 léger à modéré — le cœur ne redescend pas entre deux séries).
 *
 * Une version précédente répartissait la durée de la séance entre les
 * exercices au prorata de leurs séries, sans regarder ni les répétitions ni
 * la charge. Ajouter des séries à un exercice moins coté en retirait alors à
 * un autre, et le total baissait. Ici, une série, une répétition ou un kilo de
 * plus transforme du repos en effort, à durée égale : le total ne peut que
 * monter.
 */

import {
  ID_PERSO,
  MET_PERSO,
  exerciceDuCatalogue,
  type Materiel,
  type Mesure,
} from "../data/exercices";

export type EntreeExercice = {
  exerciceId: string;
  mesure: Mesure;
  series?: number;
  repetitions?: number;
  secondes?: number;
  materiel?: Materiel;
  chargeKg?: number;
  dureeMin?: number;
  distanceKm?: number;
};

/**
 * Durée d'une répétition : deux secondes pour une pompe enlevée, quatre pour
 * un squat contrôlé. Trois tient le milieu.
 */
const SECONDES_PAR_REPETITION = 3;

/** Ce qu'on compte quand le détail n'est pas saisi : une série ordinaire. */
const SERIES_PAR_DEFAUT = 3;
const REPETITIONS_PAR_DEFAUT = 10;
const SECONDES_MAINTIEN_PAR_DEFAUT = 30;

const MET_RECUPERATION = 3.5;

/**
 * Temps qu'aucun exercice n'occupe dans une séance sans musculation :
 * échauffement, trajet entre deux ateliers. Compté comme une activité légère
 * plutôt qu'ignoré.
 */
const MET_TEMPS_LIBRE = 2.5;

/** Séance enregistrée sans exercice : un effort de musculation modéré. */
const MET_SEANCE_SANS_DETAIL = 5;

/**
 * Au-delà, une charge mal saisie (800 au lieu de 80) ferait exploser
 * l'estimation : trois fois le coût de base suffit à couvrir les charges
 * lourdes réelles.
 */
const FACTEUR_CHARGE_MAX = 3;

export function metDe(entree: EntreeExercice): number {
  if (entree.exerciceId === ID_PERSO) return MET_PERSO[entree.mesure];
  const exercice = exerciceDuCatalogue(entree.exerciceId);
  if (!exercice) return MET_PERSO[entree.mesure];

  if (exercice.selonVitesse && entree.dureeMin && entree.distanceKm) {
    // Course : le Compendium donne 8,3 MET à 8 km/h, 9,8 à 9,7 km/h, 11,8 à
    // 12 km/h. Une droite suffit à recouvrir la plage courante, bornée pour
    // qu'une distance mal saisie ne produise pas un chiffre absurde.
    const kmh = entree.distanceKm / (entree.dureeMin / 60);
    return Math.min(18, Math.max(6, 0.9 * kmh + 1));
  }
  return exercice.met;
}

/**
 * Soulever en plus l'équivalent de son propre poids double le coût d'une
 * répétition : c'est la masse déplacée qui fait la dépense. Au poids du
 * corps, ou sans charge notée, le MET du catalogue vaut tel quel.
 */
function facteurCharge(entree: EntreeExercice, poidsKg: number): number {
  if (entree.materiel === "poids-du-corps" || !entree.chargeKg) return 1;
  return Math.min(FACTEUR_CHARGE_MAX, 1 + entree.chargeKg / poidsKg);
}

/** Minutes passées dans les séries d'un exercice de force, repos exclus. */
export function minutesDeTravail(entree: EntreeExercice): number {
  if (entree.mesure === "duree") return 0;
  const series = entree.series ?? SERIES_PAR_DEFAUT;
  const secondesParSerie =
    entree.mesure === "maintien"
      ? (entree.secondes ?? SECONDES_MAINTIEN_PAR_DEFAUT)
      : (entree.repetitions ?? REPETITIONS_PAR_DEFAUT) * SECONDES_PAR_REPETITION;
  return (series * secondesParSerie) / 60;
}

function estChronometre(e: EntreeExercice) {
  return e.mesure === "duree" && (e.dureeMin ?? 0) > 0;
}

function minutesChronometrees(exercices: EntreeExercice[]) {
  return exercices.filter(estChronometre).reduce((s, e) => s + (e.dureeMin ?? 0), 0);
}

/**
 * La durée suffit-elle à enregistrer la séance ? Il faut une durée saisie, ou
 * au moins un exercice chronométré. Le temps de travail des séries ne compte
 * pas : sans le repos, il ne dit rien de la durée réelle.
 */
export function dureeConnue(dureeMin: number, exercices: EntreeExercice[]): boolean {
  return dureeMin > 0 || minutesChronometrees(exercices) > 0;
}

/**
 * Durée retenue pour la séance : celle qui est saisie, mais jamais moins que
 * ce que les exercices occupent à eux seuls — trente minutes de course dans
 * une séance annoncée à vingt, c'est la séance qui est mal renseignée.
 */
export function dureeRetenue(dureeMin: number, exercices: EntreeExercice[]): number {
  const travail = exercices.reduce((s, e) => s + minutesDeTravail(e), 0);
  return Math.max(dureeMin, minutesChronometrees(exercices) + travail);
}

/**
 * La dépense d'une séance, rangée par nature d'effort : la musculation (temps
 * dans les séries et récupération entre elles), le cardio et les sports, et
 * la séance notée sans aucun exercice. La somme est l'estimation de la séance.
 */
export type PartsKcal = { musculation: number; cardio: number; sansDetail: number };

export function estimerParts(
  seance: { dureeMin: number; exercices: EntreeExercice[] },
  poidsKg: number,
): PartsKcal {
  const { exercices } = seance;
  const duree = dureeRetenue(seance.dureeMin, exercices);
  const kcalPour = (met: number, minutes: number) => met * poidsKg * (minutes / 60);
  const parts: PartsKcal = { musculation: 0, cardio: 0, sansDetail: 0 };

  if (exercices.length === 0) {
    parts.sansDetail = kcalPour(MET_SEANCE_SANS_DETAIL, duree);
    return parts;
  }

  const force = exercices.filter((e) => e.mesure !== "duree");
  const sansDuree = exercices.filter((e) => e.mesure === "duree" && !estChronometre(e));

  let occupe = 0;
  for (const e of exercices.filter(estChronometre)) {
    parts.cardio += kcalPour(metDe(e), e.dureeMin ?? 0);
    occupe += e.dureeMin ?? 0;
  }
  for (const e of force) {
    const minutes = minutesDeTravail(e);
    parts.musculation += kcalPour(metDe(e) * facteurCharge(e, poidsKg), minutes);
    occupe += minutes;
  }

  // Le temps restant se partage entre la récupération des exercices de force
  // et les sports dont on n'a pas noté la durée : un match de foot sans durée
  // dans une séance d'une heure en occupe forcément une part. Sans l'un ni
  // l'autre, c'est l'échauffement d'une séance de cardio.
  const reste = Math.max(0, duree - occupe);
  const nombreParts = force.length + sansDuree.length;
  if (nombreParts === 0) {
    parts.cardio += kcalPour(MET_TEMPS_LIBRE, reste);
  } else {
    parts.musculation += kcalPour(MET_RECUPERATION, (reste * force.length) / nombreParts);
    for (const e of sansDuree) parts.cardio += kcalPour(metDe(e), reste / nombreParts);
  }

  return parts;
}

export function estimerKcal(
  seance: { dureeMin: number; exercices: EntreeExercice[] },
  poidsKg: number,
): number {
  const { musculation, cardio, sansDetail } = estimerParts(seance, poidsKg);
  return Math.round(musculation + cardio + sansDetail);
}
