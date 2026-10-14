/**
 * Langues de l'interface. Le français est la langue d'origine : les clés, les
 * identifiants et les noms enregistrés en base restent en français, seul ce
 * qui s'affiche se traduit.
 */

export type Langue = "fr" | "en";

/** Un libellé dans chaque langue. */
export type Texte = Record<Langue, string>;

/**
 * Formats de dates et de nombres. L'anglais britannique plutôt
 * qu'américain : la semaine commence le lundi et l'on compte en kilos, comme
 * partout ailleurs dans l'application.
 */
export const LOCALES: Record<Langue, string> = {
  fr: "fr-FR",
  en: "en-GB",
};
