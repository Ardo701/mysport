/**
 * Ressentis notés autour d'une séance : l'état d'esprit en arrivant, l'état
 * en repartant. Facultatifs tous les deux.
 *
 * Rangés du meilleur au moins bon, dans l'ordre où le sélecteur les affiche.
 * Les clés sont enregistrées en base : un libellé peut changer, pas une clé.
 */

export const RESSENTIS_AVANT = [
  { cle: "a-fond", libelle: "À fond" },
  { cle: "motive", libelle: "Motivé" },
  { cle: "bof", libelle: "Bof" },
  { cle: "pas-motive", libelle: "Pas motivé" },
  { cle: "fatigue", libelle: "Fatigué" },
] as const;

export const RESSENTIS_APRES = [
  { cle: "au-top", libelle: "Au top" },
  { cle: "bien", libelle: "Bien" },
  { cle: "moyen", libelle: "Moyen" },
  { cle: "mal", libelle: "Mal" },
  { cle: "vide", libelle: "Vidé" },
] as const;

export type RessentiAvant = (typeof RESSENTIS_AVANT)[number]["cle"];
export type RessentiApres = (typeof RESSENTIS_APRES)[number]["cle"];

export function libelleRessentiAvant(cle: RessentiAvant) {
  return RESSENTIS_AVANT.find((r) => r.cle === cle)!.libelle;
}

export function libelleRessentiApres(cle: RessentiApres) {
  return RESSENTIS_APRES.find((r) => r.cle === cle)!.libelle;
}
