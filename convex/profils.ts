import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
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
  args: { prenom: v.string(), poidsKg: v.number() },
  handler: async (ctx, { prenom, poidsKg }) => {
    const userId = await utilisateurConnecte(ctx);
    const nom = prenom.trim();
    if (!nom) throw new Error("Prénom manquant");
    // Les bornes d'un adulte, pas davantage : le poids ne sert qu'à estimer
    // les calories, et un zéro les annulerait toutes en silence.
    if (!(poidsKg >= 30 && poidsKg <= 250)) throw new Error("Poids hors limites");

    const existant = await ctx.db
      .query("profils")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (existant) {
      await ctx.db.patch(existant._id, { prenom: nom, poidsKg });
      return existant._id;
    }
    return await ctx.db.insert("profils", { userId, prenom: nom, poidsKg });
  },
});
