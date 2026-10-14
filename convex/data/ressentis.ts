/**
 * Ressentis notés autour d'une séance : l'état d'esprit en arrivant, l'état
 * en repartant. Facultatifs tous les deux.
 *
 * Rangés du meilleur au moins bon, dans l'ordre où le sélecteur les affiche.
 * Les clés sont enregistrées en base : un libellé peut changer, pas une clé.
 *
 * Les libellés tiennent en cinq colonnes sur un téléphone : un mot court, ou
 * deux qui passent à la ligne.
 */

import type { Langue, Texte } from "./langues";

export const RESSENTIS_AVANT = [
  { cle: "a-fond", libelle: { fr: "À fond", en: "Pumped" } },
  { cle: "motive", libelle: { fr: "Motivé", en: "Keen" } },
  { cle: "bof", libelle: { fr: "Bof", en: "Meh" } },
  { cle: "pas-motive", libelle: { fr: "Pas motivé", en: "Not keen" } },
  { cle: "fatigue", libelle: { fr: "Fatigué", en: "Tired" } },
] as const satisfies readonly { cle: string; libelle: Texte }[];

export const RESSENTIS_APRES = [
  { cle: "au-top", libelle: { fr: "Au top", en: "Great" } },
  { cle: "bien", libelle: { fr: "Bien", en: "Good" } },
  { cle: "moyen", libelle: { fr: "Moyen", en: "So-so" } },
  { cle: "mal", libelle: { fr: "Mal", en: "Bad" } },
  { cle: "vide", libelle: { fr: "Vidé", en: "Drained" } },
] as const satisfies readonly { cle: string; libelle: Texte }[];

export type RessentiAvant = (typeof RESSENTIS_AVANT)[number]["cle"];
export type RessentiApres = (typeof RESSENTIS_APRES)[number]["cle"];

export function libelleRessentiAvant(cle: RessentiAvant, langue: Langue) {
  return RESSENTIS_AVANT.find((r) => r.cle === cle)!.libelle[langue];
}

export function libelleRessentiApres(cle: RessentiApres, langue: Langue) {
  return RESSENTIS_APRES.find((r) => r.cle === cle)!.libelle[langue];
}
