import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { MATERIELS } from "./data/exercices";
import { RESSENTIS_APRES, RESSENTIS_AVANT } from "./data/ressentis";

/** Un exercice d'une séance, tel que saisi. */
export const exerciceValidator = v.object({
  /** Identifiant du catalogue (`convex/data/exercices.ts`), ou « perso ». */
  exerciceId: v.string(),
  /**
   * Recopié du catalogue à la saisie : la séance reste lisible même si
   * l'exercice est renommé, et c'est le seul nom d'un exercice perso.
   */
  nom: v.string(),
  mesure: v.union(v.literal("series"), v.literal("maintien"), v.literal("duree")),
  series: v.optional(v.number()),
  repetitions: v.optional(v.number()),
  /** Durée d'une série tenue, pour le gainage. */
  secondes: v.optional(v.number()),
  /** Musculation et gainage seulement ; absent des séances saisies avant son ajout. */
  materiel: v.optional(v.union(...MATERIELS.map((m) => v.literal(m.cle)))),
  /** Charge de la barre, de l'haltère, de la machine — ou du lest. */
  chargeKg: v.optional(v.number()),
  dureeMin: v.optional(v.number()),
  distanceKm: v.optional(v.number()),
});

export const ressentiAvantValidator = v.union(...RESSENTIS_AVANT.map((r) => v.literal(r.cle)));
export const ressentiApresValidator = v.union(...RESSENTIS_APRES.map((r) => v.literal(r.cle)));

export default defineSchema({
  ...authTables,

  /** Le strict nécessaire : un prénom pour l'accueil. Le poids vit dans `pesees`. */
  profils: defineTable({
    userId: v.id("users"),
    prenom: v.string(),
  }).index("by_user", ["userId"]),

  /**
   * Le poids au fil du temps, une valeur par jour au plus. Chaque séance est
   * estimée avec la pesée en vigueur à sa date (voir `convex/lib/poids.ts`).
   */
  pesees: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
    poidsKg: v.number(),
  }).index("by_user_date", ["userId", "date"]),

  /** Séances saisies à la main, après coup. */
  seances: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
    dureeMin: v.number(),
    exercices: v.array(exerciceValidator),
    notes: v.optional(v.string()),
    /** L'état d'esprit en arrivant, et celui en repartant (`convex/data/ressentis.ts`). */
    ressentiAvant: v.optional(ressentiAvantValidator),
    ressentiApres: v.optional(ressentiApresValidator),
    /**
     * Estimation faite avec le poids en vigueur à la date de la séance. Une
     * pesée ajoutée ou corrigée la recalcule ; une pesée plus récente que la
     * séance ne la touche pas.
     */
    kcal: v.number(),
    /**
     * Le poids qui a servi à l'estimation : il dit quelles séances une pesée
     * modifiée oblige à recalculer. Absent des toutes premières séances,
     * rattrapées depuis.
     */
    poidsKg: v.optional(v.number()),
  }).index("by_user_date", ["userId", "date"]),

  /**
   * Rattrapages de données déjà appliqués (voir `convex/migrations.ts`).
   *
   * Sans cette trace, un rattrapage relancé à chaque déploiement réécrirait
   * indéfiniment des valeurs que l'utilisateur a pu changer entre-temps.
   */
  migrations: defineTable({
    nom: v.string(),
    appliqueeLe: v.number(),
  }).index("by_nom", ["nom"]),
});
