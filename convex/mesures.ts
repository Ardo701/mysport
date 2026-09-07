import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { utilisateurConnecte } from "./lib/session";

export const historiqueMesures = query({
  args: { limite: v.optional(v.number()) },
  handler: async (ctx, { limite }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const lignes = await ctx.db
      .query("mesures")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limite ?? 60);
    return lignes.reverse();
  },
});

export const enregistrerMesure = mutation({
  args: {
    date: v.string(),
    poidsKg: v.number(),
    tourTailleCm: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await utilisateurConnecte(ctx);
    const existant = await ctx.db
      .query("mesures")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).eq("date", args.date),
      )
      .unique();
    if (existant) {
      await ctx.db.patch(existant._id, args);
    } else {
      await ctx.db.insert("mesures", { userId, ...args });
    }

    // Le poids du profil suit la dernière pesée.
    const profil = await ctx.db
      .query("profils")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (profil) await ctx.db.patch(profil._id, { poidsKg: args.poidsKg });
  },
});
