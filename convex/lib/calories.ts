/**
 * Estimation des calories dépensées pendant une séance.
 *
 * kcal = MET × poids (kg) × durée (h), la formule du Compendium. Le serveur
 * l'applique à l'enregistrement et l'écran de saisie à chaque frappe : c'est
 * le même module, pour que le chiffre annoncé avant d'enregistrer soit celui
 * qui s'affiche ensuite.
 *
 * Toute la difficulté est la durée. On ne chronomètre pas chaque série : seule
 * la durée de la séance est connue, plus celle des exercices chronométrés
 * (une course, un match). Le temps restant se répartit entre les autres
 * exercices au prorata de leurs séries — quatre séries de squat occupent deux
 * fois plus de la séance que deux séries de curl.
 */

import {
  ID_PERSO,
  MET_PERSO,
  exerciceDuCatalogue,
  type Mesure,
} from "../data/exercices";

export type EntreeExercice = {
  exerciceId: string;
  mesure: Mesure;
  series?: number;
  dureeMin?: number;
  distanceKm?: number;
};

/** Séries comptées pour un exercice dont on n'a pas précisé le nombre. */
const SERIES_PAR_DEFAUT = 3;

/**
 * Temps de séance qu'aucun exercice n'occupe : échauffement, transitions,
 * rangement. Compté comme une activité légère plutôt qu'ignoré.
 */
const MET_TEMPS_LIBRE = 2.5;

/** Séance enregistrée sans exercice : un effort de musculation modéré. */
const MET_SEANCE_SANS_DETAIL = 5;

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

function estChronometre(e: EntreeExercice) {
  return e.mesure === "duree" && (e.dureeMin ?? 0) > 0;
}

/**
 * Durée retenue pour la séance : celle qui est saisie, mais jamais moins que
 * la somme des exercices chronométrés — 30 minutes de course dans une séance
 * annoncée à 20 minutes, c'est la séance qui est mal renseignée.
 */
export function dureeRetenue(dureeMin: number, exercices: EntreeExercice[]): number {
  const chronometre = exercices
    .filter(estChronometre)
    .reduce((s, e) => s + (e.dureeMin ?? 0), 0);
  return Math.max(dureeMin, chronometre);
}

export function estimerKcal(
  seance: { dureeMin: number; exercices: EntreeExercice[] },
  poidsKg: number,
): number {
  const duree = dureeRetenue(seance.dureeMin, seance.exercices);
  const kcalPour = (met: number, minutes: number) => met * poidsKg * (minutes / 60);

  if (seance.exercices.length === 0) {
    return Math.round(kcalPour(MET_SEANCE_SANS_DETAIL, duree));
  }

  const chronometres = seance.exercices.filter(estChronometre);
  const autres = seance.exercices.filter((e) => !estChronometre(e));

  let kcal = 0;
  let occupe = 0;
  for (const e of chronometres) {
    kcal += kcalPour(metDe(e), e.dureeMin ?? 0);
    occupe += e.dureeMin ?? 0;
  }

  const reste = Math.max(0, duree - occupe);
  if (autres.length === 0) {
    kcal += kcalPour(MET_TEMPS_LIBRE, reste);
  } else {
    // Un exercice en durée dont on n'a pas donné la durée pèse comme un
    // exercice de séries ordinaire.
    const parts = autres.map((e) =>
      e.mesure === "duree" ? SERIES_PAR_DEFAUT : Math.max(1, e.series ?? SERIES_PAR_DEFAUT),
    );
    const totalParts = parts.reduce((s, p) => s + p, 0);
    autres.forEach((e, i) => {
      kcal += kcalPour(metDe(e), (reste * parts[i]) / totalParts);
    });
  }

  return Math.round(kcal);
}
