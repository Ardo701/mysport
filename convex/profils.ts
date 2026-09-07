import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { calculerCibles } from "./lib/nutrition";
import { utilisateurConnecte } from "./lib/session";

export const monProfil = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const profil = await ctx.db
      .query("profils")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    const utilisateur = await ctx.db.get(userId);
    return profil === null
      ? null
      : { ...profil, email: utilisateur?.email ?? null };
  },
});

export const enregistrerProfil = mutation({
  args: {
    prenom: v.string(),
    age: v.number(),
    sexe: v.string(),
    tailleCm: v.number(),
    poidsKg: v.number(),
    objectif: v.string(),
    joursParSemaine: v.number(),
    lieu: v.string(),
    niveauActivite: v.number(),
    legumesAimes: v.array(v.string()),
    contraintes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await utilisateurConnecte(ctx);
    const cibles = calculerCibles(args);
    const existant = await ctx.db
      .query("profils")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existant) {
      await ctx.db.patch(existant._id, { ...args, ...cibles });
      return existant._id;
    }

    const id = await ctx.db.insert("profils", {
      userId,
      ...args,
      ...cibles,
      onboardingFait: true,
    });

    // Première pesée, pour démarrer la courbe de progression.
    await ctx.db.insert("mesures", {
      userId,
      date: new Date().toISOString().slice(0, 10),
      poidsKg: args.poidsKg,
    });

    return id;
  },
});

export const modifierCibles = mutation({
  args: {
    kcalCible: v.number(),
    proteinesCible: v.number(),
    glucidesCible: v.number(),
    lipidesCible: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await utilisateurConnecte(ctx);
    const profil = await ctx.db
      .query("profils")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profil) throw new Error("Profil introuvable");
    await ctx.db.patch(profil._id, args);
  },
});
