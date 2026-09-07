import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { utilisateurConnecte } from "./lib/session";
import { PLANNING_DEFAUT_ENTRAINEMENTS } from "./data/programme";

const PLANNING_DEFAUT = {
  heureLever: "07:00",
  heureCoucher: "23:00",
  objectifSommeilH: 8,
  repas: [
    { type: "petit_dejeuner", heure: "07:30", actif: true },
    { type: "dejeuner", heure: "12:30", actif: true },
    { type: "collation", heure: "16:30", actif: true },
    { type: "diner", heure: "19:30", actif: true },
  ],
  entrainements: PLANNING_DEFAUT_ENTRAINEMENTS,
};

export const monPlanning = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const planning = await ctx.db
      .query("plannings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    return planning ?? { ...PLANNING_DEFAUT, userId, _id: null, _creationTime: 0 };
  },
});

export const enregistrerPlanning = mutation({
  args: {
    heureLever: v.string(),
    heureCoucher: v.string(),
    objectifSommeilH: v.number(),
    repas: v.array(
      v.object({ type: v.string(), heure: v.string(), actif: v.boolean() }),
    ),
    entrainements: v.array(
      v.object({ jour: v.number(), heure: v.string(), seanceId: v.string() }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await utilisateurConnecte(ctx);
    const existant = await ctx.db
      .query("plannings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (existant) {
      await ctx.db.patch(existant._id, args);
      return existant._id;
    }
    return await ctx.db.insert("plannings", { userId, ...args });
  },
});

export const creerPlanningParDefaut = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await utilisateurConnecte(ctx);
    const existant = await ctx.db
      .query("plannings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (existant) return existant._id;
    return await ctx.db.insert("plannings", { userId, ...PLANNING_DEFAUT });
  },
});
