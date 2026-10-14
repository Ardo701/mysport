import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { poidsValide } from "./lib/poids";
import { utilisateurConnecte } from "./lib/session";

export const monProfil = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const profil = await profilDe(ctx, userId);
    const utilisateur = await ctx.db.get(userId);
    return profil === null
      ? null
      : { _id: profil._id, prenom: profil.prenom, email: utilisateur?.email ?? null };
  },
});

/** Premier passage : le prénom, et le poids du jour comme première pesée. */
export const creerProfil = mutation({
  args: { prenom: v.string(), poidsKg: v.number(), date: v.string() },
  handler: async (ctx, { prenom, poidsKg, date }) => {
    const userId = await utilisateurConnecte(ctx);
    const nom = verifierPrenom(prenom);
    if (!poidsValide(poidsKg)) throw new Error("Poids hors limites");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Date invalide");

    // Un double envoi depuis l'écran d'accueil ne crée pas un second profil.
    const existant = await profilDe(ctx, userId);
    if (existant) return existant._id;

    await ctx.db.insert("pesees", { userId, date, poidsKg });
    return await ctx.db.insert("profils", { userId, prenom: nom });
  },
});

export const enregistrerProfil = mutation({
  args: { prenom: v.string() },
  handler: async (ctx, { prenom }) => {
    const userId = await utilisateurConnecte(ctx);
    const nom = verifierPrenom(prenom);
    const existant = await profilDe(ctx, userId);
    if (!existant) throw new Error("Profil introuvable");
    await ctx.db.patch(existant._id, { prenom: nom });
    return existant._id;
  },
});

function profilDe(ctx: QueryCtx, userId: Id<"users">) {
  return ctx.db
    .query("profils")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
}

function verifierPrenom(prenom: string) {
  const nom = prenom.trim();
  if (!nom) throw new Error("Prénom manquant");
  return nom;
}
