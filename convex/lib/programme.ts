/**
 * Résolution de la prescription d'un exercice pour une semaine donnée.
 *
 * Les séances disent *quoi* faire, les semaines disent *combien*. Ce module
 * fait la jointure entre les deux, et c'est le seul endroit où elle se fait :
 * le serveur s'en sert pour créer le bon nombre de séries au démarrage, la
 * page de séance pour afficher la consigne. Deux copies dériveraient, et on
 * s'entraînerait alors sur une prescription différente de celle affichée.
 *
 * Vit dans `convex/` parce que les fonctions Convex ne peuvent importer que de
 * ce répertoire ; le client, lui, peut importer d'ici sans difficulté.
 */

import type { Dose, SemaineProgramme } from "../data/programme";

/** Ce dont on a besoin pour doser : le reste de l'exercice n'entre pas en jeu. */
type ExerciceDosable = {
  role?: string;
  series: number;
  reps: string;
  reposSec: number;
};

/** La semaine du cycle, ou `null` si le programme n'en décrit pas. */
export function semaineDe(
  semaines: SemaineProgramme[] | undefined,
  numero: number,
): SemaineProgramme | null {
  return semaines?.find((s) => s.numero === numero) ?? null;
}

/**
 * Ce qu'il faut faire sur cet exercice cette semaine.
 *
 * Un exercice `fixe` — gainage, circuit abdos — garde sa propre prescription :
 * « 5 × 5-6 » n'a aucun sens sur une planche. Un programme sans couche
 * hebdomadaire, comme ceux générés par l'IA, retombe entièrement sur les
 * valeurs de l'exercice, donc rien ne casse.
 */
export function doseDe(
  exercice: ExerciceDosable,
  semaine: SemaineProgramme | null,
): Dose {
  const sienne: Dose = {
    series: exercice.series,
    reps: exercice.reps,
    reposSec: exercice.reposSec,
    reserve: "",
  };
  if (!semaine) return sienne;
  if (exercice.role === "principal") return semaine.principaux;
  if (exercice.role === "accessoire") return semaine.accessoires;
  return sienne;
}
