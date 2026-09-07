/** Calculs nutritionnels : dépense énergétique et répartition des macros. */

export type Objectif = "recomposition" | "seche" | "prise_de_masse";

export type Cibles = {
  kcalCible: number;
  proteinesCible: number;
  glucidesCible: number;
  lipidesCible: number;
};

/** Métabolisme de base — formule de Mifflin-St Jeor. */
export function metabolismeDeBase(
  poidsKg: number,
  tailleCm: number,
  age: number,
  sexe: string,
): number {
  const base = 10 * poidsKg + 6.25 * tailleCm - 5 * age;
  return sexe === "femme" ? base - 161 : base + 5;
}

const AJUSTEMENT: Record<Objectif, number> = {
  // Recomposition : léger déficit, assez pour perdre du gras sans casser la prise de muscle.
  recomposition: -0.13,
  seche: -0.22,
  prise_de_masse: 0.1,
};

const PROTEINES_PAR_KG: Record<Objectif, number> = {
  recomposition: 2.0,
  seche: 2.2,
  prise_de_masse: 1.8,
};

export function calculerCibles(params: {
  poidsKg: number;
  tailleCm: number;
  age: number;
  sexe: string;
  niveauActivite: number;
  objectif: string;
}): Cibles {
  const objectif = (
    ["recomposition", "seche", "prise_de_masse"].includes(params.objectif)
      ? params.objectif
      : "recomposition"
  ) as Objectif;

  const tdee =
    metabolismeDeBase(
      params.poidsKg,
      params.tailleCm,
      params.age,
      params.sexe,
    ) * params.niveauActivite;

  const kcal = Math.round((tdee * (1 + AJUSTEMENT[objectif])) / 10) * 10;

  const proteines = Math.round(params.poidsKg * PROTEINES_PAR_KG[objectif]);
  const lipides = Math.round(params.poidsKg * 0.8);
  const glucides = Math.max(
    80,
    Math.round((kcal - proteines * 4 - lipides * 9) / 4),
  );

  return {
    kcalCible: kcal,
    proteinesCible: proteines,
    glucidesCible: glucides,
    lipidesCible: lipides,
  };
}

/** Répartition indicative des calories entre les repas de la journée. */
export const REPARTITION_REPAS: Record<string, number> = {
  petit_dejeuner: 0.24,
  dejeuner: 0.34,
  diner: 0.32,
  collation: 0.1,
};
