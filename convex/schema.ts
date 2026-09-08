import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  repasValidator,
  seanceValidator,
  semaineValidator,
} from "./lib/validateurs";

export default defineSchema({
  ...authTables,

  /** Profil et objectifs de l'utilisateur. */
  profils: defineTable({
    userId: v.id("users"),
    prenom: v.string(),
    age: v.number(),
    sexe: v.string(), // homme | femme
    tailleCm: v.number(),
    poidsKg: v.number(),
    objectif: v.string(), // recomposition | seche | prise_de_masse
    joursParSemaine: v.number(),
    lieu: v.string(), // mixte | salle | maison
    niveauActivite: v.number(), // multiplicateur TDEE
    legumesAimes: v.array(v.string()),
    contraintes: v.array(v.string()),
    kcalCible: v.number(),
    proteinesCible: v.number(),
    glucidesCible: v.number(),
    lipidesCible: v.number(),
    onboardingFait: v.boolean(),
  }).index("by_user", ["userId"]),

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

  /** Planning : heures de sommeil, de repas et créneaux d'entraînement. */
  plannings: defineTable({
    userId: v.id("users"),
    heureLever: v.string(), // "08:00"
    heureCoucher: v.string(),
    objectifSommeilH: v.number(),
    repas: v.array(
      v.object({
        type: v.string(),
        heure: v.string(),
        actif: v.boolean(),
      }),
    ),
    entrainements: v.array(
      v.object({
        jour: v.number(), // 1 = lundi ... 7 = dimanche
        heure: v.string(),
        seanceId: v.string(),
      }),
    ),
  }).index("by_user", ["userId"]),

  /** Programme d'entraînement actif (préréglé ou généré par l'IA). */
  programmes: defineTable({
    userId: v.id("users"),
    nom: v.string(),
    description: v.string(),
    source: v.string(), // preset | ia
    joursParSemaine: v.number(),
    seances: v.array(seanceValidator),
    // Facultatif, pour la même raison que `role` : un programme enregistré
    // avant cette couche, ou généré par l'IA, n'en a pas et retombe sur les
    // prescriptions écrites dans ses exercices.
    semaines: v.optional(v.array(semaineValidator)),
    progression: v.array(
      v.object({ bloc: v.string(), semaines: v.string(), consigne: v.string() }),
    ),
    debutISO: v.string(), // date de démarrage (lundi de la semaine 1)
    actif: v.boolean(),
  }).index("by_user_actif", ["userId", "actif"]),

  /** Séance réalisée (ou en cours) pour une date donnée. */
  seancesLog: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
    seanceId: v.string(),
    seanceNom: v.string(),
    statut: v.string(), // en_cours | terminee | sautee
    dureeMin: v.optional(v.number()),
    ressenti: v.optional(v.number()), // 1 à 5
    notes: v.optional(v.string()),
    series: v.array(
      v.object({
        exerciceId: v.string(),
        exerciceNom: v.string(),
        variante: v.string(), // salle | maison
        index: v.number(),
        reps: v.optional(v.number()),
        poidsKg: v.optional(v.number()),
        fait: v.boolean(),
      }),
    ),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_user", ["userId"]),

  /** Menu programmé pour une journée (matin / midi / soir / collation). */
  menus: defineTable({
    userId: v.id("users"),
    date: v.string(),
    source: v.string(), // preset | ia
    repas: v.array(repasValidator),
  }).index("by_user_date", ["userId", "date"]),

  /** Ce qui a réellement été mangé. */
  repasLog: defineTable({
    userId: v.id("users"),
    date: v.string(),
    type: v.string(), // petit_dejeuner | dejeuner | diner | collation
    source: v.string(), // menu | photo | manuel
    nom: v.string(),
    kcal: v.number(),
    proteines: v.number(),
    glucides: v.number(),
    lipides: v.number(),
    photoId: v.optional(v.id("_storage")),
    detail: v.optional(
      v.array(
        v.object({
          aliment: v.string(),
          quantiteEstimee: v.string(),
          kcal: v.number(),
          proteines: v.number(),
          glucides: v.number(),
          lipides: v.number(),
        }),
      ),
    ),
    commentaireIA: v.optional(v.string()),
    confiance: v.optional(v.string()),
    heure: v.string(),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_user", ["userId"]),

  /** Nuits enregistrées. */
  sommeilLog: defineTable({
    userId: v.id("users"),
    date: v.string(), // date du réveil
    heureCoucher: v.string(),
    heureLever: v.string(),
    dureeMin: v.number(),
    qualite: v.number(), // 1 à 5
    notes: v.optional(v.string()),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_user", ["userId"]),

  /** Pas de la journée, saisis à la main depuis le téléphone ou la montre. */
  pasLog: defineTable({
    userId: v.id("users"),
    date: v.string(),
    pas: v.number(),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_user", ["userId"]),

  /** Liste de courses construite à partir des menus à venir. */
  courses: defineTable({
    userId: v.id("users"),
    cle: v.string(), // identifiant stable de l'ingrédient
    nom: v.string(),
    quantite: v.string(),
    rayon: v.string(),
    dateBesoin: v.string(), // premier jour où l'ingrédient est nécessaire
    dateAchatConseillee: v.string(),
    achete: v.boolean(),
    dateAchat: v.optional(v.string()),
    source: v.string(), // menu | manuel
  })
    .index("by_user", ["userId"])
    .index("by_user_cle", ["userId", "cle"]),

  /** Suivi du poids et du tour de taille. */
  mesures: defineTable({
    userId: v.id("users"),
    date: v.string(),
    poidsKg: v.number(),
    tourTailleCm: v.optional(v.number()),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_user", ["userId"]),
});
