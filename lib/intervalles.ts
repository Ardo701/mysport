/**
 * Minuteur d'intervalles : une suite de phases d'effort et de pause.
 *
 * Tout se déduit du temps écoulé depuis le départ, jamais d'un compteur qu'on
 * décrémente à chaque tic. Un navigateur ralentit les minuteries d'un onglet
 * en arrière-plan et un téléphone en veille les suspend : un décompte tic à
 * tic prendrait alors du retard sans le dire. Ici, revenir sur la page après
 * une minute d'absence retombe exactement sur la bonne phase.
 */

export type Reglages = {
  /** Durée d'une phase d'effort, en secondes. */
  effort: number;
  /** Durée de la pause entre deux tours, en secondes ; 0 enchaîne directement. */
  pause: number;
  tours: number;
};

export type TypePhase = "preparation" | "effort" | "pause";

export type Phase = {
  type: TypePhase;
  /** Tour auquel la phase appartient ; 0 pour la mise en place. */
  tour: number;
  /** Début de la phase depuis le départ, en secondes. */
  debut: number;
  duree: number;
};

/**
 * Le temps de poser le téléphone et de se mettre en position avant le premier
 * effort. Sans lui, la première minute de pompes commence debout, le doigt
 * encore sur l'écran.
 */
export const PREPARATION_S = 5;

/** 59:59 : le champ des minutes s'arrête à deux chiffres. */
export const LIMITES = {
  dureeMaxS: 59 * 60 + 59,
  toursMax: 50,
};

export const REGLAGES_PAR_DEFAUT: Reglages = { effort: 60, pause: 60, tours: 5 };

/**
 * Pas de pause après le dernier tour : elle ne précéderait rien, et la séance
 * paraîtrait finie une minute après l'être vraiment.
 */
export function construirePhases(r: Reglages): Phase[] {
  const phases: Phase[] = [];
  let curseur = 0;
  const ajouter = (type: TypePhase, tour: number, duree: number) => {
    if (duree <= 0) return;
    phases.push({ type, tour, debut: curseur, duree });
    curseur += duree;
  };

  ajouter("preparation", 0, PREPARATION_S);
  for (let tour = 1; tour <= r.tours; tour++) {
    ajouter("effort", tour, r.effort);
    if (tour < r.tours) ajouter("pause", tour, r.pause);
  }
  return phases;
}

export function dureeTotale(phases: Phase[]): number {
  const derniere = phases.at(-1);
  return derniere ? derniere.debut + derniere.duree : 0;
}

/**
 * Phase en cours et temps qu'il lui reste, ou null une fois la dernière
 * écoulée.
 */
export function situer(
  phases: Phase[],
  ecouleMs: number,
): { index: number; restantMs: number } | null {
  for (let index = 0; index < phases.length; index++) {
    const finMs = (phases[index].debut + phases[index].duree) * 1000;
    if (ecouleMs < finMs) return { index, restantMs: finMs - ecouleMs };
  }
  return null;
}

/**
 * Secondes à afficher pour un reste donné.
 *
 * Arrondi au supérieur : le compteur montre 1:00 au départ et 0:01 pendant la
 * dernière seconde, puis change de phase. Arrondi au plus proche, il
 * afficherait 0:00 une demi-seconde avant que rien ne sonne.
 */
export function secondesAffichees(restantMs: number): number {
  return Math.max(0, Math.ceil(restantMs / 1000));
}

/** 75 → « 1:15 ». Les minutes ne passent pas aux heures : 75:00 reste lisible. */
export function formaterDuree(secondes: number): string {
  const s = Math.max(0, Math.round(secondes));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Ramène des réglages lus en mémoire ou saisis dans les bornes admises. */
export function bornerReglages(r: Partial<Reglages>): Reglages {
  const borner = (v: unknown, min: number, max: number, defaut: number) =>
    typeof v === "number" && Number.isFinite(v)
      ? Math.min(max, Math.max(min, Math.round(v)))
      : defaut;
  return {
    effort: borner(r.effort, 0, LIMITES.dureeMaxS, REGLAGES_PAR_DEFAUT.effort),
    pause: borner(r.pause, 0, LIMITES.dureeMaxS, REGLAGES_PAR_DEFAUT.pause),
    tours: borner(r.tours, 1, LIMITES.toursMax, REGLAGES_PAR_DEFAUT.tours),
  };
}
