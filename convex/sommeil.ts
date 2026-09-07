import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { utilisateurConnecte } from "./lib/session";
import { ajouterJours, dureeNuitMin } from "./lib/dates";

export const nuitDuJour = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db
      .query("sommeilLog")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .unique();
  },
});

export const enregistrerNuit = mutation({
  args: {
    date: v.string(),
    heureCoucher: v.string(),
    heureLever: v.string(),
    qualite: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await utilisateurConnecte(ctx);
    const dureeMin = dureeNuitMin(args.heureCoucher, args.heureLever);
    const existant = await ctx.db
      .query("sommeilLog")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).eq("date", args.date),
      )
      .unique();
    if (existant) {
      await ctx.db.patch(existant._id, { ...args, dureeMin });
      return existant._id;
    }
    return await ctx.db.insert("sommeilLog", { userId, ...args, dureeMin });
  },
});

export const dernieresNuits = query({
  args: { date: v.string(), jours: v.optional(v.number()) },
  handler: async (ctx, { date, jours }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const depuis = ajouterJours(date, -((jours ?? 14) - 1));
    return await ctx.db
      .query("sommeilLog")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).gte("date", depuis).lte("date", date),
      )
      .collect();
  },
});
