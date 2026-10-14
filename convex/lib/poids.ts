/**
 * Le poids d'un jour donné, à partir des pesées.
 *
 * Partagé entre le serveur, qui estime les séances à l'enregistrement, et
 * l'écran de saisie, qui affiche la même estimation avant d'enregistrer.
 */

export type Pesee = { date: string; poidsKg: number };

/**
 * Les bornes d'un adulte, pas davantage : le poids ne sert qu'à estimer les
 * calories, et un zéro les annulerait toutes en silence.
 */
export const POIDS_MIN = 30;
export const POIDS_MAX = 250;

export function poidsValide(poidsKg: number | undefined): poidsKg is number {
  return poidsKg !== undefined && poidsKg >= POIDS_MIN && poidsKg <= POIDS_MAX;
}

/**
 * La dernière pesée faite ce jour-là ou avant. Une séance plus ancienne que
 * toutes les pesées prend la première : c'est le poids connu le plus proche,
 * et le seul qui existe quand on note après coup des séances d'avant
 * l'inscription. Undefined seulement s'il n'y a aucune pesée.
 */
export function poidsALaDate(pesees: Pesee[], date: string): number | undefined {
  let enVigueur: Pesee | undefined;
  let premiere: Pesee | undefined;
  for (const p of pesees) {
    if (p.date <= date && (!enVigueur || p.date > enVigueur.date)) enVigueur = p;
    if (!premiere || p.date < premiere.date) premiere = p;
  }
  return (enVigueur ?? premiere)?.poidsKg;
}
