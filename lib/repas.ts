export const TYPES_REPAS = [
  { cle: "petit_dejeuner", libelle: "Petit-déjeuner", court: "Matin" },
  { cle: "dejeuner", libelle: "Déjeuner", court: "Midi" },
  { cle: "collation", libelle: "Collation", court: "Collation" },
  { cle: "diner", libelle: "Dîner", court: "Soir" },
  { cle: "extra", libelle: "Grignotage ou boisson", court: "Extra" },
] as const;

export type TypeRepas = (typeof TYPES_REPAS)[number]["cle"];

export function libelleTypeRepas(cle: string): string {
  return TYPES_REPAS.find((t) => t.cle === cle)?.libelle ?? cle;
}

/** Les repas programmés à l'avance ; le midi et les extras passent par l'IA. */
export const REPAS_PROGRAMMES: string[] = ["petit_dejeuner", "collation", "diner"];
