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

/*
 * Durée estimée d'une séance.
 *
 * Elle ne peut pas être écrite en dur dans le programme : une semaine
 * d'accumulation à 5 séries et 150 secondes de repos ne dure pas ce que dure
 * une décharge à 2 séries et 90 secondes. La durée se recalcule donc à partir
 * de la prescription réellement affichée, pour la semaine en cours.
 *
 * C'est une estimation, et elle est annoncée comme telle dans l'interface :
 * elle suppose qu'on respecte les temps de repos et qu'on ne traîne pas entre
 * deux exercices. Mieux vaut un ordre de grandeur juste qu'un chiffre précis
 * et faux.
 */

/** Une répétition contrôlée : ~2 s de descente, 1 s de poussée, 1 s de replacement. */
const TEMPO_SEC = 4;

/** Un tour de circuit enchaîne trois mouvements : une minute et demie. */
const TOUR_SEC = 90;

/** Secondes d'effort pour une série, lues dans la prescription. */
export function effortSerieSec(reps: string): number {
  const nombres = [...reps.matchAll(/\d+/g)].map((m) => Number(m[0]));
  // « Circuit complet » : rien à compter, on prend le forfait.
  if (nombres.length === 0) return TOUR_SEC;
  // « 40-60 sec » : la prescription est déjà en secondes, on prend le haut.
  if (/\bsec/i.test(reps)) return Math.max(...nombres);
  // « 12 + 12 » : un superset enchaîne deux exercices sans repos, les deux
  // comptent ; « 8-10 » est une fourchette, dont on retient le haut.
  const repetitions = reps.includes("+")
    ? nombres.reduce((s, n) => s + n, 0)
    : Math.max(...nombres);
  // « 10 par jambe », « 12 par côté » : la série se fait deux fois.
  const cotes = /par (jambe|côté|cote|bras|main)/i.test(reps) ? 2 : 1;
  return repetitions * cotes * TEMPO_SEC;
}

/**
 * Minutes d'échauffement.
 *
 * La première ligne est toujours le bloc cardio, autour de cinq minutes ;
 * les suivantes sont des mouvements de mobilité, une minute et demie chacun.
 */
function echauffementSec(lignes: string[]): number {
  if (lignes.length === 0) return 0;
  return 300 + (lignes.length - 1) * 90;
}

/**
 * Minutes de finisher, quand il est prévu.
 *
 * Certains annoncent leur durée — « 10 minutes de marche rapide » — et on la
 * croit sur parole ; les autres tournent autour de cinq minutes.
 */
function finisherSec(texte: string): number {
  const annonce = texte.match(/(\d+)\s*min/i);
  return annonce ? Number(annonce[1]) * 60 : 300;
}

/** Ce dont on a besoin pour estimer : le nom et le focus n'entrent pas en jeu. */
export type SeanceEstimable = {
  echauffement: string[];
  exercices: ExerciceDosable[];
  finisher?: string;
};

/**
 * Durée totale estimée, en minutes, arrondie au multiple de cinq.
 *
 * Le repos qui suit la dernière série d'un exercice n'est pas retranché :
 * c'est lui qui paie le déplacement jusqu'à la machine suivante.
 */
export function dureeEstimeeMin(
  seance: SeanceEstimable,
  semaine: SemaineProgramme | null,
): number {
  let secondes = echauffementSec(seance.echauffement);

  for (const exercice of seance.exercices) {
    const dose = doseDe(exercice, semaine);
    secondes += dose.series * (effortSerieSec(dose.reps) + dose.reposSec);
  }

  // Le finisher saute pendant les décharges : ne pas le compter alors, sinon
  // la durée annoncée dépasse de cinq minutes celle qu'on vit.
  if (seance.finisher && (!semaine || semaine.finisherObligatoire)) {
    secondes += finisherSec(seance.finisher);
  }

  return Math.round(secondes / 300) * 5;
}
