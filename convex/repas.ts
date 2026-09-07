import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { repasValidator } from "./lib/validateurs";
import { utilisateurConnecte } from "./lib/session";
import { menuPreset } from "./lib/menus";

export const menuDuJour = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const enregistre = await ctx.db
      .query("menus")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .unique();
    if (enregistre) return { source: enregistre.source, repas: enregistre.repas };
    return { source: "preset", repas: menuPreset(date) };
  },
});

export const journalDuJour = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("repasLog")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .collect();
  },
});

export const enregistrerRepas = mutation({
  args: {
    date: v.string(),
    type: v.string(),
    source: v.string(),
    nom: v.string(),
    kcal: v.number(),
    proteines: v.number(),
    glucides: v.number(),
    lipides: v.number(),
    heure: v.string(),
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
  },
  handler: async (ctx, args) => {
    const userId = await utilisateurConnecte(ctx);
    return await ctx.db.insert("repasLog", { userId, ...args });
  },
});

export const supprimerRepas = mutation({
  args: { id: v.id("repasLog") },
  handler: async (ctx, { id }) => {
    const userId = await utilisateurConnecte(ctx);
    const ligne = await ctx.db.get(id);
    if (!ligne || ligne.userId !== userId) throw new Error("Repas introuvable");
    if (ligne.photoId) await ctx.storage.delete(ligne.photoId);
    await ctx.db.delete(id);
  },
});

/** Remplace le menu d'une journée par une version générée par l'IA. */
export const enregistrerMenuIA = internalMutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    repas: v.array(repasValidator),
  },
  handler: async (ctx, { userId, date, repas }) => {
    const existant = await ctx.db
      .query("menus")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .unique();
    if (existant) {
      await ctx.db.patch(existant._id, { repas, source: "ia" });
      return existant._id;
    }
    return await ctx.db.insert("menus", { userId, date, source: "ia", repas });
  },
});

export const reinitialiserMenu = mutation({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const userId = await utilisateurConnecte(ctx);
    const existant = await ctx.db
      .query("menus")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .unique();
    if (existant) await ctx.db.delete(existant._id);
  },
});

/** URL de la photo d'un repas (le stockage Convex sert des URLs signées). */
export const urlPhoto = query({
  args: { photoId: v.id("_storage") },
  handler: async (ctx, { photoId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.storage.getUrl(photoId);
  },
});
