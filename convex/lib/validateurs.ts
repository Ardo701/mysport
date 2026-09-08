import { v } from "convex/values";

/** Une variante d'exercice : version salle (machine) ou version maison. */
export const varianteValidator = v.object({
  nom: v.string(),
  materiel: v.string(),
  execution: v.string(),
});

export const exerciceValidator = v.object({
  id: v.string(),
  // Facultatif : les programmes enregistrés avant la couche hebdomadaire, et
  // ceux générés par l'IA, n'ont pas de rôle. Ils gardent alors la
  // prescription écrite sur l'exercice lui-même.
  role: v.optional(v.string()), // principal | accessoire | fixe
  nom: v.string(),
  groupes: v.array(v.string()),
  series: v.number(),
  reps: v.string(),
  reposSec: v.number(),
  salle: varianteValidator,
  maison: varianteValidator,
  conseil: v.string(),
});

export const seanceValidator = v.object({
  id: v.string(),
  nom: v.string(),
  focus: v.string(),
  dureeMin: v.number(),
  echauffement: v.array(v.string()),
  exercices: v.array(exerciceValidator),
  finisher: v.optional(v.string()),
});

const doseValidator = v.object({
  series: v.number(),
  reps: v.string(),
  reposSec: v.number(),
  reserve: v.string(),
});

/** Une des semaines du cycle : ce qu'elle demande aux principaux et au reste. */
export const semaineValidator = v.object({
  numero: v.number(),
  bloc: v.string(),
  intention: v.string(),
  principaux: doseValidator,
  accessoires: doseValidator,
  finisherObligatoire: v.boolean(),
});

export const repasValidator = v.object({
  id: v.string(),
  type: v.string(), // petit_dejeuner | dejeuner | diner | collation
  nom: v.string(),
  tempsMin: v.number(),
  ingredients: v.array(v.object({ nom: v.string(), quantite: v.string() })),
  etapes: v.array(v.string()),
  kcal: v.number(),
  proteines: v.number(),
  glucides: v.number(),
  lipides: v.number(),
});

export const detailRepasValidator = v.array(
  v.object({
    aliment: v.string(),
    quantiteEstimee: v.string(),
    kcal: v.number(),
    proteines: v.number(),
    glucides: v.number(),
    lipides: v.number(),
  }),
);
