import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

export const profilDe = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("profils")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const seancesRecentes = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("seancesLog")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(10);
  },
});
