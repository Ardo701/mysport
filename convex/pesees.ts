import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { estimerKcal } from "./lib/calories";
import { poidsALaDate, poidsValide } from "./lib/poids";
import { utilisateurConnecte } from "./lib/session";

/** Toutes les pesées, de la plus récente à la plus ancienne. */
export const mesPesees = query({
  args: {},
  handler: async (ctx) => {
    const userId = await utilisateurConnecte(ctx);
    return await peseesDe(ctx, userId, "desc");
  },
});

/**
 * Ajoute une pesée, ou remplace celle du même jour : une seule valeur par
 * date, sinon le poids en vigueur ce jour-là serait ambigu.
 *
 * Renvoie le nombre de séances recalculées, pour le dire à l'écran.
 */
export const enregistrer = mutation({
  args: { date: v.string(), poidsKg: v.number() },
  handler: async (ctx, { date, poidsKg }) => {
    const userId = await utilisateurConnecte(ctx);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Date invalide");
    if (!poidsValide(poidsKg)) throw new Error("Poids hors limites");

    const meme = await ctx.db
      .query("pesees")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .unique();
    if (meme) await ctx.db.patch(meme._id, { poidsKg });
    else await ctx.db.insert("pesees", { userId, date, poidsKg });

    return await recalculerSeances(ctx, userId);
  },
});

export const supprimer = mutation({
  args: { id: v.id("pesees") },
  handler: async (ctx, { id }) => {
    const userId = await utilisateurConnecte(ctx);
    const pesee = await ctx.db.get(id);
    if (!pesee || pesee.userId !== userId) throw new Error("Pesée introuvable");

    // Sans aucune pesée, plus aucune séance ne pourrait s'estimer.
    const pesees = await peseesDe(ctx, userId, "asc");
    if (pesees.length <= 1) throw new Error("Dernière pesée");

    await ctx.db.delete(id);
    return await recalculerSeances(ctx, userId);
  },
});

export async function peseesDe(ctx: QueryCtx, userId: Id<"users">, ordre: "asc" | "desc") {
  return await ctx.db
    .query("pesees")
    .withIndex("by_user_date", (q) => q.eq("userId", userId))
    .order(ordre)
    .collect();
}

/** Le poids en vigueur à une date, selon la règle de `poidsALaDate`. */
export async function poidsDuJour(ctx: QueryCtx, userId: Id<"users">, date: string) {
  const enVigueur = await ctx.db
    .query("pesees")
    .withIndex("by_user_date", (q) => q.eq("userId", userId).lte("date", date))
    .order("desc")
    .first();
  const pesee =
    enVigueur ??
    (await ctx.db
      .query("pesees")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .order("asc")
      .first());
  if (!pesee) throw new Error("Aucune pesée");
  return pesee.poidsKg;
}

/**
 * Réestime les séances dont le poids en vigueur n'est plus celui qui a servi
 * à leur calcul. Une pesée touche les séances qui la suivent jusqu'à la
 * pesée suivante — ou, si c'est la première, celles d'avant aussi.
 *
 * Tout l'historique est relu plutôt que la seule plage concernée : quelques
 * centaines de séances tiennent largement dans une mutation, et la règle reste
 * écrite une seule fois, dans `poidsALaDate`.
 */
export async function recalculerSeances(ctx: MutationCtx, userId: Id<"users">) {
  const pesees = await peseesDe(ctx, userId, "asc");
  const seances = await ctx.db
    .query("seances")
    .withIndex("by_user_date", (q) => q.eq("userId", userId))
    .collect();

  let recalculees = 0;
  for (const seance of seances) {
    const poidsKg = poidsALaDate(pesees, seance.date);
    if (poidsKg === undefined || poidsKg === seance.poidsKg) continue;
    await ctx.db.patch(seance._id, {
      poidsKg,
      kcal: estimerKcal({ dureeMin: seance.dureeMin, exercices: seance.exercices }, poidsKg),
    });
    recalculees += 1;
  }
  return recalculees;
}
