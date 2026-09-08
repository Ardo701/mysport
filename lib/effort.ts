/**
 * Dépense de la journée : ce que coûtent les pas et la séance.
 *
 * Les cibles du profil sont calculées avec un multiplicateur d'activité qui
 * couvre déjà « ce que tu bouges en dehors du sport ». Ajouter la dépense de
 * marche entière par-dessus compterait donc deux fois la même énergie : seul
 * l'écart avec le rythme habituel ouvre des calories supplémentaires.
 */

export type ProfilEffort = {
  poidsKg: number;
  tailleCm: number;
  niveauActivite: number;
  kcalCible: number;
};

/** Longueur de foulée en mètres, approximation usuelle en marche. */
export function longueurFouleeM(tailleCm: number): number {
  return (tailleCm / 100) * 0.415;
}

export function distanceKm(pas: number, tailleCm: number): number {
  return (pas * longueurFouleeM(tailleCm)) / 1000;
}

/**
 * Coût de la marche, en comptant 0,5 kcal par kilo et par kilomètre.
 *
 * C'est le coût *net*, au-dessus du métabolisme de repos : c'est celui qui a un
 * sens ici, puisque le métabolisme est déjà dans la cible.
 */
export function kcalMarche(pas: number, poidsKg: number, tailleCm: number): number {
  return Math.round(distanceKm(pas, tailleCm) * poidsKg * 0.5);
}

/** Nombre de pas que suppose déjà le niveau d'activité déclaré au profil. */
export function pasDeReference(niveauActivite: number): number {
  if (niveauActivite <= 1.4) return 4000; // sédentaire
  if (niveauActivite <= 1.57) return 7000; // modérée
  return 10000; // active
}

/**
 * Calories gagnées (ou perdues) par rapport au rythme habituel.
 *
 * Bornée des deux côtés : une journée exceptionnelle ne doit pas transformer la
 * cible en autre chose, et une journée immobile ne doit pas la vider.
 */
export function ecartKcalPas(pas: number, profil: ProfilEffort): number {
  const reel = kcalMarche(pas, profil.poidsKg, profil.tailleCm);
  const habituel = kcalMarche(
    pasDeReference(profil.niveauActivite),
    profil.poidsKg,
    profil.tailleCm,
  );
  const ecart = Math.max(-250, Math.min(500, reel - habituel));
  return Math.round(ecart / 10) * 10;
}

/** Coût d'une séance de musculation : 5 METs, soit 0,0875 kcal par kilo et par minute. */
export function kcalSeance(dureeMin: number, poidsKg: number): number {
  return Math.round(5 * poidsKg * 0.0175 * dureeMin);
}

export type EffortDuJour = {
  pas: number | null;
  distanceKm: number;
  kcalMarche: number;
  kcalSeance: number;
  kcalTotal: number;
  ecartPas: number;
  kcalCible: number;
  pasReference: number;
};

/**
 * Résumé de l'effort d'une journée, cible du jour comprise.
 *
 * Tant que les pas ne sont pas saisis, la cible reste celle du profil : une
 * journée non renseignée n'est pas une journée sans marche.
 */
export function effortDuJour(
  profil: ProfilEffort,
  pas: number | null,
  seanceDureeMin: number | null,
): EffortDuJour {
  const marche = pas === null ? 0 : kcalMarche(pas, profil.poidsKg, profil.tailleCm);
  const seance =
    seanceDureeMin === null ? 0 : kcalSeance(seanceDureeMin, profil.poidsKg);
  const ecart = pas === null ? 0 : ecartKcalPas(pas, profil);

  return {
    pas,
    distanceKm: pas === null ? 0 : distanceKm(pas, profil.tailleCm),
    kcalMarche: marche,
    kcalSeance: seance,
    kcalTotal: marche + seance,
    ecartPas: ecart,
    kcalCible: profil.kcalCible + ecart,
    pasReference: pasDeReference(profil.niveauActivite),
  };
}

/** Objectif de pas affiché : le rythme habituel, arrondi vers le haut au millier. */
export function objectifPas(niveauActivite: number): number {
  return Math.max(8000, pasDeReference(niveauActivite));
}
