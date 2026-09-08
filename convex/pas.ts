import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { utilisateurConnecte } from "./lib/session";
import { ajouterJours } from "./lib/dates";

export const pasDuJour = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db
      .query("pasLog")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .unique();
  },
});

/**
 * Écrit le compteur du jour.
 *
 * La valeur remplace la précédente au lieu de s'y ajouter : le téléphone et la
 * montre donnent un cumul depuis minuit, qu'on recopie plusieurs fois dans la
 * journée. Un total à zéro efface la ligne, sinon une saisie erronée resterait
 * comptée comme une journée sans marche.
 */
export const enregistrerPas = mutation({
  args: { date: v.string(), pas: v.number() },
  handler: async (ctx, { date, pas }) => {
    const userId = await utilisateurConnecte(ctx);
    const total = Math.max(0, Math.min(120_000, Math.round(pas)));

    const existant = await ctx.db
      .query("pasLog")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .unique();

    if (total === 0) {
      if (existant) await ctx.db.delete(existant._id);
      return null;
    }
    if (existant) {
      await ctx.db.patch(existant._id, { pas: total });
      return existant._id;
    }
    return await ctx.db.insert("pasLog", { userId, date, pas: total });
  },
});

export const derniersPas = query({
  args: { date: v.string(), jours: v.optional(v.number()) },
  handler: async (ctx, { date, jours }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const depuis = ajouterJours(date, -((jours ?? 14) - 1));
    return await ctx.db
      .query("pasLog")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).gte("date", depuis).lte("date", date),
      )
      .collect();
  },
});
